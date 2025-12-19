import React from "react";
import { MessageSquare } from "lucide-react";

interface Friend {
  id: string;
  name: string;
  status: "online" | "offline" | "studying";
  activity?: string;
  avatarColor?: string;
}

interface FriendCardProps {
  friend: Friend;
}

export const FriendCard: React.FC<FriendCardProps> = ({ friend }) => {
  const statusColor =
    friend.status === "online"
      ? "bg-green-500"
      : friend.status === "studying"
      ? "bg-cyan-400"
      : "bg-muted-foreground";

  return (
    <div className="bg-card border border-border rounded-md p-4 flex items-center gap-4 hover:border-primary/50 transition-colors">
      <div className={`w-12 h-12 rounded-full ${friend.avatarColor || "bg-secondary"} flex items-center justify-center text-white font-bold text-lg`}>
        {friend.name.charAt(0)}
      </div>
      <div className="flex-1">
        <h4 className="text-foreground font-medium">{friend.name}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {friend.status === "studying" && friend.activity
              ? `Studying ${friend.activity}`
              : friend.status}
          </span>
        </div>
      </div>
      <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
        <span className="sr-only">Message</span>
        <MessageSquare size={18} />
      </button>
    </div>
  );
};
