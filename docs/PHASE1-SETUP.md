# Phase 1: Setup Foundation - Complete Instructions

## ✅ Prerequisites

Before starting, ensure you have:

- **Node.js** v18+ installed
- **MySQL** 8.0+ installed and running
- **Redis** 6+ installed and running (optional but recommended)
- **Git** installed

---

## 📦 Step-by-Step Setup

### **1. Create Project Structure**

```bash
# Option A: Using the provided script (Linux/Mac)
chmod +x setup-project.sh
./setup-project.sh

# Option B: Manual creation
mkdir -p wa-gate-v2
cd wa-gate-v2
# Then create all folders manually as per structure
```

### **2. Initialize npm and Install Dependencies**

```bash
# Initialize package.json
npm init -y

# Copy the provided package.json content
# Then install
npm install

# Verify installation
npm list --depth=0
```

### **3. Configure Environment Variables**

```bash
# Copy example env file
cp .env.example .env

# Edit .env file with your actual values
nano .env  # or use your preferred editor
```

**Important configurations to change:**

```bash
# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wa_gate_v2
DB_USER=root
DB_PASSWORD=your_actual_mysql_password

# JWT Secrets (generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long-change-this
JWT_REFRESH_SECRET=your-refresh-token-secret-key-min-32-chars-change-this
SESSION_SECRET=your-session-secret-min-32-chars-long-change-this

# API Keys (generate secure random strings)
API_KEY_ADMIN=wa_gate_admin_key_change_this_in_production_min_32_chars
API_KEY_USER=wa_gate_user_key_change_this_in_production_min_32_chars

# Dashboard Credentials
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=Th3Glo0myGloryEnds!

# Redis (if using)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

**Generate secure random strings:**

```bash
# Linux/Mac
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use online generator:
# https://randomkeygen.com/
```

### **4. Create MySQL Database**

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE wa_gate_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create dedicated user (recommended)
CREATE USER 'wagate'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON wa_gate_v2.* TO 'wagate'@'localhost';
FLUSH PRIVILEGES;

# Exit MySQL
EXIT;
```

### **5. Create Required Folders**

```bash
# Create folders that are gitignored
mkdir -p logs auth uploads/temp uploads/media
```

### **6. Run Database Migration**

```bash
# This will create all tables
npm run db:migrate
```

**Expected output:**
```
🔄 Starting database migration...
✅ Database connection established.
✅ All models synchronized successfully.
📊 Created tables: [
  'users',
  'messages',
  'contacts',
  'broadcasts',
  'webhooks',
  'api_keys',
  'audit_logs',
  'qr_history'
]
🎉 Migration completed successfully!
```

### **7. Seed Initial Data**

```bash
# This will create default admin, operator, and API keys
npm run db:seed
```

**Expected output:**
```
🌱 Starting database seeding...
✅ Admin user created: admin
✅ Operator user created: operator
✅ Admin API Key created: wa_xxxxx...
✅ Default webhook created: Laravel Webhook
🎉 Database seeding completed successfully!

📝 Default Credentials:
   Admin:
   - Username: admin
   - Password: Th3Glo0myGloryEnds!

   Operator:
   - Username: operator
   - Password: Operator123!

⚠️  IMPORTANT: Change these passwords in production!
```

### **8. Verify Setup**

```bash
# Check if all folders exist
ls -la

# Check database tables
mysql -u root -p wa_gate_v2 -e "SHOW TABLES;"

# Check if config loads without errors
node -e "console.log(require('./src/config'))"
```

---

## 🧪 Testing Phase 1 Setup

Create a test file to verify everything works:

**File: `test-setup.js`**

```javascript
const config = require('./src/config');
const { testConnection } = require('./src/config/database');
const { testRedisConnection } = require('./src/config/redis');
const logger = require('./src/utils/logger');
const { User, ApiKey } = require('./src/models');

async function testSetup() {
  console.log('🧪 Testing Phase 1 Setup...\n');

  // Test 1: Config Loading
  console.log('1️⃣ Testing Configuration...');
  console.log('   App Name:', config.app.name);
  console.log('   Environment:', config.env);
  console.log('   Port:', config.app.port);
  console.log('   ✅ Config loaded successfully\n');

  // Test 2: Database Connection
  console.log('2️⃣ Testing Database Connection...');
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('   ❌ Database connection failed');
    process.exit(1);
  }
  console.log('   ✅ Database connected\n');

  // Test 3: Redis Connection (optional)
  console.log('3️⃣ Testing Redis Connection...');
  try {
    await testRedisConnection();
    console.log('   ✅ Redis connected\n');
  } catch (error) {
    console.log('   ⚠️  Redis not available (optional)\n');
  }

  // Test 4: Models
  console.log('4️⃣ Testing Models...');
  const userCount = await User.count();
  const apiKeyCount = await ApiKey.count();
  console.log('   Users in database:', userCount);
  console.log('   API Keys in database:', apiKeyCount);
  console.log('   ✅ Models working\n');

  // Test 5: Logger
  console.log('5️⃣ Testing Logger...');
  logger.info('Test log message');
  logger.error('Test error message');
  logger.security('Test security message');
  console.log('   ✅ Logger working\n');

  console.log('🎉 All Phase 1 tests passed!\n');
  process.exit(0);
}

testSetup().catch((error) => {
  console.error('❌ Setup test failed:', error);
  process.exit(1);
});
```

**Run the test:**

```bash
node test-setup.js
```

---

## 📊 Database Schema Overview

After migration, you should have these tables:

```
wa_gate_v2
├── users              (Admin, operators, users)
├── messages           (Message history)
├── contacts           (Saved contacts)
├── broadcasts         (Broadcast campaigns)
├── webhooks           (Webhook configurations)
├── api_keys           (API key management)
├── audit_logs         (Activity logging)
└── qr_history         (QR code history)
```

---

## 🔍 Troubleshooting

### **Issue: Cannot connect to MySQL**

```bash
# Check MySQL is running
sudo systemctl status mysql

# Check MySQL credentials
mysql -u root -p

# Reset MySQL password if needed
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'new_password';
FLUSH PRIVILEGES;
```

### **Issue: Config validation error**

```bash
# Check .env file exists
ls -la .env

# Verify all required variables are set
cat .env | grep -v "^#" | grep -v "^$"

# Generate missing secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **Issue: Cannot create logs folder**

```bash
# Create with proper permissions
mkdir -p logs
chmod 755 logs
```

### **Issue: Redis connection failed**

```bash
# Check Redis is running
redis-cli ping

# Start Redis
sudo systemctl start redis

# Or install Redis
# Ubuntu/Debian:
sudo apt install redis-server

# Mac:
brew install redis
brew services start redis
```

---

## ✅ Phase 1 Checklist

Mark completed items:

- [ ] Project structure created
- [ ] Dependencies installed
- [ ] .env configured
- [ ] MySQL database created
- [ ] Tables migrated
- [ ] Initial data seeded
- [ ] Logs folder created
- [ ] Config validation passing
- [ ] Database connection working
- [ ] Redis connection working (optional)
- [ ] Test script passing

---

## 🎯 Next Steps

Once Phase 1 is complete, proceed to:

- **Phase 2:** Core Services (WhatsApp, Message, QR, Auth)
- **Phase 3:** API Layer (Controllers, Routes, Middlewares)
- **Phase 4:** Advanced Features (Broadcast, Webhook, Queue)
- **Phase 5:** Frontend (Dashboard, Broadcast UI)
- **Phase 6:** Testing & Deployment

---

## 📞 Support

If you encounter issues:

1. Check logs in `logs/` folder
2. Verify .env configuration
3. Check MySQL and Redis status
4. Review error messages carefully

---

## 📝 Notes

- **Never commit** `.env` file to git
- **Change default passwords** before production
- **Backup database** before migrations
- **Keep logs** for troubleshooting