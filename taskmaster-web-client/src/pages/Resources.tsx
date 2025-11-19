import { apiService } from "../services/apiService";
import { useEffect, useState } from "react";

// Interfaces remain the same from the first snippet
interface ResourceData {
  _id: string;
  urls: string[];
  class: string; // Links ResourceData to ClassData._id
}

interface ClassData {
  _id: string;
  name: string;
  professor: string;
  timing: string;
  examDates: string[];
  topics: string[];
  gradingPolicy: string;
  contactInfo: string;
  textbooks: string[];
  location: string;
  user: string;
}

// Interface added for user data fetching
interface UserData {
    _id: string;
}


const Resources = () => {
  // State variables remain the same
  const [userClasses, setUserClasses] = useState<ClassData[]>([]);
  const [resources, setResources] = useState<ResourceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useEffect updated with backend integration logic
  useEffect(() => {
    const fetchClassesAndResources = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get token from localStorage
        const token = localStorage.getItem("token");
        if (!token) {
            // Set error and stop loading if no token is found
            setError("Authentication token not found. Please log in.");
            setLoading(false);
            return; // Exit early
        }

        // 1) Fetch current user to get real userId
        const userRes = await apiService.getUserMe(token);
        const userId = userRes._id;

        // 2) Fetch classes for that user
        const classes = await apiService.getClassesByUserId(userId, token);
        setUserClasses(classes);

        // If no classes found, no need to fetch resources
        if (classes.length === 0) {
            setResources([]); // Ensure resources are empty
            setLoading(false); // Stop loading
            return; // Exit early
        }

        // 3) Fetch resources for each class in parallel
        const resourcesPromises = classes.map((cls) =>
          apiService.getResourcesByClassId(cls._id, token)
          // Add individual catch blocks to handle errors for specific resource fetches gracefully
          .catch(err => {
              console.warn(`Failed to fetch resources for class ${cls.name} (${cls._id}):`, err.message);
              // Return an empty array so Promise.all doesn't fail completely
              return [];
          })
        );
        const resourcesResults = await Promise.all(resourcesPromises);

        // Flatten all results - apiService returns ResourceData[] which has urls arrays
        const allResources = resourcesResults.flatMap((r) => 
          (r && Array.isArray(r) ? r.flatMap((resource) => resource.urls) : [])
        );
        setResources(allResources);

      } catch (err: any) {
        // Handle critical errors (like user fetch, class fetch, or token issues)
        console.error("Error fetching data:", err);
        const message = err.response?.data?.message || err.message || "Failed to load data.";
        setError(message);
        // Clear data on critical errors
        setUserClasses([]);
        setResources([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClassesAndResources();
    // Dependency array includes token - if the token changes (e.g., re-login), refetch data
  }, [/* token */]); // Assuming token is stable during component lifecycle, or add if needed

  // --- Original JSX Structure and Styling (Unaltered) ---

  // Loading state using original styling
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        {/* Original spinner style */}
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
      </div>
    );

  // Error state using original styling (only shows critical load errors)
  if (error && !loading && userClasses.length === 0) // Condition to show full page error
    return (
      // Original error style
      <div className="text-center text-destructive p-6">{error}</div>
    );

  // Main content rendering using original styling
  return (
    // Added min-h-screen for better page structure
    <div className="relative min-h-screen w-full text-gray-900 dark:text-darkText transition">
       {/* Display non-critical errors (e.g., if token was missing initially) */}
       {error && <div className="p-4 mb-4 max-w-7xl mx-auto bg-destructive/10 text-destructive rounded-md border border-destructive/30">{error}</div>}

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Original title style */}
        <h2 className="text-2xl font-bold mb-6 text-center text-emphasis"> {/* Increased mb */}
          Your Class Resources
        </h2>

        {userClasses.length === 0 && !loading ? ( // Added !loading check
          // Original 'no classes' message style
          <p className="text-center text-muted-foreground py-10">
            No classes found for your account. Resources are linked to classes added via the 'AI Syllabus Reader'.
          </p>
        ) : (
          // Original grid layout and card styling
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-center pb-10">
            {userClasses.map((cls) => {
              // Find resource data associated with the current class ID
              // This assumes one ResourceData document per class, adjust if structure differs
               const classResources = resources.filter((r) => r.class === cls._id);
               const urls = classResources.flatMap(r => r.urls); // Combine URLs if multiple docs match

              return (
                <div
                  key={cls._id}
                  // Original card styles
                  className="bg-card text-card-foreground shadow-md rounded-md p-4 hover:shadow-lg transition-shadow duration-300 max-w-sm w-full mx-auto border border-border"
                >
                  {/* Original class name style */}
                  <h3 className="text-lg font-semibold text-emphasis mb-1">
                    {cls.name}
                  </h3>
                  {/* Original professor info style */}
                  <p className="text-xs text-muted-foreground mb-2">
                    <strong>Professor:</strong> {cls.professor || "N/A"} {/* Added fallback */}
                  </p>
                  {/* Check aggregated URLs */}
                  {urls && urls.length > 0 ? (
                    <div>
                       {/* Original resource title style */}
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        Resources:
                      </h4>
                      {/* Added max-height and scrollbar */}
                      <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
                        {urls.map((url, i) => (
                          // Original link container style
                          <div
                            key={i}
                            // Use last:border-b-0 to remove border only from the very last item
                            className="border-b border-border last:border-b-0 pb-1"
                          >
                            {/* Original link style */}
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline block truncate text-sm"
                              title={url} // Add title for full URL visibility on hover
                            >
                              {/* Attempt to display a cleaner name from the URL */}
                              {decodeURIComponent(url.split('/').pop() || url)}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                     // Original 'no resources' message style
                    <p className="text-xs italic text-muted-foreground">
                      No resources available for this class.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Resources;
