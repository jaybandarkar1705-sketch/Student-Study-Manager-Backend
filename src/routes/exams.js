const express = require('express');
const router = express.Router();
const { getExams, createExam, updateExam, deleteExam } = require('../controllers/examController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getExams).post(createExam);
router.route('/:id').put(updateExam).delete(deleteExam);

module.exports = router;
