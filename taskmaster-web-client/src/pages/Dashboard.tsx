import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { apiService } from "../services/apiService";
import { Card } from "../components/ui/Card";
import { Chip } from "../components/ui/Chip";
import { PageContainer } from "../components/ui/PageContainer";
import { theme } from "../constants/theme";

// --- Interfaces (Define data structures) ---
interface UserData {
  _id: string;
  name?: string; // Use name if available, fallback needed
  firstName?: string; // Or use firstName/lastName
  lastName?: string;
  username?: string; // Keep username if available
  email?: string;
  profileImageUrl?: string; // Keep for potential future use
}

interface ClassData {
  _id: string;
  name: string;
  location?: string; // Keep location if needed later
  // Add other fields if needed by other logic
}

interface ResourceData {
  _id: string;
  urls: string[];
  class: string; // classId
}

interface TasksData {
  _id: string;
  deadline: string;
  topic: string;
  title: string;
  status: "pending" | "completed" | "overdue";
  className?: string; // Added during fetch
}

// interface PersonalityProfile {
//   personality: number;
//   preferred_time: number;
//   in_person: number;
//   private_space: number;
// }

interface Friend {
  id: string;
  username: string;
  isOnline: boolean;
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

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateRandomFriend = (id: string): Friend => ({
  id,
  username: pick(realisticUsernames),
  isOnline: Math.random() < 0.6,
});


const Dashboard = () => {
  const navigate = useNavigate();

  // --- State Variables ---
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userClasses, setUserClasses] = useState<ClassData[]>([]);
  const [dashboardResources, setDashboardResources] = useState<string[]>([]);
  const [dashboardTasks, setDashboardTasks] = useState<TasksData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem("token");
  const [dummyFriends, setDummyFriends] = useState<Friend[]>([]);

  // --- Fetching Logic ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      if (!token) {
        setError("Authentication required. Please log in.");
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch User Data
        const userRes = await apiService.getUserMe(token);
        setUserData(userRes);
        const userId = userRes._id;

        // 2. Fetch Classes
        const classes = await apiService.getClassesByUserId(userId, token);
        setUserClasses(classes);

        const generated = Array.from({ length: 3 }, (_, i) =>
          generateRandomFriend(i.toString())
        );
        setDummyFriends(generated);

        // 3. Fetch Resources & Tasks in Parallel (only if classes exist)
        if (classes.length > 0) {
          const classIds = classes.map((c) => c._id);

          const resourcePromises = classIds.map((id) =>
            apiService
              .getResourcesByClassId(id, token)
              .then((resources) => resources.flatMap((r) => r.urls)) // Extract URLs directly
              .catch((err) => {
                console.warn(
                  `Failed fetching resources for class ${id}:`,
                  err.message
                );
                return []; // Return empty array on error
              })
          );

          // 4. Fetch Friends

          // const friendsRes = await axios.get<Friend[]>(
          //   `http://localhost:3000/user/friends/${userId}`,
          //   { headers: { "x-auth-token": token } }
          // );
          // setFriends(friendsRes.data);

          const taskPromises = classes.map(
            (
              c // Use full class data here
            ) =>
              apiService
                .getTasksByClassId(c._id, token)
                .then((tasks) =>
                  tasks.map((t) => ({ ...t, className: c.name }))
                ) // Add class name
                .catch((err) => {
                  console.warn(
                    `Failed fetching tasks for class ${c._id}:`,
                    err.message
                  );
                  return []; // Return empty array on error
                })
          );

          const [resourceUrlsArrays, taskArrays] = await Promise.all([
            Promise.all(resourcePromises),
            Promise.all(taskPromises),
          ]);

          // Process Resources: Flatten and take first 3 URLs
          const allResourceUrls = resourceUrlsArrays.flat();
          setDashboardResources(allResourceUrls.slice(0, 3));

          // Process Tasks: Flatten, filter pending/overdue, sort by deadline, take first 3
          const allTasks = taskArrays.flat();
          const relevantTasks = allTasks
            .filter(
              (task) => task.status === "pending" || task.status === "overdue"
            ) // Filter for relevant tasks
            .sort(
              (a, b) =>
                new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
            ); // Sort by deadline
          setDashboardTasks(relevantTasks.slice(0, 3));
        } else {
          // No classes, so no resources or tasks to fetch
          setDashboardResources([]);
          setDashboardTasks([]);
        }
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        const message =
          err.response?.data?.message ||
          err.message ||
          "Failed to load dashboard data.";
        setError(message);
        // Clear potentially partial data
        setUserData(null);
        setUserClasses([]);
        setDashboardResources([]);
        setDashboardTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  // --- Dashboard Card Component (extends base Card) ---
  const DashboardCard = ({
    title,
    link,
    children,
    className = "",
  }: {
    title: string;
    link: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <Card
      title={title}
      onClick={() => navigate(link)}
      className={className}
    >
      {children}
    </Card>
  );

  // --- Helper to format resource URL ---
  const formatResourceUrl = (url: string): string => {
    try {
      const urlParts = url.split("/");
      const filename = urlParts.pop(); // Get last part
      // Decode URI component and limit length
      return (
        decodeURIComponent(filename || url).substring(0, 50) +
        ((filename || url).length > 50 ? "..." : "")
      );
    } catch (e) {
      return url.substring(0, 50) + (url.length > 50 ? "..." : ""); // Fallback
    }
  };

  // --- Loading State ---
  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-screen">
          <div 
            className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent"
            style={{ 
              borderColor: theme.colors.accentPrimary,
              borderTopColor: "transparent"
            }}
          />
        </div>
      </PageContainer>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-screen text-center p-6" style={{ color: theme.colors.error }}>
          Error: {error}
        </div>
      </PageContainer>
    );
  }

  // --- Main Render ---
  return (
    <PageContainer className="overflow-hidden">
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-6 gap-4 pb-8">
        {/* User Profile Card */}
        <DashboardCard title="User Profile" link="/profile" className="md:col-span-2">
          <div 
            className="p-3 rounded-lg"
            style={{ 
              backgroundColor: theme.colors.surfaceMuted, 
              border: `1px solid ${theme.colors.border}` 
            }}
          >
            <p className="font-medium" style={{ color: theme.colors.textPrimary }}>
              {userData?.name ||
                `${userData?.firstName || ""} ${
                  userData?.lastName || ""
                }`.trim() ||
                userData?.username ||
                "Username"}
            </p>
            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
              {userData?.email || "email@example.com"}
            </p>
          </div>
        </DashboardCard>

        {/* Friends Card */}
        <DashboardCard title="Friends" link="/friends" className="md:col-span-2">
          <div className="space-y-2">
            {dummyFriends.length > 0 ? (
              dummyFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex justify-between items-center px-3 py-2 rounded-md"
                  style={{ 
                    backgroundColor: theme.colors.surfaceMuted, 
                    border: `1px solid ${theme.colors.border}` 
                  }}
                >
                  <div className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                    {friend.username}
                  </div>
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ 
                      backgroundColor: friend.isOnline ? theme.colors.success : "#9ca3af" 
                    }}
                    title={friend.isOnline ? "Online" : "Offline"}
                  />
                </div>
              ))
            ) : (
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                No friends yet.
              </p>
            )}
          </div>
        </DashboardCard>

        {/* Resources Card */}
        <DashboardCard title="Resources" link="/resources" className="md:col-span-2">
          <div className="grid gap-1">
            {dashboardResources.length > 0 ? (
              dashboardResources.map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 truncate transition-colors"
                  style={{ color: theme.colors.textSecondary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = theme.colors.accentPrimary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme.colors.textSecondary;
                  }}
                  title={url}
                >
                  {/* Link Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-3.5 h-3.5 flex-shrink-0"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                    />
                  </svg>
                  <span className="truncate">{formatResourceUrl(url)}</span>
                </a>
              ))
            ) : (
              <p style={{ color: theme.colors.textSecondary }}>
                No recent resources found.
              </p>
            )}
          </div>
        </DashboardCard>

        {/* Classes Card */}
        <DashboardCard title="Classes" link="/classes" className="md:col-span-4">
          <div className="flex flex-wrap gap-2">
            {userClasses.length > 0 ? (
              userClasses.slice(0, 8).map((cls) => (
                <Chip key={cls._id}>
                  {cls.name}
                </Chip>
              ))
            ) : (
              <p style={{ color: theme.colors.textSecondary }}>
                No classes found.
              </p>
            )}
            {userClasses.length > 8 && (
              <span className="text-xs self-center" style={{ color: theme.colors.textSecondary }}>
                ...and more
              </span>
            )}
          </div>
        </DashboardCard>

        {/* Calendar Card */}
        <DashboardCard title="Calendar" link="/calendar" className="md:col-span-2">
          <div 
            className="p-3 rounded-md"
            style={{ 
              backgroundColor: theme.colors.surfaceMuted, 
              border: `1px solid ${theme.colors.border}` 
            }}
          >
            <p style={{ color: theme.colors.textPrimary }}>
              📅 Bio Quiz due May 2, 11:59 PM
            </p>
          </div>
        </DashboardCard>

        {/* Tasks Card */}
        <DashboardCard title="Tasks" link="/tasks" className="md:col-span-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {dashboardTasks.length > 0 ? (
              dashboardTasks.map((task) => (
                <div
                  key={task._id}
                  className="p-3 rounded-md"
                  style={{
                    backgroundColor: theme.colors.surfaceMuted,
                    border: `1px solid ${theme.colors.border}`,
                    boxShadow: theme.shadows.card,
                  }}
                >
                  <span className="font-medium" style={{ color: theme.colors.textPrimary }}>
                    {task.title}
                  </span> ({task.className})
                  <br />
                  <span className="text-xs" style={{ color: theme.colors.textSecondary }}>
                    Due: {new Date(task.deadline).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              ))
            ) : (
              <p className="sm:col-span-3 text-center py-4" style={{ color: theme.colors.textSecondary }}>
                No upcoming tasks found.
              </p>
            )}
          </div>
        </DashboardCard>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
