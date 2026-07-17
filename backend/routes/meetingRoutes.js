const express = require('express');
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

module.exports = router;
