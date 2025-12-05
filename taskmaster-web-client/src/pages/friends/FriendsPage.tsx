import React, { useState, useEffect } from "react";
import { FriendCard } from "./FriendCard";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/apiService";

interface Friend {
  id: string;
  name: string;
  status: "online" | "offline" | "studying";
  avatarColor: string;
  activity?: string;
}

const FriendsPage: React.FC = () => {
  const { user } = useUser();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingHamiz, setIsAddingHamiz] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user?._id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Fetch friends list directly from the backend
        const friendsList = await apiService.getFriends();
        
        // Convert to Friend format
        const friendDetails: Friend[] = friendsList.map((friend: any) => ({
          id: friend._id,
          name: `${friend.firstName || ""} ${friend.lastName || ""}`.trim() || friend.userName || friend.email,
          status: "offline" as const,
          avatarColor: `bg-${["blue", "green", "purple", "red", "orange", "cyan"][Math.floor(Math.random() * 6)]}-600`,
        }));
        
        setFriends(friendDetails);
      } catch (error) {
        console.error("Error fetching friends:", error);
        setError("Failed to load friends");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriends();
  }, [user?._id]);

  const handleAddHamiz = async () => {
    try {
      setIsAddingHamiz(true);
      setError(null);
      setSuccessMessage(null);

      await apiService.addHamizAsFriend();

      setSuccessMessage("Hamiz Iqbal added as friend successfully!");

      // Refresh friends list
      const friendsList = await apiService.getFriends();
      const friendDetails: Friend[] = friendsList.map((friend: any) => ({
        id: friend._id,
        name: `${friend.firstName || ""} ${friend.lastName || ""}`.trim() || friend.userName || friend.email,
        status: "offline" as const,
        avatarColor: `bg-${["blue", "green", "purple", "red", "orange", "cyan"][Math.floor(Math.random() * 6)]}-600`,
      }));
      setFriends(friendDetails);
    } catch (error: any) {
      console.error("Error adding Hamiz:", error);
      setError(error.response?.data?.message || "Failed to add Hamiz Iqbal as friend");
    } finally {
      setIsAddingHamiz(false);
    }
  };

  const handleMatchFriends = async () => {
    if (!user?._id) {
      setError("Please log in to match friends");
      return;
    }

    try {
      setIsMatching(true);
      setError(null);
      setSuccessMessage(null);

      const result = await apiService.matchFriends(user._id);
      
      if (result.users && result.users.length > 0) {
        setSuccessMessage(`Matched with ${result.users.length} friend(s): ${result.users.join(", ")}`);
        // Refresh friends list after matching
        const friendsList = await apiService.getFriends();
        const friendDetails: Friend[] = friendsList.map((friend: any) => ({
          id: friend._id,
          name: `${friend.firstName || ""} ${friend.lastName || ""}`.trim() || friend.userName || friend.email,
          status: "offline" as const,
          avatarColor: `bg-${["blue", "green", "purple", "red", "orange", "cyan"][Math.floor(Math.random() * 6)]}-600`,
        }));
        setFriends(friendDetails);
      } else {
        setSuccessMessage("No matches found at this time. Make sure you've set your preferences in Settings!");
      }
    } catch (error: any) {
      console.error("Error matching friends:", error);
      setError(error.response?.data?.message || "Failed to match friends. Make sure you've set your preferences in Settings!");
    } finally {
      setIsMatching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Friends</h1>
        </div>
        <div className="text-center text-muted-foreground">Loading friends...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Friends</h1>
        <div className="flex gap-2">
          <button
            onClick={handleMatchFriends}
            disabled={isMatching}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isMatching ? "Matching..." : "Find Study Partners"}
          </button>
          <button
            onClick={handleAddHamiz}
            disabled={isAddingHamiz}
            className="px-4 py-2 bg-secondary hover:bg-secondary/90 text-foreground rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isAddingHamiz ? "Adding..." : "Add Hamiz Iqbal"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-2 rounded-md">
          {successMessage}
        </div>
      )}

      {friends.length === 0 ? (
        <div className="bg-card border border-border rounded-md p-8 text-center text-muted-foreground">
          <p>No friends yet. Add Hamiz Iqbal to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.map((friend) => (
            <FriendCard key={friend.id} friend={friend} />
          ))}
        </div>
      )}

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
