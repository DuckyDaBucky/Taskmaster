import React from "react";

interface PersonalityProfile {
  personality: number;
  preferred_time: number;
  in_person: number;
  private_space: number;
}

interface Friend {
  id: string;
  username: string;
  isOnline: boolean;
  commonCourses: string[];
  notes?: string;
  streak?: number;
  xpAvailable?: boolean;
  personalityProfile: PersonalityProfile;
}

interface FriendDetailsPanelProps {
  friend: Friend | null;
}

const FriendDetailsPanel: React.FC<FriendDetailsPanelProps> = ({ friend }) => {
  if (!friend) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a friend to start chatting.
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-2">{friend.username}</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {friend.isOnline ? "Online now" : "Offline"}
      </p>
      <div className="text-sm mb-2">
        <strong>Common Courses:</strong> {friend.commonCourses.join(", ")}
      </div>
      <div className="text-sm mb-4">
        <strong>Preferences:</strong>{" "}
        {friend.personalityProfile.in_person ? "In-Person" : "Virtual"},{" "}
        {["", "Morning", "Afternoon", "Evening"][friend.personalityProfile.preferred_time]}
      </div>

      {friend.isOnline ? (
        <>
          <div className="flex-1 bg-muted rounded-lg p-4 overflow-y-auto">
            <div className="text-xs text-muted-foreground mb-2">
              Chat with {friend.username}:
            </div>
            <div className="bg-card p-3 rounded-md shadow-sm">
              <p className="text-sm">Hey! How's it going?</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-input"
            />
            <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md">
              Send
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          This user is currently offline. Chat is unavailable.
        </div>
      )}
    </div>
  );
};

export default FriendDetailsPanel;
