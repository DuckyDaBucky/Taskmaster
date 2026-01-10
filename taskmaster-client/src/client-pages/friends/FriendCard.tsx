import React from "react";
import { MessageSquare } from "lucide-react";

interface Friend {
  id: string;
  name: string;
  status: "online" | "offline" | "studying";
  activity?: string;
  avatarColor?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
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

  const fullName = (friend.firstName || friend.lastName)
    ? `${friend.firstName || ""} ${friend.lastName || ""}`.trim()
    : friend.name || "Unknown";

  return (
    <div className="bg-card border border-border rounded-md p-4 flex items-center gap-4 hover:border-primary/50 transition-colors">
      {friend.profileImageUrl ? (
        <img
          src={friend.profileImageUrl}
          alt={fullName}
          className="w-12 h-12 rounded-full object-cover"
        />
      ) : (
        <div className={`w-12 h-12 rounded-full ${friend.avatarColor || "bg-secondary"} flex items-center justify-center text-white font-bold text-lg`}>
          {(fullName || "?").charAt(0)}
        </div>
      )}
      <div className="flex-1">
        <h4 className="text-foreground font-medium">{fullName}</h4>
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusColor}`} />
          <div>
            <div className="uppercase tracking-wide">
              {friend.status === "studying" && friend.activity
                ? `Studying ${friend.activity}`
                : friend.status}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {friend.username ? `@${friend.username}` : ''}
            </div>
          </div>
        </div>
      </div>
      <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
        <span className="sr-only">Message</span>
        <MessageSquare size={18} />
      </button>
    </div>
  );
};
