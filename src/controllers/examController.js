const Exam = require('../models/Exam');

const getExams = async (req, res, next) => {
  try {
    const { subjectId, preparationStatus } = req.query;
    const query = { userId: req.user._id };
    if (subjectId) query.subjectId = subjectId;
    if (preparationStatus) query.preparationStatus = preparationStatus;

    const exams = await Exam.find(query)
      .populate('subjectId', 'name color code')
      .sort({ examDate: 1 });
    res.json({ success: true, count: exams.length, exams });
  } catch (error) { next(error); }
};

const createExam = async (req, res, next) => {
  try {
    const exam = await Exam.create({ ...req.body, userId: req.user._id });
    const populated = await Exam.findById(exam._id).populate('subjectId', 'name color code');
    res.status(201).json({ success: true, message: 'Exam added', exam: populated });
  } catch (error) { next(error); }
};

const updateExam = async (req, res, next) => {
  try {
    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('subjectId', 'name color code');
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, message: 'Exam updated', exam });
  } catch (error) { next(error); }
};

const deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, message: 'Exam deleted' });
  } catch (error) { next(error); }
};

module.exports = { getExams, createExam, updateExam, deleteExam };
