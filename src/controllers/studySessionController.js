const StudySession = require('../models/StudySession');

const getSessions = async (req, res, next) => {
  try {
    const { subjectId, status, startDate, endDate } = req.query;
    const query = { userId: req.user._id };
    if (subjectId) query.subjectId = subjectId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const sessions = await StudySession.find(query)
      .populate('subjectId', 'name color code')
      .sort({ startTime: -1 });
    res.json({ success: true, count: sessions.length, sessions });
  } catch (error) { next(error); }
};

const createSession = async (req, res, next) => {
  try {
    // End any active session first
    await StudySession.updateMany(
      { userId: req.user._id, status: 'active' },
      { status: 'completed', endTime: new Date() }
    );

    const session = await StudySession.create({
      ...req.body,
      userId: req.user._id,
      startTime: req.body.startTime || new Date(),
      status: 'active'
    });
    const populated = await StudySession.findById(session._id).populate('subjectId', 'name color code');
    res.status(201).json({ success: true, message: 'Study session started', session: populated });
  } catch (error) { next(error); }
};

const updateSession = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (updateData.status === 'completed' && !updateData.endTime) {
      updateData.endTime = new Date();
      // Calculate duration
      const session = await StudySession.findOne({ _id: req.params.id, userId: req.user._id });
      if (session) {
        const durationMs = new Date() - session.startTime;
        updateData.duration = Math.round(durationMs / 60000) - (session.pausedDuration || 0);
      }
    }

    const session = await StudySession.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    ).populate('subjectId', 'name color code');
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, message: 'Session updated', session });
  } catch (error) { next(error); }
};

const deleteSession = async (req, res, next) => {
  try {
    const session = await StudySession.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, message: 'Session deleted' });
  } catch (error) { next(error); }
};

module.exports = { getSessions, createSession, updateSession, deleteSession };
