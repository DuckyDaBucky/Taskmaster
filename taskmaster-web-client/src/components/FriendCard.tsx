import React from 'react';

interface Friend {
  id: string;
  username: string;
  isOnline: boolean;
  matched?: boolean;
}

interface FriendCardProps {
  friend: Friend;
  isSelected: boolean;
  onClick: (id: string) => void;
}

const FriendCard: React.FC<FriendCardProps> = ({ friend, isSelected, onClick }) => {
  return (
    <div
      onClick={() => onClick(friend.id)}
      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
        isSelected
          ? 'bg-primary/10 dark:bg-primary/20 border border-primary/30'
          : 'hover:bg-muted/50 dark:hover:bg-muted/30 border border-transparent'
      }`}
    >
      {/* Online status dot */}
      <span
        className={`w-2.5 h-2.5 rounded-full ${
          friend.isOnline ? 'bg-green-500' : 'bg-red-500'
        }`}
      ></span>

      {/* Username and match icon */}
      <div className="flex items-center gap-1 text-sm font-medium text-foreground truncate">
        <span>{friend.username}</span>
        {friend.matched && (
          <span className="text-yellow-400" title="Matched Friend">
            ⭐
          </span>
        )}
      </div>
    </div>
  );
};

export default FriendCard;
