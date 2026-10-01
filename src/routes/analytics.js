const express = require('express');
const router = express.Router();
const { getDashboardAnalytics, getStudyHoursAnalytics, getTaskProgressAnalytics, getSubjectProgressAnalytics, getInsights } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/dashboard', getDashboardAnalytics);
router.get('/study-hours', getStudyHoursAnalytics);
router.get('/task-progress', getTaskProgressAnalytics);
router.get('/subject-progress', getSubjectProgressAnalytics);
router.get('/insights', getInsights);

module.exports = router;
