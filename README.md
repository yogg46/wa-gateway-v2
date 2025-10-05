# 📘 WA-Gate v2

**WA-Gate v2** adalah **WhatsApp Gateway API** yang dirancang untuk kebutuhan production-ready dengan arsitektur modular, keamanan tingkat enterprise, serta dukungan untuk integrasi, monitoring, dan scaling.

---

## 🎯 Overview

WA-Gate v2 menyediakan:

- ✅ **Professional & production-ready**
- ✅ **Modular architecture** → mudah di-maintain & scale
- ✅ **MySQL + Redis** → persistence & queue
- ✅ **Security-first approach**
- ✅ **Enterprise features** → queue, scheduling, monitoring

---

## 🏗️ Arsitektur Sistem

### Layered Architecture

```bash
┌─────────────────────────────────────────────┐
│         CLIENT (Dashboard/API Consumer)      │
└─────────────────┬───────────────────────────┘
                │
┌─────────────────▼───────────────────────────┐
│              API LAYER (Express)             │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │  Routes  │─│Middleware│─│ Controllers │ │
│  └──────────┘ └──────────┘ └─────────────┘ │
└─────────────────┬───────────────────────────┘
                │
┌─────────────────▼───────────────────────────┐
│           BUSINESS LOGIC LAYER               │
│  ┌───────────────────────────────────────┐  │
│  │         Services (Core Logic)         │  │
│  │  • WhatsAppService                    │  │
│  │  • MessageService                     │  │
│  │  • QRService                          │  │
│  │  • WebhookService                     │  │
│  │  • AuthService                        │  │
│  └───────────────────────────────────────┘  │
└─────────────────┬───────────────────────────┘
                │
┌─────────────────▼───────────────────────────┐
│            DATA ACCESS LAYER                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │  Models  │  │   MySQL  │  │   Redis   │ │
│  │(Sequelize)│  │ Database │  │   Queue   │ │
│  └──────────┘  └──────────┘  └───────────┘ │
└─────────────────┬───────────────────────────┘
                │
┌─────────────────▼───────────────────────────┐
│          EXTERNAL SERVICES                   │
│  • WhatsApp (Baileys)                        │
│  • Webhook Endpoints (Laravel)               │
│  • File Storage                              │
└──────────────────────────────────────────────┘
```

---

## 📂 Struktur Folder

```bash
wa-gate-v2/
├── src/
│   ├── config/              # Konfigurasi & validasi environment
│   │   ├── index.js         # Main config dengan Joi validation
│   │   ├── database.js      # Sequelize setup & connection
│   │   └── redis.js         # Redis connection (untuk queue)
│   │
│   ├── models/              # Database models (Sequelize)
│   │   ├── index.js         # Model loader & associations
│   │   ├── User.js          # User model (admin, operators)
│   │   ├── Message.js       # Message history
│   │   ├── Contact.js       # Saved contacts
│   │   ├── Broadcast.js     # Broadcast campaigns
│   │   ├── Webhook.js       # Webhook configurations
│   │   ├── ApiKey.js        # API key management
│   │   └── AuditLog.js      # Activity logging
│   │
│   ├── services/            # Business logic (core functionality)
│   │   ├── whatsapp.service.js    # WhatsApp connection & events
│   │   ├── message.service.js     # Send, receive, bulk messages
│   │   ├── qr.service.js          # QR generation & management
│   │   ├── auth.service.js        # Login, JWT, API keys
│   │   ├── webhook.service.js     # Webhook dispatch & retry
│   │   ├── broadcast.service.js   # Bulk messaging & scheduling
│   │   ├── queue.service.js       # Message queue (Bull)
│   │   └── dashboard.service.js   # Metrics & analytics
│   │
│   ├── controllers/         # Request handlers (thin layer)
│   │   ├── auth.controller.js     # Login, logout, token refresh
│   │   ├── message.controller.js  # Send message endpoints
│   │   ├── qr.controller.js       # QR endpoints
│   │   ├── whatsapp.controller.js # WA status, restart, logout
│   │   ├── broadcast.controller.js # Broadcast management
│   │   ├── webhook.controller.js  # Webhook CRUD
│   │   └── dashboard.controller.js # Dashboard data
│   │
│   ├── middlewares/         # Request processing pipeline
│   │   ├── auth.middleware.js     # JWT & API key validation
│   │   ├── rbac.middleware.js     # Role-based access control
│   │   ├── validate.middleware.js # Request validation (Joi)
│   │   ├── rateLimit.middleware.js # Rate limiting
│   │   ├── error.middleware.js    # Global error handler
│   │   ├── logger.middleware.js   # Request logging (Morgan)
│   │   └── security.middleware.js # Helmet, CORS, sanitization
│   │
│   ├── routes/              # API route definitions
│   │   ├── index.js         # Route aggregator
│   │   ├── auth.routes.js   # /api/auth/*
│   │   ├── message.routes.js # /api/messages/*
│   │   ├── qr.routes.js     # /api/qr/*
│   │   ├── whatsapp.routes.js # /api/whatsapp/*
│   │   ├── broadcast.routes.js # /api/broadcast/*
│   │   ├── webhook.routes.js # /api/webhooks/*
│   │   └── dashboard.routes.js # /api/dashboard/*
│   │
│   ├── validators/          # Request validation schemas
│   │   ├── auth.validator.js
│   │   ├── message.validator.js
│   │   ├── broadcast.validator.js
│   │   └── webhook.validator.js
│   │
│   ├── utils/               # Helper functions & utilities
│   │   ├── logger.js        # Winston logger setup
│   │   ├── response.js      # Standard API response wrapper
│   │   ├── helpers.js       # Common helpers (formatPhone, etc)
│   │   ├── constants.js     # App constants (roles, status, etc)
│   │   ├── errors.js        # Custom error classes
│   │   └── encryption.js    # Hashing, HMAC utilities
│   │
│   ├── app.js               # Express app setup (middleware, routes)
│   └── server.js            # Server startup & graceful shutdown
│
├── public/                  # Frontend files
│   ├── dashboard.html       # Main dashboard
│   ├── broadcast.html       # Broadcast interface
│   ├── login.html           # Login page
│   ├── css/
│   └── js/
│
├── tests/                   # Test files
│   ├── unit/                # Unit tests
│   └── integration/         # API integration tests
│
├── logs/                    # Winston log outputs
│   ├── error.log
│   ├── combined.log
│   └── security.log
│
├── uploads/                 # File uploads
│   ├── temp/
│   └── media/
│
├── auth/                    # WhatsApp session (Baileys)
├── .env                     # Environment variables (gitignored)
├── .env.example             # Example env file
├── .gitignore
├── package.json
├── README.md
└── ecosystem.config.js      # PM2 configuration
```

---

## 🔄 Alur Kerja Sistem

1. **Startup Flow**

```bash
[1] server.js starts
   ↓
[2] Load & validate .env (config/index.js)
   ↓
[3] Connect to MySQL (config/database.js)
   ↓
[4] Connect to Redis (config/redis.js)
   ↓
[5] Initialize WhatsApp Service
   ↓
[6] Generate QR (if not authenticated)
   ↓
[7] Start Express server
   ↓
[8] Listen on port 3000
```

2. **Request Flow (Send Message)**

```bash
[CLIENT] POST /api/messages/send
   ↓
[MIDDLEWARE]
→ Security (Helmet, CORS)
→ Rate Limiting (max 50 req/15min)
→ Authentication (JWT/API Key)
→ RBAC (check role permission)
→ Validation (Joi schema)
   ↓
[CONTROLLER] message.controller.js
→ Extract request data
→ Call service method
   ↓
[SERVICE] message.service.js
→ Validate phone number
→ Check WhatsApp connection status
→ Format message
→ Add to queue (if bulk)
→ Send via Baileys
→ Save to database
→ Trigger webhook (if configured)
   ↓
[RESPONSE] JSON { status, data, message }
   ↓
[CLIENT] Receives response
```

3. **WhatsApp Event Flow**

```bash
[WhatsApp] Incoming message received
   ↓
[Baileys Event] messages.upsert
   ↓
[WhatsAppService] Process message
   ↓
[Check Keywords] "pinjam ruang", "lihat ruang"
   ↓
[Save to Database] Message history
   ↓
[Trigger Webhook] POST to Laravel API
   ↓
[Retry Logic] If webhook fails (3 attempts)
   ↓
[Log Activity] Winston logger
```

---

## 🗄️ Database Schema (MySQL)

WA-Gate v2 memiliki tabel inti:

- `users` → admin, operator, user
- `messages` → histori pesan
- `contacts` → daftar kontak
- `broadcasts` → campaign broadcast
- `webhooks` → konfigurasi webhook
- `api_keys` → manajemen API key
- `audit_logs` → aktivitas user & sistem
- `qr_history` → histori QR login

---

## 🔐 Authentication & Authorization

- **JWT** → untuk login dashboard
- **API Key (Bearer Token)** → untuk API eksternal
- **Session** → legacy fallback
- **RBAC** (Role-based Access Control) → Admin, Operator, User

```bash
Roles:
- ADMIN: Full access (user management, webhooks, etc)
- OPERATOR: Send messages, view logs
- USER: View only (dashboard, reports)

Permissions Matrix:
┌─────────────┬───────┬──────────┬──────┐
│ Resource    │ Admin │ Operator │ User │
├─────────────┼───────┼──────────┼──────┤
│ Send Message│   ✅   │    ✅  │  ❌  │
│ View Logs   │   ✅   │    ✅  │  ✅  │
│ Broadcast   │   ✅   │    ✅  │  ❌  │
│ User Mgmt   │   ✅   │    ❌  │  ❌  │
│ Webhooks    │   ✅   │    ❌  │  ❌  │
│ System      │   ✅   │    ❌  │  ❌  │
└─────────────┴───────┴──────────┴──────┘
```

---

## 🚦 Rate Limiting

- Login → 5 req/15 min
- Send Message → 50 req/15 min
- Broadcast → 10 req/60 min
- Dashboard → 100 req/15 min
- QR → 20 req/15 min

API Key juga memiliki limit berbeda sesuai role.

```bash
Endpoint Rate Limits:
┌────────────────────────┬─────────┬──────────────┐
│ Endpoint               │ Limit   │ Window       │
├────────────────────────┼─────────┼──────────────┤
│ POST /api/auth/login   │ 5 req   │ 15 minutes   │
│ POST /api/messages/send│ 50 req  │ 15 minutes   │
│ POST /api/broadcast/*  │ 10 req  │ 60 minutes   │
│ GET /api/dashboard/*   │ 100 req │ 15 minutes   │
│ GET /api/qr            │ 20 req  │ 15 minutes   │
└────────────────────────┴─────────┴──────────────┘

By API Key:
- Admin keys: No limit (atau sangat tinggi)
- Operator keys: 1000 req/hour
- User keys: 100 req/hour
```

---

## 📊 Queue System (Bull + Redis)

- ✅ Prevent overload saat broadcast ke ribuan nomor
- ✅ Retry mechanism otomatis jika gagal
- ✅ Prioritas message (urgent vs normal)
- ✅ Scheduled messaging (kirim nanti)

Queue Architecture:

```bash
[API Request] → [Add to Queue] → [Bull Worker] → [Send WA]
                                       ↓
                                  [On Complete]
                                       ↓
                              [Update DB + Webhook]
```

---

## Queue Types:

```javascript
1. message-queue (Default)
   - Priority: normal
   - Retry: 3 attempts
   - Delay: 1 second between messages

2. broadcast-queue (Bulk)
   - Priority: low
   - Retry: 3 attempts
   - Delay: 2 seconds (avoid spam detection)
   - Chunk: 50 messages/batch

3. webhook-queue (External)
   - Priority: high
   - Retry: 5 attempts
   - Exponential backoff: 1s, 2s, 4s, 8s, 16s
```

---

## 🔗 WEBHOOK SYSTEM

Event Types:

```javascript
-message.received - // Terima pesan baru
  message.sent - // Pesan terkirim
  message.delivered - // Pesan tersampaikan
  message.read - // Pesan dibaca
  connection.open - // WhatsApp connected
  connection.close - // WhatsApp disconnected
  qr.generated - // QR baru dibuat
  broadcast.completed; // Broadcast selesai
```

Webhook Flow:

```
[Event Trigger]
     ↓
[Build Payload]
     ↓
[Generate HMAC Signature] (untuk security)
     ↓
[Add to webhook-queue]
     ↓
[HTTP POST to configured URL]
     ↓
[Retry if failed] (max 5x)
     ↓
[Log result to database]
```

Payload Format:

```json
json{
  "event": "message.received",
  "timestamp": 1234567890,
  "data": {
    "from": "628123456789@s.whatsapp.net",
    "message": "Halo, saya ingin pinjam ruang",
    "messageId": "3EB0XXXXX"
  },
  "signature": "sha256=abc123..." // HMAC untuk validasi
}
```

---

## 📈 MONITORING & METRICS

Dashboard Metrics:

```
Real-time Metrics:
- Connection Status (connected/disconnected)
- Message Queue Length (pending jobs)
- Messages Sent Today
- Success Rate (%)
- Active Broadcasts
- Webhook Status
- System Uptime
- Memory Usage
- CPU Usage
```

Historical Data:

```
- Message count by day/week/month (chart)
- Top contacts by message count
- Failed message reasons (pie chart)
- Response time trends
- API usage by key
```

Health Check Endpoint:

```jsonGET
 /api/health
Response:
{
  "status": "healthy",
  "timestamp": "2025-10-05T10:30:00Z",
  "services": {
    "whatsapp": "connected",
    "database": "connected",
    "redis": "connected",
    "queue": "running"
  },
  "metrics": {
    "uptime": 86400,
    "memory": { "used": 150, "total": 512 },
    "cpu": 25.5
  }
}
```

---

## 🔒 SECURITY MEASURES

1. Input Validation & Sanitization

```javascript
- Joi schemas untuk semua input
- XSS protection (escape HTML)
- SQL Injection prevention (Sequelize parameterized queries)
- Phone number format validation
- File type & size validation
```

2. Authentication Security

```javascript
- Bcrypt untuk password hashing (salt rounds: 10)
- JWT short-lived (15 min)
- Refresh token rotation
- API key encryption di database
- Session secret rotation
```

3. Network Security

```javascript
- Helmet (set security headers)
- CORS (whitelist origins)
- Rate limiting (prevent brute force)
- IP whitelist/blacklist
- HTTPS enforcement (production)
```

4. Data Security

```javascript
- Encrypt sensitive data (API keys, webhook secrets)
- Audit logging (semua actions logged)
- Secure file uploads (validate mime type)
- No sensitive data in logs
- Regular security audits
```

---

## 🚀 DEPLOYMENT STRATEGY

Development:

```bash
npm run dev  # nodemon dengan hot reload
```

Production:

```bash
# PM2 Cluster Mode (multi-core)
pm2 start ecosystem.config.js --env production
```

### PM2 Commands

```
pm2 list           # List processes
pm2 logs wa-gate   # View logs
pm2 monit          # Real-time monitoring
pm2 restart all    # Restart all instances
pm2 reload all     # Zero-downtime reload
```

PM2 Configuration:

```javascript
module.exports = {
  apps: [
    {
      name: "wa-gate-v2",
      script: "./src/server.js",
      instances: 2, // 2 instances (cluster mode)
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "500M",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
```

Nginx Reverse Proxy:

```
nginxserver {
    listen 80;
    server_name wa-gate.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📋 MIGRATION CHECKLIST

### Phase 1: Setup Foundation (Week 1)

- [x] Create project structure
- [x] Install dependencies
- [x] Setup config & validation
- [x] Setup MySQL database
- [x] Create all models
- [x] Setup logger (Winston)

### Phase 2: Core Services (Week 2)

- [ ] WhatsApp Service (Baileys integration)
- [ ] QR Service
- [ ] Message Service
- [ ] Auth Service
- [ ] Queue Service (Bull)

### Phase 3: API Layer (Week 2-3)

- [ ] Setup routes & controllers
- [ ] Implement middlewares (auth, validation, etc)
- [ ] Create validators (Joi schemas)
- [ ] Error handling
- [ ] API documentation

### Phase 4: Advanced Features (Week 3-4)

- [ ] Broadcast Service
- [ ] Webhook Service
- [ ] Dashboard Service
- [ ] Scheduled messages
- [ ] File upload handling

### Phase 5: Frontend (Week 4)

- [ ] Modern dashboard UI
- [ ] Broadcast interface
- [ ] Real-time updates (WebSocket/polling)
- [ ] Login page
- [ ] Mobile responsive

### Phase 6: Testing (Week 5)

- [ ] Unit tests
- [ ] Integration tests
- [ ] Load testing
- [ ] Security testing

### Phase 7: Deployment (Week 5-6)

- [ ] PM2 setup
- [ ] Nginx configuration
- [ ] SSL certificate (Let's Encrypt)
- [ ] Monitoring setup
- [ ] Backup strategy
- [ ] Documentation finalization

## 💡 KEY IMPROVEMENTS dari v1 ke v2

| Aspek        | v1 (Old)                 | v2 (New)                                     |
| ------------ | ------------------------ | -------------------------------------------- |
| Architecture | Monolithic (1 file)      | Modular (layered)                            |
| Database     | File-based (auth folder) | MySQL + Redis                                |
| Auth         | Basic session            | JWT + API Key + RBAC                         |
| Security     | Minimal                  | Comprehensive (rate limit, validation, CORS) |
| Logging      | Plain text               | Winston structured logs                      |
| Queue        | None                     | Bull Queue System                            |
| Broadcast    | Manual loop              | Queue-based chunking                         |
| Webhook      | Simple POST              | Retry + HMAC signature                       |
| Dashboard    | Basic HTML               | Real-time metrics                            |
| Testing      | None                     | Unit + Integration tests                     |
| Deployment   | Node only                | PM2 cluster + Nginx                          |
| Scalability  | Single instance          | Horizontal scaling ready                     |

## ❓ FAQ - Frequently Asked Questions

### Q1: Kenapa pakai MySQL bukan file?

### A: MySQL menyediakan:

- Concurrent access (multi-user safe)
- Transaction support (data integrity)
- Query optimization (faster search)
- Backup & replication (disaster recovery)
- Scalability (millions of records)

## Q2: Kenapa perlu Redis?

### A: Redis untuk:

- Message queue (Bull)
- Session storage (optional)
- Cache (optional)
- Pub/Sub untuk real-time (WebSocket)

## Q3: Apakah backward compatible dengan v1?

### A: API endpoints tetap sama, tapi:

- Auth mechanism berubah (JWT)
- Response format lebih standard
- Perlu migrasi data session lama

## Q4: Berapa lama proses migration?

### A: Estimasi:

- Setup infrastructure: 1-2 hari
- Core development: 3-4 minggu
- Testing: 1 minggu
- Deployment: 2-3 hari
- Total: 5-6 minggu (full-time)

## Q5: Apakah harus pakai semua fitur?

### A: Tidak! Bisa bertahap:

- Minimal: WhatsApp + Message + QR
- Standard: + Auth + Dashboard
- Advanced: + Broadcast + Webhook + Queue
- Enterprise: + Monitoring + HA Setup
