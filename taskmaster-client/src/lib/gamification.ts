export type TaskPriority = "high" | "medium" | "low";

export const PRIORITY_POINTS: Record<TaskPriority, number> = {
  high: 50,
  medium: 30,
  low: 10,
};

export const RANKS = [
  { name: "Bronze", minPoints: 0 },
  { name: "Silver", minPoints: 1500 },
  { name: "Gold", minPoints: 4000 },
  { name: "Diamond", minPoints: 8000 },
  { name: "Study Expert", minPoints: 15000 },
  { name: "Task Master", minPoints: 25000 },
];

export const getPointsForPriority = (priority?: string | null): number => {
  if (!priority) return PRIORITY_POINTS.low;
  if (priority === "high" || priority === "medium" || priority === "low") {
    return PRIORITY_POINTS[priority];
  }
  return PRIORITY_POINTS.low;
};

export const getRankForPoints = (points: number) => {
  const safePoints = Number.isFinite(points) ? Math.max(0, points) : 0;
  let current = RANKS[0];

  for (const rank of RANKS) {
    if (safePoints >= rank.minPoints) {
      current = rank;
    } else {
      break;
    }
  }

  const currentIndex = RANKS.findIndex((rank) => rank.name === current.name);
  const nextRank = currentIndex >= 0 ? RANKS[currentIndex + 1] : undefined;
  const maxPoints = nextRank ? nextRank.minPoints - 1 : null;

  return { ...current, maxPoints };
};

export const getRankProgress = (points: number) => {
  const safePoints = Number.isFinite(points) ? Math.max(0, points) : 0;
  const currentRank = getRankForPoints(safePoints);
  const currentIndex = RANKS.findIndex((rank) => rank.name === currentRank.name);
  const nextRank = currentIndex >= 0 ? RANKS[currentIndex + 1] : undefined;
  const targetPoints = nextRank ? nextRank.minPoints : safePoints;
  const rankSpan = nextRank ? nextRank.minPoints - currentRank.minPoints : 0;
  const progress = nextRank && rankSpan > 0
    ? Math.min(1, (safePoints - currentRank.minPoints) / rankSpan)
    : 1;

  return {
    currentRank,
    nextRank,
    progress,
    targetPoints,
    pointsToNext: nextRank ? Math.max(0, nextRank.minPoints - safePoints) : 0,
  };
};

const hasTimezoneInfo = (deadlineStr: string) => /Z$|[+-]\d{2}:\d{2}$/.test(deadlineStr);

export const parseTaskDeadline = (deadlineStr: string) => {
  if (deadlineStr.includes("T") && !hasTimezoneInfo(deadlineStr)) {
    const [datePart, timePart = "00:00"] = deadlineStr.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hours, minutes] = timePart.split(":").map(Number);
    return new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);
  }

  if (!deadlineStr.includes("T")) {
    const [year, month, day] = deadlineStr.split("-").map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  return new Date(deadlineStr);
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const calculateEarnedPoints = (
  basePoints: number,
  deadline?: string | null,
  completedAt: Date = new Date(),
): number => {
  const safeBase = Number.isFinite(basePoints) ? Math.max(0, basePoints) : 0;
  if (!deadline || safeBase === 0) return safeBase;

  const dueDate = parseTaskDeadline(deadline);
  const completedDate = startOfDay(completedAt);
  const dueDay = startOfDay(dueDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  const dayDiff = Math.floor((dueDay.getTime() - completedDate.getTime()) / msPerDay);

  if (dayDiff > 0) {
    const bonusMultiplier = Math.min(1.5, 1 + dayDiff * 0.05);
    return Math.round(safeBase * bonusMultiplier);
  }

  if (dayDiff < 0) {
    const overdueDays = Math.abs(dayDiff);
    const penaltyMultiplier = Math.max(0.5, 1 - overdueDays * 0.1);
    return Math.round(safeBase * penaltyMultiplier);
  }

  return safeBase;
};
