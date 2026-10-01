const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updateSettings } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getProfile).put(updateProfile);
router.put('/settings', updateSettings);

module.exports = router;
