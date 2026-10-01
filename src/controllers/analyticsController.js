const Task = require('../models/Task');
const Assignment = require('../models/Assignment');
const StudySession = require('../models/StudySession');
const StudyPlan = require('../models/StudyPlan');
const Exam = require('../models/Exam');
const Goal = require('../models/Goal');
const Subject = require('../models/Subject');

// Helper: get date range for current week
const getWeekRange = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
};

// @desc  Dashboard analytics
// @route GET /api/analytics/dashboard
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const week = getWeekRange();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const [
      tasksDueToday,
      pendingAssignments,
      upcomingExams,
      weekStudyHours,
      completedTasksCount,
      totalTasksCount,
      activeGoals,
      recentNotes,
      todayPlans,
      upcomingDeadlines
    ] = await Promise.all([
      Task.countDocuments({ userId, dueDate: { $gte: today, $lt: tomorrow }, status: { $ne: 'completed' } }),
      Assignment.countDocuments({ userId, status: { $in: ['not-started', 'in-progress'] } }),
      Exam.countDocuments({ userId, examDate: { $gte: today } }),
      StudySession.aggregate([
        { $match: { userId, status: 'completed', startTime: { $gte: week.start, $lte: week.end } } },
        { $group: { _id: null, totalMinutes: { $sum: '$duration' } } }
      ]),
      Task.countDocuments({ userId, status: 'completed' }),
      Task.countDocuments({ userId }),
      Goal.find({ userId, status: 'active' }).populate('subjectId', 'name color').sort({ progress: -1 }).limit(5),
      require('../models/Note').find({ userId }).sort({ updatedAt: -1 }).limit(5).populate('subjectId', 'name color'),
      StudyPlan.find({ userId, date: { $gte: today, $lt: tomorrow } }).populate('subjectId', 'name color').sort({ startTime: 1 }),
      Assignment.find({ userId, status: { $in: ['not-started', 'in-progress'] }, dueDate: { $gte: today, $lte: nextWeek } })
        .populate('subjectId', 'name color').sort({ dueDate: 1 }).limit(5)
    ]);

    const weekStudyMinutes = weekStudyHours[0]?.totalMinutes || 0;
    const taskCompletionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

    res.json({
      success: true,
      data: {
        stats: {
          tasksDueToday,
          pendingAssignments,
          upcomingExams,
          weekStudyHours: parseFloat((weekStudyMinutes / 60).toFixed(1)),
          completedTasks: completedTasksCount,
          totalTasks: totalTasksCount,
          taskCompletionRate,
          activeGoals: activeGoals.length
        },
        todayPlans,
        upcomingDeadlines,
        activeGoals,
        recentNotes
      }
    });
  } catch (error) { next(error); }
};

// @desc  Study hours analytics
// @route GET /api/analytics/study-hours
const getStudyHoursAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const week = getWeekRange();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Weekly hours per day
    const weeklyData = await StudySession.aggregate([
      { $match: { userId, status: 'completed', startTime: { $gte: week.start, $lte: week.end } } },
      { $group: {
        _id: { $dayOfWeek: '$startTime' },
        minutes: { $sum: '$duration' }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Monthly hours per day
    const monthlyData = await StudySession.aggregate([
      { $match: { userId, status: 'completed', startTime: { $gte: monthStart } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
        minutes: { $sum: '$duration' }
      }},
      { $sort: { _id: 1 } }
    ]);

    // By subject
    const subjectData = await StudySession.aggregate([
      { $match: { userId, status: 'completed', subjectId: { $ne: null } } },
      { $group: { _id: '$subjectId', minutes: { $sum: '$duration' } } },
      { $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 'subject' } },
      { $unwind: { path: '$subject', preserveNullAndEmpty: true } },
      { $project: { name: '$subject.name', color: '$subject.color', hours: { $divide: ['$minutes', 60] } } },
      { $sort: { hours: -1 } },
      { $limit: 10 }
    ]);

    // Days of week labels
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyFormatted = dayLabels.map((day, idx) => {
      const found = weeklyData.find(d => d._id === idx + 1);
      return { day, hours: found ? parseFloat((found.minutes / 60).toFixed(1)) : 0 };
    });

    res.json({
      success: true,
      data: {
        weekly: weeklyFormatted,
        monthly: monthlyData.map(d => ({ date: d._id, hours: parseFloat((d.minutes / 60).toFixed(1)) })),
        bySubject: subjectData.map(d => ({ name: d.name || 'Unknown', color: d.color, hours: parseFloat((d.hours || 0).toFixed(1)) }))
      }
    });
  } catch (error) { next(error); }
};

// @desc  Task progress analytics
// @route GET /api/analytics/task-progress
const getTaskProgressAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const week = getWeekRange();
    const prevWeekStart = new Date(week.start);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(week.start);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);

    const [tasksByStatus, tasksByPriority, assignmentsByStatus, thisWeekCompleted, lastWeekCompleted] = await Promise.all([
      Task.aggregate([{ $match: { userId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.aggregate([{ $match: { userId } }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Assignment.aggregate([{ $match: { userId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.countDocuments({ userId, status: 'completed', completedAt: { $gte: week.start, $lte: week.end } }),
      Task.countDocuments({ userId, status: 'completed', completedAt: { $gte: prevWeekStart, $lte: prevWeekEnd } })
    ]);

    const improvementRate = lastWeekCompleted > 0
      ? Math.round(((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100)
      : thisWeekCompleted > 0 ? 100 : 0;

    res.json({
      success: true,
      data: {
        tasksByStatus: tasksByStatus.map(d => ({ status: d._id, count: d.count })),
        tasksByPriority: tasksByPriority.map(d => ({ priority: d._id, count: d.count })),
        assignmentsByStatus: assignmentsByStatus.map(d => ({ status: d._id, count: d.count })),
        weeklyCompletion: { thisWeek: thisWeekCompleted, lastWeek: lastWeekCompleted, improvementRate }
      }
    });
  } catch (error) { next(error); }
};

// @desc  Subject progress analytics
// @route GET /api/analytics/subject-progress
const getSubjectProgressAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const subjects = await Subject.find({ userId });

    const subjectProgress = await Promise.all(subjects.map(async (subject) => {
      const [totalTasks, completedTasks, totalAssignments, completedAssignments] = await Promise.all([
        Task.countDocuments({ userId, subjectId: subject._id }),
        Task.countDocuments({ userId, subjectId: subject._id, status: 'completed' }),
        Assignment.countDocuments({ userId, subjectId: subject._id }),
        Assignment.countDocuments({ userId, subjectId: subject._id, status: { $in: ['submitted', 'completed'] } })
      ]);

      const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const assignmentProgress = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;
      const overallProgress = Math.round((taskProgress + assignmentProgress) / 2);

      return {
        id: subject._id,
        name: subject.name,
        color: subject.color,
        taskProgress,
        assignmentProgress,
        overallProgress,
        totalTasks,
        completedTasks,
        totalAssignments,
        completedAssignments
      };
    }));

    res.json({ success: true, data: { subjects: subjectProgress } });
  } catch (error) { next(error); }
};

// @desc  Smart productivity insights
// @route GET /api/analytics/insights  
const getInsights = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const week = getWeekRange();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const prevWeekStart = new Date(week.start);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    const [
      topSubjectSession,
      upcomingAssignmentsCount,
      thisWeekCompleted,
      lastWeekCompleted,
      tomorrowPlans,
      overdueTasksCount
    ] = await Promise.all([
      StudySession.aggregate([
        { $match: { userId, status: 'completed', startTime: { $gte: week.start } } },
        { $group: { _id: '$subjectId', minutes: { $sum: '$duration' } } },
        { $sort: { minutes: -1 } },
        { $limit: 1 },
        { $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 'subject' } },
        { $unwind: { path: '$subject', preserveNullAndEmpty: true } }
      ]),
      Assignment.countDocuments({ userId, status: { $in: ['not-started', 'in-progress'] }, dueDate: { $gte: today, $lte: nextWeek } }),
      Task.countDocuments({ userId, status: 'completed', completedAt: { $gte: week.start, $lte: week.end } }),
      Task.countDocuments({ userId, status: 'completed', completedAt: { $gte: prevWeekStart, $lt: week.start } }),
      StudyPlan.countDocuments({ userId, date: { $gte: tomorrow, $lt: new Date(tomorrow.getTime() + 86400000) } }),
      Task.countDocuments({ userId, status: { $ne: 'completed' }, dueDate: { $lt: today } })
    ]);

    const insights = [];

    if (topSubjectSession.length > 0 && topSubjectSession[0].subject) {
      insights.push({
        type: 'info',
        icon: '📚',
        message: `You studied the most for "${topSubjectSession[0].subject.name}" this week (${Math.round(topSubjectSession[0].minutes / 60 * 10) / 10} hours).`
      });
    }

    if (upcomingAssignmentsCount > 0) {
      insights.push({
        type: 'warning',
        icon: '📋',
        message: `You have ${upcomingAssignmentsCount} assignment${upcomingAssignmentsCount > 1 ? 's' : ''} due within the next 7 days.`
      });
    }

    if (thisWeekCompleted > lastWeekCompleted && lastWeekCompleted > 0) {
      insights.push({
        type: 'success',
        icon: '🎯',
        message: `Your task completion rate improved this week! (${lastWeekCompleted} → ${thisWeekCompleted} tasks completed)`
      });
    } else if (thisWeekCompleted === 0) {
      insights.push({
        type: 'info',
        icon: '💡',
        message: 'You haven\'t completed any tasks this week. Try tackling one small task today!'
      });
    }

    if (tomorrowPlans === 0) {
      insights.push({
        type: 'warning',
        icon: '📅',
        message: 'You haven\'t scheduled any study sessions for tomorrow. Plan ahead to stay on track!'
      });
    }

    if (overdueTasksCount > 0) {
      insights.push({
        type: 'error',
        icon: '⚠️',
        message: `You have ${overdueTasksCount} overdue task${overdueTasksCount > 1 ? 's' : ''}. Consider reviewing them soon.`
      });
    }

    if (insights.length === 0) {
      insights.push({
        type: 'success',
        icon: '🌟',
        message: 'Great job! Start adding subjects, tasks, and study sessions to get personalized insights.'
      });
    }

    res.json({ success: true, insights });
  } catch (error) { next(error); }
};

module.exports = { getDashboardAnalytics, getStudyHoursAnalytics, getTaskProgressAnalytics, getSubjectProgressAnalytics, getInsights };
