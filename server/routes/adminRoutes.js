const express = require('express');
const User = require('../models/User');
const Workout = require('../models/Workout');
const Meal = require('../models/Meal');
const Progress = require('../models/Progress');
const WorkoutSession = require('../models/WorkoutSession');
const { requireAuth } = require('./authRoutes');

const router = express.Router();

const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.user._id).select('role');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }
    next();
  } catch (error) {
    next(error);
  }
};

router.use(requireAuth, requireAdmin);

router.get('/summary', async (req, res, next) => {
  try {
    const activityCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [totalUsers, workoutsGenerated, mealsLogged, progressEntries, workoutSessions, completedSessions, skippedSessions, members, workoutCounts, mealCounts, progressCounts, completedCounts, activeUserGroups] = await Promise.all([
      User.countDocuments(),
      Workout.countDocuments(),
      Meal.countDocuments(),
      Progress.countDocuments(),
      WorkoutSession.countDocuments(),
      WorkoutSession.countDocuments({ completed: true, skipped: false }),
      WorkoutSession.countDocuments({ skipped: true }),
      User.find({}, 'name email goal role createdAt').sort({ createdAt: -1 }).limit(100).lean(),
      Workout.aggregate([{ $group: { _id: '$user', count: { $sum: 1 } } }]),
      Meal.aggregate([{ $group: { _id: '$user', count: { $sum: 1 } } }]),
      Progress.aggregate([{ $group: { _id: '$user', count: { $sum: 1 } } }]),
      WorkoutSession.aggregate([{ $match: { completed: true, skipped: false } }, { $group: { _id: '$user', count: { $sum: 1 } } }]),
      Promise.all([
        Workout.distinct('user', { createdAt: { $gte: activityCutoff } }),
        WorkoutSession.distinct('user', { createdAt: { $gte: activityCutoff } }),
        Meal.distinct('user', { createdAt: { $gte: activityCutoff } }),
        Progress.distinct('user', { createdAt: { $gte: activityCutoff } }),
      ]),
    ]);
    const asCountMap = (items) => new Map(items.map((item) => [item._id.toString(), item.count]));
    const workoutsByUser = asCountMap(workoutCounts);
    const mealsByUser = asCountMap(mealCounts);
    const progressByUser = asCountMap(progressCounts);
    const completedByUser = asCountMap(completedCounts);
    const activeUsers30d = new Set(activeUserGroups.flat().map((userId) => userId.toString())).size;

    res.json({
      summary: {
        totalUsers,
        workoutsGenerated,
        mealsLogged,
        progressEntries,
        workoutSessions,
        completedSessions,
        skippedSessions,
        completionRate: workoutSessions ? Math.round((completedSessions / workoutSessions) * 100) : 0,
        activeUsers30d,
        members: members.map((member) => ({
          id: member._id.toString(),
          name: member.name,
          email: member.email,
          goal: member.goal,
          role: member.role,
          joinedAt: member.createdAt,
          workouts: workoutsByUser.get(member._id.toString()) || 0,
          completedTargets: completedByUser.get(member._id.toString()) || 0,
          meals: mealsByUser.get(member._id.toString()) || 0,
          progressEntries: progressByUser.get(member._id.toString()) || 0,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = query
      ? { $or: [
        { name: { $regex: escapedQuery, $options: 'i' } },
        { email: { $regex: escapedQuery, $options: 'i' } },
        { goal: { $regex: escapedQuery, $options: 'i' } },
      ] }
      : {};
    const [members, total] = await Promise.all([
      User.find(filter, 'name email goal role createdAt').sort({ createdAt: -1 }).limit(200).lean(),
      User.countDocuments(filter),
    ]);
    res.json({
      total,
      members: members.map((member) => ({
        id: member._id.toString(),
        name: member.name,
        email: member.email,
        goal: member.goal,
        role: member.role,
        registeredAt: member.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role) || !/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ message: 'Choose a valid user and role.' });
    }
    if (req.params.id === req.session.user._id && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove your own admin role.' });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User was not found.' });
    if (target.role === 'admin' && role === 'user') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) return res.status(400).json({ message: 'The last admin account cannot be demoted.' });
    }
    target.role = role;
    await target.save();
    res.json({
      member: {
        id: target._id.toString(),
        name: target.name,
        email: target.email,
        goal: target.goal,
        role: target.role,
        registeredAt: target.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
