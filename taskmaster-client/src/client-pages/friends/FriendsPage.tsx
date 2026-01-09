import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
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
  profileImageUrl?: string;
}

interface FoundUser {
  _id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  profileImageUrl?: string;
  requestSent?: boolean;
}

interface IncomingRequest {
  _id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  profileImageUrl?: string;
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
  const [foundUsers, setFoundUsers] = useState<FoundUser[]>([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchingWith, setMatchingWith] = useState<Set<string>>(new Set());
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<IncomingRequest[]>([]);
  const [acceptingWith, setAcceptingWith] = useState<Set<string>>(new Set());

  // Centralized loader for friends list
  const loadFriends = async () => {
    if (!user?._id) {
      setFriends([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const friendsList = await apiService.getFriendsFromUserService();

      const friendDetails: Friend[] = (friendsList || []).map((friend: any) => ({
        id: friend._id,
        name: `${friend.firstName || ""} ${friend.lastName || ""}`.trim() || friend.displayName || friend.username || friend.email,
        firstName: friend.firstName || friend.first_name || "",
        lastName: friend.lastName || friend.last_name || "",
        username: friend.username || friend.user_name || friend.display_name || "",
        profileImageUrl: friend.profileImageUrl || friend.pfp || undefined,
        status: "offline" as const,
        avatarColor: `bg-${["blue", "green", "purple", "red", "orange", "cyan"][Math.floor(Math.random() * 6)]}-600`,
      }));

      setFriends(friendDetails);
    } catch (err) {
      console.error("Error loading friends:", err);
      setError("Failed to load friends");
    } finally {
      setIsLoading(false);
    }
  };


  // Check if user has search_level set
  useEffect(() => {
    if (user?.preferences?.searchLevel) {
      setSearchLevelSet(true);
    } else {
      setSearchLevelSet(false);
    }
  }, [user?.preferences?.searchLevel]);

  useEffect(() => {
    // loadFriends defined above
    // call loader on mount / when user changes
    (async () => {
      await loadFriends();
    })();

    // also load incoming friend requests on page load
    const fetchIncoming = async () => {
      try {
        const incoming = await apiService.getIncomingRequests(user?._id);
        setIncomingRequests(incoming || []);
      } catch (err) {
        console.error("Error fetching incoming friend requests:", err);
      }
    };

    const fetchOutgoing = async () => {
      try {
        const outgoing = await apiService.getOutgoingRequests(user?._id);
        setOutgoingRequests(outgoing || []);
      } catch (err) {
        console.error("Error fetching outgoing friend requests:", err);
      }
    };

    fetchIncoming();
    fetchOutgoing();
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
        setFoundUsers(result.users as FoundUser[]);
        setShowMatchModal(true);
      } else {
        setFoundUsers([]);
        setShowMatchModal(true);
      }
    } catch (error: any) {
      console.error("Error finding study partners:", error);
      setError(error.message || "Failed to find study partners. Please try again.");
    } finally {
      setIsMatching(false);
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

      {/* successMessage banner removed to avoid green alert popups */}

      {/* Match results modal */}
      {showMatchModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4 py-8"
          onClick={() => {
            setShowMatchModal(false);
            setFoundUsers([]);
          }}
        >
          <div
            className="w-full max-w-2xl bg-card border border-border rounded-2xl p-6 shadow-2xl transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4 gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Study Partner Matches</h2>
                <p className="text-sm text-muted-foreground mt-1">Recommended classmates based on your preferences</p>
              </div>
              <button
                onClick={() => {
                  setShowMatchModal(false);
                  setFoundUsers([]);
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close matches"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {foundUsers.length === 0 ? (
                <div className="text-center text-muted-foreground p-6">No matches found.</div>
              ) : (
                foundUsers.map((fu) => {
                  const fullName = (fu.firstName || fu.lastName)
                    ? `${fu.firstName || ''} ${fu.lastName || ''}`.trim()
                    : fu.displayName || fu.username || 'Unknown';

                  return (
                    <div key={fu._id} className="flex items-center justify-between bg-secondary/10 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        {fu.profileImageUrl ? (
                          <img src={fu.profileImageUrl} alt={fullName} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm`}>{(fullName || "?").charAt(0)}</div>
                        )}
                        <div>
                          <div className="text-foreground font-medium">{fullName}</div>
                          <div className="text-xs text-muted-foreground">{fu.username ? `@${fu.username}` : (fu.displayName && fu.displayName !== fullName ? fu.displayName : '')}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {fu.requestSent ? (
                          <button className="px-3 py-1 bg-muted-foreground text-white rounded-md text-sm font-medium opacity-80" disabled>
                            Sent
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              if (!user?._id) {
                                setError("Please log in to send friend requests");
                                return;
                              }
                              try {
                                setMatchingWith(prev => new Set(prev).add(fu._id));
                                await apiService.sendFriendRequest(user._id, fu._id);
                                setSuccessMessage("Friend request sent");
                                setFoundUsers(prev => prev.map(p => p._id === fu._id ? { ...p, requestSent: true } : p));
                                const out = await apiService.getOutgoingRequests(user._id);
                                setOutgoingRequests(out || []);
                                const incomingUpdated = await apiService.getIncomingRequests(user._id);
                                setIncomingRequests(incomingUpdated || []);
                              } catch (err: any) {
                                console.error("Error sending friend request:", err);
                                setError(err?.message || "Failed to send friend request");
                              } finally {
                                setMatchingWith(prev => {
                                  const copy = new Set(prev);
                                  copy.delete(fu._id);
                                  return copy;
                                });
                              }
                            }}
                            disabled={matchingWith.has(fu._id)}
                            className="px-3 py-1 bg-primary hover:bg-primary/90 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {matchingWith.has(fu._id) ? "Adding..." : "Add"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* outgoing/incoming requests moved below friend list */}
      {friends.length === 0 ? (
        <div className="bg-card border border-border rounded-md p-8 text-center text-muted-foreground">
          <p>No friends yet. Start by connecting with classmates or colleagues.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {friends.map((friend) => (
            <FriendCard key={friend.id} friend={friend} />
          ))}
        </div>
      )}

      {/* Sent Friend Requests (Outgoing) */}
      {outgoingRequests.length > 0 && (
        <div className="bg-card border border-border rounded-md p-6 mt-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Sent Friend Requests</h2>
          <div className="space-y-3">
            {outgoingRequests.map((r) => {
              const fullName = (r.firstName || r.lastName)
                ? `${r.firstName || ''} ${r.lastName || ''}`.trim()
                : r.displayName || r.username || 'Unknown';

              return (
                <div key={r._id} className="flex items-center justify-between bg-secondary/10 p-3 rounded-md">
                  <div className="flex items-center gap-3">
                    {r.profileImageUrl ? (
                      <img src={r.profileImageUrl} alt={fullName} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">{(fullName || "?").charAt(0)}</div>
                    )}
                    <div>
                      <div className="text-foreground font-medium">{fullName}</div>
                      <div className="text-xs text-muted-foreground">{r.username ? `@${r.username}` : (r.displayName && r.displayName !== fullName ? r.displayName : '')}</div>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">Sent</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Incoming Friend Requests (moved below friend list) */}
      {incomingRequests.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 mt-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">Incoming Friend Requests</h2>
          <div className="space-y-3">
            {incomingRequests.map((r) => {
              const fullName = (r.firstName || r.lastName)
                ? `${r.firstName || ''} ${r.lastName || ''}`.trim()
                : r.displayName || r.username || 'Unknown';

              return (
                <div key={r._id} className="flex items-center justify-between bg-gradient-to-r from-white/0 to-secondary/5 p-3 rounded-lg border-l-4 border-transparent hover:border-l-primary transition-all">
                  <div className="flex items-center gap-3">
                    {r.profileImageUrl ? (
                      <img src={r.profileImageUrl} alt={fullName} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">{(fullName || "?").charAt(0)}</div>
                    )}
                    <div>
                      <div className="text-foreground font-medium">{fullName}</div>
                      <div className="text-xs text-muted-foreground">{r.username ? `@${r.username}` : (r.displayName && r.displayName !== fullName ? r.displayName : '')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        if (!user?._id) {
                          setError('Please log in to accept requests');
                          return;
                        }
                        try {
                          setAcceptingWith(prev => new Set(prev).add(r._id));
                          await apiService.acceptFriendRequest(user._id, r._id);
                          setSuccessMessage(`You are now friends with ${r.displayName}`);
                          setIncomingRequests(prev => prev.filter(p => p._id !== r._id));
                          await loadFriends();
                          const outAfter = await apiService.getOutgoingRequests(user._id);
                          setOutgoingRequests(outAfter || []);
                          const incAfter = await apiService.getIncomingRequests(user._id);
                          setIncomingRequests(incAfter || []);
                        } catch (err: any) {
                          console.error('Error accepting friend request:', err);
                          setError(err?.message || 'Failed to accept friend request');
                        } finally {
                          setAcceptingWith(prev => {
                            const copy = new Set(prev);
                            copy.delete(r._id);
                            return copy;
                          });
                        }
                      }}
                      disabled={acceptingWith.has(r._id)}
                      className="px-3 py-1 bg-primary hover:bg-primary/90 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {acceptingWith.has(r._id) ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => {
                        // Local decline: remove from list immediately. Server decline not implemented.
                        setIncomingRequests(prev => prev.filter(p => p._id !== r._id));
                      }}
                      className="px-3 py-1 border border-border text-muted-foreground rounded-md text-sm font-medium hover:bg-secondary"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggested Friends section removed per UI update request */}
    </div>
  );
};

export default FriendsPage;
