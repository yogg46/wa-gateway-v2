const qrService = require('../services/qr.service');
const whatsappService = require('../services/whatsapp.service');
const { sendSuccess, sendNotFound } = require('../utils/response');

/**
 * Get current QR code
 * GET /api/qr
 */
const getCurrentQR = async (req, res, next) => {
  try {
    const qr = qrService.getCurrentQR();

    if (!qr) {
      // Check if already connected
      if (whatsappService.isConnected()) {
        return sendSuccess(
          res,
          { connected: true },
          'WhatsApp already connected'
        );
      }

      return sendNotFound(res, 'QR code not available yet');
    }

    sendSuccess(res, qr, 'QR code retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get QR code as HTML page
 * GET /api/qr/html
 */
const getQRHtml = async (req, res, next) => {
  try {
    const qr = qrService.getCurrentQR();

    if (!qr) {
      if (whatsappService.isConnected()) {
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>WhatsApp Connected</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .container {
                text-align: center;
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              }
              .icon { font-size: 64px; margin-bottom: 20px; }
              h1 { color: #333; margin: 0 0 10px 0; }
              p { color: #666; margin: 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">✅</div>
              <h1>WhatsApp Connected</h1>
              <p>Your WhatsApp is already connected and ready to use.</p>
            </div>
          </body>
          </html>
        `);
      }

      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code Loading</title>
          <meta http-equiv="refresh" content="3">
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              text-align: center;
              background: white;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .loader {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #667eea;
              border-radius: 50%;
              width: 50px;
              height: 50px;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            h1 { color: #333; margin: 0 0 10px 0; }
            p { color: #666; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="loader"></div>
            <h1>Loading QR Code...</h1>
            <p>Please wait while we generate your QR code.</p>
            <p style="font-size: 12px; margin-top: 20px;">Page will refresh automatically</p>
          </div>
        </body>
        </html>
      `);
    }

    const expiresInSeconds = Math.floor(qr.expiresIn / 1000);

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp QR Code</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 400px;
          }
          h1 {
            color: #333;
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          .instructions {
            color: #666;
            margin: 0 0 20px 0;
            font-size: 14px;
            line-height: 1.6;
          }
          .qr-code {
            width: 280px;
            height: 280px;
            margin: 20px auto;
            border: 2px solid #eee;
            border-radius: 10px;
            padding: 10px;
            background: white;
          }
          .timer {
            font-size: 18px;
            font-weight: bold;
            color: #667eea;
            margin-top: 20px;
          }
          .steps {
            text-align: left;
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
            font-size: 13px;
          }
          .steps ol {
            margin: 0;
            padding-left: 20px;
          }
          .steps li {
            margin: 8px 0;
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📱 Scan QR Code</h1>
          <p class="instructions">
            Open WhatsApp on your phone and scan this QR code to connect
          </p>
          <img class="qr-code" src="${qr.qr}" alt="QR Code">
          <div class="timer" id="timer">Expires in: ${expiresInSeconds}s</div>
          
          <div class="steps">
            <strong>How to scan:</strong>
            <ol>
              <li>Open WhatsApp on your phone</li>
              <li>Tap Menu or Settings</li>
              <li>Tap Linked Devices</li>
              <li>Tap Link a Device</li>
              <li>Point your phone at this screen to scan</li>
            </ol>
          </div>
        </div>

        <script>
          let seconds = ${expiresInSeconds};
          const timerEl = document.getElementById('timer');
          
          const countdown = setInterval(() => {
            seconds--;
            timerEl.textContent = 'Expires in: ' + seconds + 's';
            
            if (seconds <= 0) {
              clearInterval(countdown);
              location.reload();
            }
          }, 1000);

          // Auto refresh when connected
          setInterval(() => {
            fetch('/api/qr')
              .then(r => r.json())
              .then(data => {
                if (data.data.connected) {
                  location.reload();
                }
              })
              .catch(() => {});
          }, 3000);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh QR code (force new generation)
 * POST /api/qr/refresh
 */
const refreshQR = async (req, res, next) => {
  try {
    const qr = await qrService.refreshQR();

    sendSuccess(res, qr, 'QR code refreshed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get QR history
 * GET /api/qr/history
 */
const getQRHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const history = await qrService.getQRHistory(limit);

    sendSuccess(res, history, 'QR history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get QR statistics
 * GET /api/qr/stats
 */
const getQRStats = async (req, res, next) => {
  try {
    const stats = await qrService.getQRStats();

    sendSuccess(res, stats, 'QR statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get QR status
 * GET /api/qr/status
 */
const getQRStatus = async (req, res, next) => {
  try {
    const isConnected = whatsappService.isConnected();
    const hasQR = !!qrService.getCurrentQR();

    sendSuccess(
      res,
      {
        isConnected,
        hasQR,
        connectionState: whatsappService.getConnectionState(),
      },
      'QR status retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentQR,
  getQRHtml,
  refreshQR,
  getQRHistory,
  getQRStats,
  getQRStatus,
};