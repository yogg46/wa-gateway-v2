# Phase 2: Core Services - Testing Guide

## ✅ Services Implemented

1. **Utils & Helpers**
   - ✅ constants.js - Application constants
   - ✅ helpers.js - Helper functions
   - ✅ response.js - Standard API responses
   - ✅ errors.js - Custom error classes

2. **WhatsApp Service**
   - ✅ Baileys integration
   - ✅ Auto reconnect with retry
   - ✅ QR code generation
   - ✅ Message sending (text, image, video, document)
   - ✅ Event handling (connection, messages)
   - ✅ Session management

3. **Auth Service**
   - ✅ JWT authentication
   - ✅ Refresh token
   - ✅ User CRUD operations
   - ✅ API key management
   - ✅ Password hashing
   - ✅ Audit logging

4. **QR Service**
   - ✅ QR code generation & management
   - ✅ QR history tracking
   - ✅ Auto expiration
   - ✅ Statistics

5. **Message Service**
   - ✅ Send text/image/video/document
   - ✅ Message history
   - ✅ Contact management
   - ✅ Message statistics
   - ✅ Search functionality

6. **Queue Service**
   - ✅ Bull queue integration
   - ✅ Message queue
   - ✅ Broadcast queue
   - ✅ Webhook queue
   - ✅ Job management
   - ✅ Queue statistics

---

## 🧪 Testing Phase 2

### **1. Create Test File**

Create `test-phase2.js`:

```javascript
const whatsappService = require('./src/services/whatsapp.service');
const authService = require('./src/services/auth.service');
const qrService = require('./src/services/qr.service');
const messageService = require('./src/services/message.service');
const queueService = require('./src/services/queue.service');
const logger = require('./src/utils/logger');

async function testPhase2() {
  console.log('🧪 Testing Phase 2: Core Services\n');

  try {
    // Test 1: Logger
    console.log('1️⃣ Testing Logger...');
    logger.info('Test info log');
    logger.error('Test error log');
    logger.security('Test security log');
    console.log('   ✅ Logger working\n');

    // Test 2: Auth Service
    console.log('2️⃣ Testing Auth Service...');
    const loginResult = await authService.login(
      'admin',
      'Th3Glo0myGloryEnds!',
      '127.0.0.1',
      'Test-Agent'
    );
    console.log('   Access Token:', loginResult.accessToken.substring(0, 20) + '...');
    console.log('   ✅ Auth service working\n');

    // Test 3: Queue Service
    console.log('3️⃣ Testing Queue Service...');
    await queueService.initialize();
    const queueStats = await queueService.getAllQueuesStats();
    console.log('   Queue Stats:', queueStats);
    console.log('   ✅ Queue service working\n');

    // Test 4: WhatsApp Service
    console.log('4️⃣ Testing WhatsApp Service...');
    await whatsappService.initialize();
    const socketInfo = whatsappService.getSocketInfo();
    console.log('   Connection State:', socketInfo.connectionState);
    console.log('   Has QR:', socketInfo.hasQR);
    console.log('   ✅ WhatsApp service initialized\n');

    // Test 5: QR Service
    console.log('5️⃣ Testing QR Service...
   QR available, expires in: 58234 ms
   ✅ QR service working

6️⃣ Testing Message Service...
   Message Stats: {
     total: 0,
     sent: 0,
     delivered: 0,
     read: 0,
     failed: 0,
     successRate: '0%',
     deliveryRate: '0%',
     readRate: '0%'
   }
   ✅ Message service working

🎉 All Phase 2 tests passed!

⚠️  Note: WhatsApp connection may require QR scan
   Check logs/ folder for detailed logs

✅ Tests completed. Press Ctrl+C to exit.
```

---

## 🔧 Troubleshooting

### **Issue: Redis connection failed**

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# If not running:
sudo systemctl start redis

# Or install Redis:
# Ubuntu/Debian
sudo apt install redis-server

# Mac
brew install redis
brew services start redis
```

### **Issue: WhatsApp not connecting**

```bash
# Check auth folder
ls -la auth/

# Clear session if needed
rm -rf auth/

# Restart test
node test-phase2.js
```

### **Issue: Module not found**

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## 📝 Manual Testing Checklist

### **Auth Service Testing:**

```javascript
// Test login
const result = await authService.login('admin', 'password', '127.0.0.1', 'TestAgent');
console.log(result.accessToken);

// Test token verification
const decoded = authService.verifyAccessToken(result.accessToken);
console.log(decoded);

// Test create user
const newUser = await authService.createUser({
  username: 'testuser',
  email: 'test@example.com',
  password: 'Test123!',
  role: 'user',
});
console.log(newUser);

// Test API key creation
const apiKey = await authService.createApiKey(1, 'Test Key', ['messages:send']);
console.log(apiKey.key);
```

### **Queue Service Testing:**

```javascript
// Add message to queue
await queueService.addToMessageQueue({
  to: '628123456789',
  message: 'Test message',
  messageType: 'text',
});

// Get queue stats
const stats = await queueService.getQueueStats('message-queue');
console.log(stats);

// Get jobs
const jobs = await queueService.getQueueJobs('message-queue', 'waiting');
console.log(jobs);
```

### **Message Service Testing (After Connected):**

```javascript
// Send text message
const message = await messageService.sendTextMessage(
  '628123456789',
  'Hello from WA-Gate v2!'
);
console.log(message);

// Get message history
const history = await messageService.getMessageHistory({}, { page: 1, limit: 10 });
console.log(history);

// Get contacts
const contacts = await messageService.getContactsWithMessageCount(10);
console.log(contacts);
```

---

## 🔍 Verify Logs

Check log files in `logs/` folder:

```bash
# View combined logs
tail -f logs/combined-*.log

# View error logs
tail -f logs/error-*.log

# View security logs
tail -f logs/security-*.log
```

---

## 📊 Database Verification

Check database records:

```sql
-- Check users
SELECT id, username, email, role, isActive FROM users;

-- Check messages
SELECT id, messageId, `from`, `to`, messageType, status 
FROM messages 
ORDER BY createdAt DESC 
LIMIT 10;

-- Check QR history
SELECT id, status, generatedAt, scannedAt 
FROM qr_history 
ORDER BY generatedAt DESC 
LIMIT 10;

-- Check audit logs
SELECT id, userId, action, status, createdAt 
FROM audit_logs 
ORDER BY createdAt DESC 
LIMIT 10;

-- Check API keys
SELECT id, name, `key`, isActive, lastUsedAt 
FROM api_keys;
```

---

## 🎯 Integration Testing

### **Test WhatsApp Flow:**

1. **Start service**
   ```bash
   node test-phase2.js
   ```

2. **Scan QR code** (if not connected)
   - Open WhatsApp on phone
   - Go to Settings > Linked Devices
   - Scan QR from console or check logs

3. **Test message sending**
   ```javascript
   // After connected
   await messageService.sendTextMessage('628123456789', 'Test message');
   ```

4. **Verify in database**
   ```sql
   SELECT * FROM messages ORDER BY createdAt DESC LIMIT 1;
   ```

### **Test Queue Flow:**

1. **Add jobs to queue**
   ```javascript
   await queueService.addToMessageQueue({
     to: '628123456789',
     message: 'Queue test',
     messageType: 'text',
   });
   ```

2. **Monitor queue**
   ```javascript
   const stats = await queueService.getAllQueuesStats();
   console.log(stats);
   ```

3. **Check logs**
   ```bash
   tail -f logs/combined-*.log | grep "Processing message job"
   ```

---

## ✅ Phase 2 Success Criteria

Mark completed items:

- [ ] All utils/helpers working
- [ ] Logger creating log files
- [ ] Auth service login working
- [ ] JWT tokens generated
- [ ] API keys created
- [ ] Queue service initialized
- [ ] All queues created (message, broadcast, webhook)
- [ ] WhatsApp service initialized
- [ ] QR code generated
- [ ] Message service ready
- [ ] Database records created correctly
- [ ] No errors in logs

---

## 🎯 Next Steps (Phase 3)

Once Phase 2 is complete, proceed to:

**Phase 3: API Layer**
- Controllers (auth, message, qr, whatsapp, broadcast)
- Routes (API endpoints)
- Middlewares (auth, validation, rate limiting, error handling)
- Validators (Joi schemas)

---

## 📞 Common Issues & Solutions

### **1. Port Already in Use**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### **2. Database Connection Error**
```bash
# Check MySQL status
sudo systemctl status mysql

# Check credentials
mysql -u root -p
```

### **3. Redis Connection Error**
```bash
# Check Redis status
redis-cli ping

# Check Redis config
redis-cli config get bind
```

### **4. WhatsApp Session Error**
```bash
# Clear session
rm -rf auth/

# Restart service
node test-phase2.js
```

### **5. Queue Jobs Stuck**
```javascript
// Clean stuck jobs
await queueService.cleanQueue('message-queue', 0, 'failed');
await queueService.cleanQueue('message-queue', 0, 'completed');

// Resume queue
await queueService.resumeQueue('message-queue');
```

---

## 📝 Notes

- **Keep test script running** to maintain WhatsApp connection
- **Check logs regularly** for errors
- **QR expires in 60 seconds** by default
- **Queue processes run in background**
- **Database records are persistent**

---

## 🎉 Phase 2 Complete!

You now have:
- ✅ **5 Core Services** fully implemented
- ✅ **WhatsApp Integration** with Baileys
- ✅ **Authentication System** with JWT
- ✅ **Message Queue** with Bull
- ✅ **QR Management** system
- ✅ **Message Handling** service
- ✅ **Structured Logging** with Winston
- ✅ **Database Models** working

**Ready for Phase 3?** 🚀
...');
    const currentQR = qrService.getCurrentQR();
    if (currentQR) {
      console.log('   QR available, expires in:', currentQR.expiresIn, 'ms');
    } else {
      console.log('   No QR available (may be already connected)');
    }
    console.log('   ✅ QR service working\n');

    // Test 6: Message Service (only if connected)
    console.log('6️⃣ Testing Message Service...');
    const messageStats = await messageService.getMessageStats();
    console.log('   Message Stats:', messageStats);
    console.log('   ✅ Message service working\n');

    console.log('🎉 All Phase 2 tests passed!\n');
    console.log('⚠️  Note: WhatsApp connection may require QR scan');
    console.log('   Check logs/ folder for detailed logs');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    // Don't close connections (keep app running)
    console.log('\n✅ Tests completed. Press Ctrl+C to exit.');
  }
}

testPhase2();
```

### **2. Run Tests**

```bash
# Make sure MySQL and Redis are running
node test-phase2.js
```

---

## 📊 Expected Output

```
🧪 Testing Phase 2: Core Services

1️⃣ Testing Logger...
   ✅ Logger working

2️⃣ Testing Auth Service...
   Access Token: eyJhbGciOiJIUzI1NiIs...
   ✅ Auth service working

3️⃣ Testing Queue Service...
   Queue Stats: {
     'message-queue': { waiting: 0, active: 0, ... },
     'broadcast-queue': { waiting: 0, active: 0, ... },
     'webhook-queue': { waiting: 0, active: 0, ... }
   }
   ✅ Queue service working

4️⃣ Testing WhatsApp Service...
   Connection State: close
   Has QR: true
   ✅ WhatsApp service initialized

5️⃣ Testing QR Service