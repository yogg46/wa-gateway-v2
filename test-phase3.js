const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let accessToken = '';

async function testPhase3() {
  console.log('🧪 Testing Phase 3: API Layer\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('   ✅ Health:', health.data.message);
    console.log('');

    // Test 2: API Root
    console.log('2️⃣ Testing API Root...');
    const apiRoot = await axios.get(`${BASE_URL}/api/v1`);
    console.log('   ✅ API Version:', apiRoot.data.version);
    console.log('   📚 Endpoints:', Object.keys(apiRoot.data.endpoints).length);
    console.log('');

    // Test 3: Login
    console.log('3️⃣ Testing Login...');
    try {
      const login = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        usernameOrEmail: 'admin',
        password: 'Th3Glo0myGloryEnds!',
      });
      accessToken = login.data.data.accessToken;
      console.log('   ✅ Login successful');
      console.log('   🔑 Token:', accessToken.substring(0, 20) + '...');
      console.log('');
    } catch (error) {
      console.log('   ❌ Login failed:', error.response?.data?.message);
      throw error;
    }

    // Test 4: Get Profile
    console.log('4️⃣ Testing Get Profile...');
    const profile = await axios.get(`${BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log('   ✅ User:', profile.data.data.username);
    console.log('   👤 Role:', profile.data.data.role);
    console.log('');

    // Test 5: WhatsApp Status
    console.log('5️⃣ Testing WhatsApp Status...');
    const waStatus = await axios.get(`${BASE_URL}/api/v1/whatsapp/status`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log('   ✅ Connection:', waStatus.data.data.connectionState);
    console.log('   📱 Connected:', waStatus.data.data.isConnected);
    console.log('');

    // Test 6: QR Status
    console.log('6️⃣ Testing QR Status...');
    const qrStatus = await axios.get(`${BASE_URL}/api/v1/qr/status`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log('   ✅ Has QR:', qrStatus.data.data.hasQR);
    console.log('   📱 Connected:', qrStatus.data.data.isConnected);
    console.log('');

    // Test 7: Dashboard Overview
    console.log('7️⃣ Testing Dashboard Overview...');
    const dashboard = await axios.get(`${BASE_URL}/api/v1/dashboard/overview`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log('   ✅ Total Users:', dashboard.data.data.users);
    console.log('   📊 Total Messages:', dashboard.data.data.messages.total);
    console.log('   📞 Total Contacts:', dashboard.data.data.contacts);
    console.log('');

    // Test 8: Message Stats
    console.log('8️⃣ Testing Message Stats...');
    const msgStats = await axios.get(`${BASE_URL}/api/v1/messages/stats`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log('   ✅ Total:', msgStats.data.data.total);
    console.log('   📈 Success Rate:', msgStats.data.data.successRate);
    console.log('');

    // Test 9: Queue Status
    console.log('9️⃣ Testing Queue Status...');
    const queueStatus = await axios.get(`${BASE_URL}/api/v1/dashboard/queues`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log('   ✅ Queues:', Object.keys(queueStatus.data.data).length);
    console.log('');

    // Test 10: System Health
    console.log('🔟 Testing System Health...');
    const sysHealth = await axios.get(`${BASE_URL}/api/v1/dashboard/health`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log('   ✅ Status:', sysHealth.data.data.status);
    console.log('   🗄️ Database:', sysHealth.data.data.services.database);
    console.log('   🔴 Redis:', sysHealth.data.data.services.redis);
    console.log('   📱 WhatsApp:', sysHealth.data.data.services.whatsapp);
    console.log('');

    console.log('🎉 All Phase 3 tests passed!\n');
    console.log('✅ API Layer is working correctly');
    console.log('📱 Open QR Code: http://localhost:3000/api/v1/qr/html');
    console.log('📚 API Docs: http://localhost:3000/api/v1');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Wait for server to start
setTimeout(() => {
  testPhase3();
}, 2000);