const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const meetingController = require('../controllers/meetingController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// POST /api/process-meeting
router.post('/process-meeting', upload.single('audio'), meetingController.processMeeting);

// GET /api/meetings/:userId
router.get('/meetings/:userId', meetingController.getMeetingsByUser);

// DELETE /api/meetings/:id
router.delete('/meetings/:id', meetingController.deleteMeeting);

// POST /api/online-meeting/join
router.post('/online-meeting/join', meetingController.joinOnlineMeeting);

// GET /api/bot/status/:botId
router.get('/bot/status/:botId', meetingController.getBotStatus);

// POST /api/bot/disconnect/:botId
router.post('/bot/disconnect/:botId', meetingController.disconnectBot);

// POST /api/meeting/process-bot-audio
router.post('/meeting/process-bot-audio', meetingController.processBotAudio);

// POST /api/bot/webhook
router.post('/bot/webhook', (req, res) => {
    try {
        const event = req.body;
        
        // --- INSTRUMENTATION: Log full webhook payload ---
        const logPath = path.join(__dirname, '..', 'bot_debug.log');
        fs.appendFileSync(logPath, `\n[WEBHOOK RECEIVED at ${new Date().toISOString()}]\n${JSON.stringify(event, null, 2)}\n`);
        // -------------------------------------------------

        if (global.io) {
            global.io.emit('webhook_event', event);
        }
        res.status(200).send('OK');
    } catch (err) {
        console.error("Webhook error:", err);
        res.status(500).send('Error');
    }
});

module.exports = router;
