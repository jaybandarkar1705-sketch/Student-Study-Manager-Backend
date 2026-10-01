const Note = require('../models/Note');

const getNotes = async (req, res, next) => {
  try {
    const { search, subjectId, tag } = req.query;
    const query = { userId: req.user._id };
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } }
    ];
    if (subjectId) query.subjectId = subjectId;
    if (tag) query.tags = tag;

    const notes = await Note.find(query)
      .populate('subjectId', 'name color code')
      .sort({ isPinned: -1, updatedAt: -1 });
    res.json({ success: true, count: notes.length, notes });
  } catch (error) { next(error); }
};

const createNote = async (req, res, next) => {
  try {
    const note = await Note.create({ ...req.body, userId: req.user._id });
    const populated = await Note.findById(note._id).populate('subjectId', 'name color code');
    res.status(201).json({ success: true, message: 'Note created', note: populated });
  } catch (error) { next(error); }
};

const updateNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('subjectId', 'name color code');
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, message: 'Note updated', note });
  } catch (error) { next(error); }
};

const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) { next(error); }
};

module.exports = { getNotes, createNote, updateNote, deleteNote };
