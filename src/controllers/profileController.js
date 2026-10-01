const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc  Get profile
// @route GET /api/profile
const getProfile = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      fullName: req.user.fullName,
      username: req.user.username,
      email: req.user.email,
      college: req.user.college,
      course: req.user.course,
      yearSemester: req.user.yearSemester,
      avatar: req.user.avatar,
      settings: req.user.settings,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt
    }
  });
};

// @desc  Update profile
// @route PUT /api/profile
const updateProfile = async (req, res, next) => {
  try {
    const { fullName, college, course, yearSemester, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { fullName, college, course, yearSemester, avatar },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        college: user.college,
        course: user.course,
        yearSemester: user.yearSemester,
        avatar: user.avatar,
        settings: user.settings,
        createdAt: user.createdAt
      }
    });
  } catch (error) { next(error); }
};

// @desc  Update settings
// @route PUT /api/profile/settings
const updateSettings = async (req, res, next) => {
  try {
    const { theme, notifications, emailNotifications } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 'settings.theme': theme, 'settings.notifications': notifications, 'settings.emailNotifications': emailNotifications },
      { new: true }
    );

    res.json({ success: true, message: 'Settings updated', settings: user.settings });
  } catch (error) { next(error); }
};

module.exports = { getProfile, updateProfile, updateSettings };
