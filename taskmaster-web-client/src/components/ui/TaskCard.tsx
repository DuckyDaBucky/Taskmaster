import { motion } from "framer-motion";
import { theme } from "../../constants/theme";
import { getStatusColor } from "../../utils/styleUtils";
import { TasksData } from "../../services/mockDatabase";

interface TaskCardProps {
  task: TasksData;
  index: number;
  onClick: () => void;
}

export const TaskCard = ({ task, index, onClick }: TaskCardProps) => {
  const statusBorderColor = getStatusColor(task.status);
  const due = new Date(task.deadline);

  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.colors.surface,
    borderLeft: `4px solid ${statusBorderColor}`,
    borderTop: `1px solid ${theme.colors.border}`,
    borderRight: `1px solid ${theme.colors.border}`,
    borderBottom: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.card,
    boxShadow: theme.shadows.card,
    padding: theme.spacing.cardPadding,
  };

  return (
    <motion.div
      layout
      className="rounded-lg transition duration-300 cursor-pointer"
      style={cardStyle}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = theme.shadows.cardHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = theme.shadows.card;
      }}
    >
      <h3 className="text-md font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
        {task.title}
      </h3>
      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
        <strong style={{ color: theme.colors.textPrimary }}>Class:</strong> {task.className || "N/A"}
      </p>
      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
        <strong style={{ color: theme.colors.textPrimary }}>Topic:</strong> {task.topic || "General"}
      </p>
      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
        <strong style={{ color: theme.colors.textPrimary }}>Deadline:</strong>{" "}
        {due.toLocaleString([], {
          dateStyle: "short",
          timeStyle: "short",
        })}
      </p>
      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
        <strong style={{ color: theme.colors.textPrimary }}>Status:</strong>{" "}
        {task.status === "completed" ? "Completed" : task.status === "overdue" ? "Overdue" : "Pending"}
      </p>
      {task.points != null && (
        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
          <strong style={{ color: theme.colors.textPrimary }}>Points:</strong> {task.points}
        </p>
      )}
      {task.textbook && (
        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
          <strong style={{ color: theme.colors.textPrimary }}>Textbook:</strong> {task.textbook}
        </p>
      )}
    </motion.div>
  );
};

