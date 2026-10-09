export const buildWeightPath = (entries, width = 640, height = 220) => {
  const points = [...entries]
    .map((entry) => ({ date: new Date(`${entry.date}T00:00:00`), weight: Number(entry.weight) }))
    .filter((entry) => Number.isFinite(entry.weight) && !Number.isNaN(entry.date.getTime()))
    .sort((first, second) => first.date - second.date);
  if (points.length < 2) return [];
  const weights = points.map((point) => point.weight);
  const minimum = Math.min(...weights);
  const maximum = Math.max(...weights);
  const spread = Math.max(maximum - minimum, 1);
  return points.map((point, index) => ({
    ...point,
    x: 30 + (index / (points.length - 1)) * (width - 60),
    y: height - 28 - ((point.weight - minimum) / spread) * (height - 56),
  }));
};
