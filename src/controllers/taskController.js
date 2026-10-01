const Task = require('../models/Task');

const getTasks = async (req, res, next) => {
  try {
    const { search, status, priority, subjectId, sortBy = 'dueDate', order = 'asc', page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };

    if (search) query.title = { $regex: search, $options: 'i' };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (subjectId) query.subjectId = subjectId;

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = {};
    sortObj[sortBy] = sortOrder;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('subjectId', 'name color code')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: tasks.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      tasks
    });
  } catch (error) { next(error); }
};

const createTask = async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, userId: req.user._id });
    const populated = await Task.findById(task._id).populate('subjectId', 'name color code');
    res.status(201).json({ success: true, message: 'Task created', task: populated });
  } catch (error) { next(error); }
};

const getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id }).populate('subjectId', 'name color code');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (error) { next(error); }
};

const updateTask = async (req, res, next) => {
  try {
    if (req.body.status === 'completed') req.body.completedAt = new Date();
    else if (req.body.status && req.body.status !== 'completed') req.body.completedAt = null;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('subjectId', 'name color code');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task updated', task });
  } catch (error) { next(error); }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) { next(error); }
};

module.exports = { getTasks, createTask, getTask, updateTask, deleteTask };
