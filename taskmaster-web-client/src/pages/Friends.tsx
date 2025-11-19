// FriendsPage.tsx

import React, { useState, useEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import FriendCard from "../components/FriendCard";
import FriendDetailsPanel from "../components/FriendDetailsPanel";
import FriendInfoOverlay from "../components/FriendInfoOverlay";
import { useUser } from "../context/UserContext";
import { apiService } from "../services/apiService";

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

interface UserData {
  _id: string;
}

const realisticUsernames = [
  "alex_m",
  "jane.doe23",
  "ron_techie",
  "maria.writes",
  "kevin.codes",
  "chris_dev99",
  "laura_physics",
  "sunny_day7",
  "nina.draws",
  "mark.runner",
  "violet.art",
  "khalid_math",
  "emma.reader",
  "toby_travel",
  "liam_bio"
];

const generateRandomFriend = (id: string, username?: string): Friend => {
  const courses = [
    "Cybersecurity",
    "Astrophysics",
    "Game Design",
    "Philosophy",
    "Machine Learning"
  ];
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  return {
    id,
    username: username ?? pick(realisticUsernames),
    isOnline: Math.random() < 0.6,
    commonCourses: [pick(courses), pick(courses)],
    personalityProfile: {
      personality: Math.random(),
      preferred_time: Math.floor(Math.random() * 3) + 1,
      in_person: Math.random() < 0.5 ? 0 : 1,
      private_space: Math.random() < 0.5 ? 0 : 1
    }
  };
};

const getMatchedFriends = async (): Promise<string[]> => {
  const token = localStorage.getItem("token");

  try {
    const userResp = await apiService.getUserMe(token);

    const response = await apiService.matchFriends(userResp._id);

    const users = response.users;

    if (Array.isArray(users)) {
      return users.map((u) => String(u));
    } else if (typeof users === "string") {
      return users.split(",").map((u: string) => u.trim());
    } else {
      console.warn("Unexpected user format from /match:", users);
      return [];
    }
  } catch (err) {
    console.error("Error fetching matched friends:", err);
    return [];
  }
};

const FriendsPage: React.FC = () => {
  const { personalityData } = useUser();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [randomPool, setRandomPool] = useState<Friend[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "online" | "offline">("all");
  const [overlayFriendId, setOverlayFriendId] = useState<string | null>(null);
  const [chatTargetFriendId, setChatTargetFriendId] = useState<string | null>(null);
  const [showMatchedMessage, setShowMatchedMessage] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<Friend | null>(null);

  useEffect(() => {
    const initialFriends = Array.from({ length: 5 }, (_, i) =>
      generateRandomFriend(i.toString())
    );
    setFriends(initialFriends);
  }, []);

  const filteredFriends = useMemo(() => {
    return friends
      .filter((friend) => {
        if (filter === "online") return friend.isOnline;
        if (filter === "offline") return !friend.isOnline;
        return true;
      })
      .filter((friend) =>
        friend.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [friends, searchTerm, filter]);

  const overlayFriend = useMemo(
    () => friends.find((f) => f.id === overlayFriendId) || null,
    [friends, overlayFriendId]
  );
  const chatTargetFriend = useMemo(
    () => friends.find((f) => f.id === chatTargetFriendId) || null,
    [friends, chatTargetFriendId]
  );

  const handleMatchClick = async () => {
    const matchedUsernames = await getMatchedFriends();
    const newPool = matchedUsernames.map((username, i) =>
      generateRandomFriend(`match-${i}`, username)
    );
    setRandomPool(newPool);
    setIsMatchModalOpen(true);
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-emphasis mb-6">Friends</h1>

        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="flex h-full">
            <div className="w-full md:w-1/3 border-r border-border p-4">
              <input
                type="text"
                placeholder="Search friends..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full mb-4 px-4 py-2 border rounded-md text-sm"
              />

              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  {["all", "online", "offline"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilter(type as any)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        filter === type
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleMatchClick}
                  className="px-3 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
                >
                  Match Friends
                </button>
              </div>

              {showMatchedMessage && (
                <div className="mb-2 text-sm font-semibold text-green-600 text-center animate-bounce">
                  🎉 Matched!
                </div>
              )}

              <div className="space-y-2 overflow-y-auto">
                {filteredFriends.map((friend) => (
                  <FriendCard
                    key={friend.id}
                    friend={friend}
                    isSelected={overlayFriendId === friend.id}
                    onClick={() => setOverlayFriendId(friend.id)}
                  />
                ))}
              </div>
            </div>
            <div className="flex-1">
              <FriendDetailsPanel friend={chatTargetFriend} />
            </div>
          </div>

          <AnimatePresence>
            {overlayFriend && (
              <FriendInfoOverlay
                friend={overlayFriend}
                onClose={() => setOverlayFriendId(null)}
                onMessageButtonClick={(id) => setChatTargetFriendId(id)}
              />
            )}
          </AnimatePresence>
        </div>

        {isMatchModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-card p-6 rounded-xl shadow-xl max-w-md w-full">
              <h2 className="text-lg font-semibold mb-4">
                Select a friend to match
              </h2>
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {randomPool
                  .filter((f) => !friends.find((fr) => fr.id === f.id))
                  .map((friend) => (
                    <div
                      key={friend.id}
                      onClick={() => setSelectedToAdd(friend)}
                      className={`cursor-pointer border rounded-md p-3 transition ${
                        selectedToAdd?.id === friend.id
                          ? "border-primary bg-muted"
                          : "border-border"
                      }`}
                    >
                      <div className="font-medium">{friend.username}</div>
                      <div className="text-xs text-muted-foreground">
                        Courses: {friend.commonCourses.join(", ")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Prefers{" "}
                        {friend.personalityProfile.in_person
                          ? "In-Person"
                          : "Virtual"}
                        ,{" "}
                        {
                          ["", "Morning", "Afternoon", "Evening"][
                            friend.personalityProfile.preferred_time
                          ]
                        }
                      </div>
                    </div>
                  ))}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsMatchModalOpen(false)}
                  className="px-3 py-1 text-sm rounded-md bg-muted text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  disabled={!selectedToAdd}
                  onClick={() => {
                    if (selectedToAdd) {
                      setFriends((prev) => [...prev, selectedToAdd]);
                      setChatTargetFriendId(selectedToAdd.id);
                      setSelectedToAdd(null);
                      setIsMatchModalOpen(false);
                      setShowMatchedMessage(true);
                      setTimeout(() => setShowMatchedMessage(false), 2000);
                    }
                  }}
                  className="px-3 py-1 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Add Friend
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FriendsPage;
