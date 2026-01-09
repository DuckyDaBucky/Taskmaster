import React, { useState, useEffect } from "react";
import { FriendCard } from "./FriendCard";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/api";
import SearchLevelSetupPage from "./SearchLevelSetupPage";

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

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [searchLevelSet, setSearchLevelSet] = useState<boolean | null>(null);
  const [setupComplete, setSetupComplete] = useState(false);
  const [foundUsers, setFoundUsers] = useState<string[]>([]);;
  const [matchingWith, setMatchingWith] = useState<Set<string>>(new Set());

  // Check if user has search_level set
  useEffect(() => {
    if (user?.preferences?.searchLevel) {
      setSearchLevelSet(true);
    } else {
      setSearchLevelSet(false);
    }
  }, [user?.preferences?.searchLevel]);
  
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



  const handleFindStudyPartners = async () => {
    if (!user?._id) {
      setError("Please log in to find study partners");
      return;
    }

    try {
      setIsMatching(true);
      setError(null);
      setSuccessMessage(null);

      const result = await apiService.findUsers(user._id);

      if (result.users && result.users.length > 0) {
        setFoundUsers(result.users);
        setSuccessMessage(`Found ${result.users.length} potential study partner(s)`);
      } else {
        setFoundUsers([]);
        setSuccessMessage("No matches found at this time. ");
      }
    } catch (error: any) {
      console.error("Error finding study partners:", error);
      setError(error.message || "Failed to find study partners. Please try again.");
    } finally {
      setIsMatching(false);
    }
  };

  const handleMatchWithUser = async (username: string) => {
    if (!user?._id) {
      setError("Please log in to match with users");
      return;
    }

    try {
      setMatchingWith(prev => new Set([...prev, username]));
      setError(null);
      
      const result = await apiService.sendMatchRequest(user._id, username);
      
      setSuccessMessage(`✅ ${result.message}`);
      
      // Remove user from found users list
      setFoundUsers(prev => prev.filter(u => u !== username));
    } catch (error: any) {
      console.error("Error matching with user:", error);
      setError(error.message || `Failed to match with ${username}`);
    } finally {
      setMatchingWith(prev => {
        const newSet = new Set(prev);
        newSet.delete(username);
        return newSet;
      });
    }
  };


  // const handleMatchFriends = async () => {
  //   if (!user?._id) {
  //     setError("Please log in to match friends");
  //     return;
  //   }

  //   try {
  //     setIsMatching(true);
  //     setError(null);
  //     setSuccessMessage(null);

  //     const result = await apiService.matchFriends(user._id);
      
  //     if (result.users && result.users.length > 0) {
  //       setSuccessMessage(`Matched with ${result.users.length} friend(s): ${result.users.join(", ")}`);
  //       // Refresh friends list after matching
  //       const friendsList = await apiService.getFriends();
  //       const friendDetails: Friend[] = friendsList.map((friend: any) => ({
  //         id: friend._id,
  //         name: `${friend.firstName || ""} ${friend.lastName || ""}`.trim() || friend.userName || friend.email,
  //         status: "offline" as const,
  //         avatarColor: `bg-${["blue", "green", "purple", "red", "orange", "cyan"][Math.floor(Math.random() * 6)]}-600`,
  //       }));
  //       setFriends(friendDetails);
  //     } else {
  //       setSuccessMessage("No matches found at this time. Make sure you've set your preferences in Settings!");
  //     }
  //   } catch (error: any) {
  //     console.error("Error matching friends:", error);
  //     setError(error.response?.data?.message || "Failed to match friends. Make sure you've set your preferences in Settings!");
  //   } finally {
  //     setIsMatching(false);
  //   }
  // };

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

  // Show setup page if search_level is not set
  if (!searchLevelSet && !setupComplete) {
    return <SearchLevelSetupPage onComplete={() => setSetupComplete(true)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Friends</h1>
        <button
          onClick={handleFindStudyPartners}
          disabled={isMatching}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isMatching ? "Matching..." : "Find Study Partners"}
        </button>
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

      {foundUsers.length > 0 && (
        <div className="bg-card border border-border rounded-md p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Study Partner Matches</h2>
          <div className="space-y-3">
            {foundUsers.map((username) => (
              <div key={username} className="flex items-center justify-between bg-secondary/20 p-3 rounded-md">
                <span className="text-foreground font-medium">{username}</span>
                <button
                  onClick={() => handleMatchWithUser(username)}
                  disabled={matchingWith.has(username)}
                  className="px-3 py-1 bg-primary hover:bg-primary/90 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {matchingWith.has(username) ? "Adding..." : "Add Friend"}
                </button>
              </div>
            ))}
          </div>
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
