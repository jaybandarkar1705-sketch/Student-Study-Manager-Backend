const Assignment = require('../models/Assignment');

const getAssignments = async (req, res, next) => {
  try {
    const { status, priority, subjectId, sortBy = 'dueDate', order = 'asc' } = req.query;
    const query = { userId: req.user._id };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (subjectId) query.subjectId = subjectId;

    const sortObj = {};
    sortObj[sortBy] = order === 'asc' ? 1 : -1;

    const assignments = await Assignment.find(query)
      .populate('subjectId', 'name color code')
      .sort(sortObj);
    res.json({ success: true, count: assignments.length, assignments });
  } catch (error) { next(error); }
};

const createAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.create({ ...req.body, userId: req.user._id });
    const populated = await Assignment.findById(assignment._id).populate('subjectId', 'name color code');
    res.status(201).json({ success: true, message: 'Assignment created', assignment: populated });
  } catch (error) { next(error); }
};

const updateAssignment = async (req, res, next) => {
  try {
    if (req.body.status === 'submitted') req.body.submittedAt = new Date();

    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('subjectId', 'name color code');
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, message: 'Assignment updated', assignment });
  } catch (error) { next(error); }
};

const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, message: 'Assignment deleted' });
  } catch (error) { next(error); }
};

module.exports = { getAssignments, createAssignment, updateAssignment, deleteAssignment };
