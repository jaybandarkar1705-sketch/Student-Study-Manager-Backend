const StudyPlan = require('../models/StudyPlan');

const getPlans = async (req, res, next) => {
  try {
    const { startDate, endDate, subjectId } = req.query;
    const query = { userId: req.user._id };
    if (subjectId) query.subjectId = subjectId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const plans = await StudyPlan.find(query)
      .populate('subjectId', 'name color code')
      .sort({ date: 1, startTime: 1 });
    res.json({ success: true, count: plans.length, plans });
  } catch (error) { next(error); }
};

const createPlan = async (req, res, next) => {
  try {
    const plan = await StudyPlan.create({ ...req.body, userId: req.user._id });
    const populated = await StudyPlan.findById(plan._id).populate('subjectId', 'name color code');
    res.status(201).json({ success: true, message: 'Study plan created', plan: populated });
  } catch (error) { next(error); }
};

const updatePlan = async (req, res, next) => {
  try {
    const plan = await StudyPlan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('subjectId', 'name color code');
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, message: 'Plan updated', plan });
  } catch (error) { next(error); }
};

const deletePlan = async (req, res, next) => {
  try {
    const plan = await StudyPlan.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, message: 'Plan deleted' });
  } catch (error) { next(error); }
};

module.exports = { getPlans, createPlan, updatePlan, deletePlan };
