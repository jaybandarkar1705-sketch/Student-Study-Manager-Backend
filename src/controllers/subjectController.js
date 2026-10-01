const Subject = require('../models/Subject');

const getSubjects = async (req, res, next) => {
  try {
    const { search, semester } = req.query;
    const query = { userId: req.user._id };
    if (search) query.name = { $regex: search, $options: 'i' };
    if (semester) query.semester = semester;

    const subjects = await Subject.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: subjects.length, subjects });
  } catch (error) { next(error); }
};

const createSubject = async (req, res, next) => {
  try {
    const subject = await Subject.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, message: 'Subject created', subject });
  } catch (error) { next(error); }
};

const getSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, userId: req.user._id });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, subject });
  } catch (error) { next(error); }
};

const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, message: 'Subject updated', subject });
  } catch (error) { next(error); }
};

const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true, message: 'Subject deleted' });
  } catch (error) { next(error); }
};

module.exports = { getSubjects, createSubject, getSubject, updateSubject, deleteSubject };
