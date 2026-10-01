const express = require('express');
const router = express.Router();
const { getSessions, createSession, updateSession, deleteSession } = require('../controllers/studySessionController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getSessions).post(createSession);
router.route('/:id').put(updateSession).delete(deleteSession);

module.exports = router;
