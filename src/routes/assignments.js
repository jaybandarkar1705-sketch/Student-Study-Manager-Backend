const express = require('express');
const router = express.Router();
const { getAssignments, createAssignment, updateAssignment, deleteAssignment } = require('../controllers/assignmentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getAssignments).post(createAssignment);
router.route('/:id').put(updateAssignment).delete(deleteAssignment);

module.exports = router;
