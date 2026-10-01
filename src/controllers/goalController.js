const Goal = require('../models/Goal');

const getGoals = async (req, res, next) => {
  try {
    const { status, subjectId } = req.query;
    const query = { userId: req.user._id };
    if (status) query.status = status;
    if (subjectId) query.subjectId = subjectId;

    const goals = await Goal.find(query)
      .populate('subjectId', 'name color code')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: goals.length, goals });
  } catch (error) { next(error); }
};

const createGoal = async (req, res, next) => {
  try {
    const goal = await Goal.create({ ...req.body, userId: req.user._id });
    const populated = await Goal.findById(goal._id).populate('subjectId', 'name color code');
    res.status(201).json({ success: true, message: 'Goal created', goal: populated });
  } catch (error) { next(error); }
};

const updateGoal = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (updateData.status === 'completed' && !updateData.completedAt) {
      updateData.completedAt = new Date();
      updateData.progress = 100;
    }

    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    ).populate('subjectId', 'name color code');
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    res.json({ success: true, message: 'Goal updated', goal });
  } catch (error) { next(error); }
};

const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    res.json({ success: true, message: 'Goal deleted' });
  } catch (error) { next(error); }
};

module.exports = { getGoals, createGoal, updateGoal, deleteGoal };
