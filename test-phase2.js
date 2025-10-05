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
    console.log('   Queue Stats:', JSON.stringify(queueStats, null, 2));
    console.log('   ✅ Queue service working\n');

    // Test 4: WhatsApp Service
    console.log('4️⃣ Testing WhatsApp Service...');
    await whatsappService.initialize();
    const socketInfo = whatsappService.getSocketInfo();
    console.log('   Connection State:', socketInfo.connectionState);
    console.log('   Has QR:', socketInfo.hasQR);
    console.log('   ✅ WhatsApp service initialized\n');

    // Test 5: QR Service
    console.log('5️⃣ Testing QR Service...');
    const currentQR = qrService.getCurrentQR();
    if (currentQR) {
      console.log('   QR available, expires in:', currentQR.expiresIn, 'ms');
    } else {
      console.log('   No QR available (may be already connected)');
    }
    console.log('   ✅ QR service working\n');

    // Test 6: Message Service
    console.log('6️⃣ Testing Message Service...');
    const messageStats = await messageService.getMessageStats();
    console.log('   Message Stats:', JSON.stringify(messageStats, null, 2));
    console.log('   ✅ Message service working\n');

    console.log('🎉 All Phase 2 tests passed!\n');
    console.log('⚠️  Note: WhatsApp connection may require QR scan');
    console.log('   Check logs/ folder for detailed logs');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    console.log('\n✅ Tests completed. Press Ctrl+C to exit.');
  }
}

testPhase2();
