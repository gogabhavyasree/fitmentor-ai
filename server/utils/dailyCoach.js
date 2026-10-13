const getDailyCoaching = (checkIn) => {
  const sleepScore = checkIn.sleepHours >= 7
    ? 30
    : checkIn.sleepHours >= 6
      ? 24
      : checkIn.sleepHours >= 5
        ? 16
        : checkIn.sleepHours >= 4
          ? 8
          : 2;
  const stressScore = 24 - checkIn.stressLevel * 4;
  const sorenessScore = 24 - checkIn.sorenessLevel * 4;
  const hydrationScore = checkIn.waterGlasses >= 8 ? 15 : checkIn.waterGlasses >= 5 ? 10 : checkIn.waterGlasses >= 2 ? 5 : 0;
  const stepsScore = checkIn.steps >= 6000 ? 15 : checkIn.steps >= 2500 ? 10 : checkIn.steps > 0 ? 5 : 0;
  const recoveryScore = Math.max(0, Math.min(100, sleepScore + stressScore + sorenessScore + hydrationScore + stepsScore - (checkIn.painToday ? 20 : 0)));

  let recommendation;
  if (checkIn.painToday || checkIn.sleepHours < 5 || checkIn.sorenessLevel === 5 || checkIn.availableMinutes === 0 || recoveryScore < 45) {
    recommendation = {
      type: 'recovery',
      title: 'Make recovery the priority',
      message: checkIn.painToday
        ? 'Skip movements that trigger pain today. If pain is severe, getting worse, or persistent, check in with a qualified health professional.'
        : checkIn.availableMinutes === 0
          ? 'There is no workout time in your day. Rest is a valid part of a consistent routine.'
          : 'Choose rest today, or gentle movement only if it feels comfortable. Reassess how you feel before training again.',
      workoutMinutes: 0,
    };
  } else if (recoveryScore < 70 || checkIn.sleepHours < 6.5 || checkIn.stressLevel >= 4 || checkIn.sorenessLevel >= 4) {
    recommendation = {
      type: 'light',
      title: 'Keep today light',
      message: 'Try an easy session and stop if anything feels painful. You can shorten the workout to match the time and energy you have.',
      workoutMinutes: Math.min(checkIn.availableMinutes, 20),
    };
  } else {
    recommendation = {
      type: 'train',
      title: 'You’re ready for your planned session',
      message: 'Your check-in looks steady. Train at your usual comfortable effort, and adjust or stop if you feel unwell.',
      workoutMinutes: Math.min(checkIn.availableMinutes, 60),
    };
  }

  return { recoveryScore, recommendation };
};

module.exports = { getDailyCoaching };
