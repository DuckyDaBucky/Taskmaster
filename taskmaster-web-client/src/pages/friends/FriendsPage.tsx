import React from "react";
import { FriendCard } from "./FriendCard";

const FRIENDS_DATA = [
  { id: "1", name: "Alice Johnson", status: "online" as const, avatarColor: "bg-purple-600" },
  { id: "2", name: "Bob Smith", status: "studying" as const, activity: "Calculus II", avatarColor: "bg-blue-600" },
  { id: "3", name: "Charlie Brown", status: "offline" as const, avatarColor: "bg-green-600" },
  { id: "4", name: "Diana Prince", status: "online" as const, avatarColor: "bg-red-600" },
  { id: "5", name: "Evan Wright", status: "studying" as const, activity: "Physics Lab", avatarColor: "bg-orange-600" },
];

const FriendsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Friends</h1>
        <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-sm font-medium transition-colors">
          Add Friend
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FRIENDS_DATA.map((friend) => (
          <FriendCard key={friend.id} friend={friend} />
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Suggested Friends</h2>
        <div className="bg-card border border-border rounded-md p-8 text-center text-muted-foreground">
          <p>Connect your school account to find classmates!</p>
          <button className="mt-4 px-4 py-2 border border-border hover:bg-secondary rounded-md text-sm font-medium transition-colors">
            Connect Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;
