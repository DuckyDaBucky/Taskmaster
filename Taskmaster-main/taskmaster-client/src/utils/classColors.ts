const CLASS_COLORS = [
  "#2563eb",
  "#16a34a",
  "#7c3aed",
  "#dc2626",
  "#ea580c",
  "#0891b2",
  "#d97706",
  "#4f46e5",
];

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getClassColor = (classId?: string | null) => {
  if (!classId || classId === "personal") return "#6b7280";
  const idx = hashString(classId) % CLASS_COLORS.length;
  return CLASS_COLORS[idx];
};
