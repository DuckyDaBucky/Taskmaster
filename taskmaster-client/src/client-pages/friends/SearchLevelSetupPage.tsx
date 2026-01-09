import React, { useState, useEffect } from "react";
import { userService } from "../../services/api/userService";
import { classService } from "../../services/api/classService";
import { useUser } from "../../context/UserContext";

interface SearchLevelSetupPageProps {
  onComplete: () => void;
}

interface ClassData {
  _id: string;
  name: string;
  professor?: string;
  isPersonal?: boolean;
}

const SearchLevelSetupPage: React.FC<SearchLevelSetupPageProps> = ({ onComplete }) => {
  const { user, setUserState } = useUser();
  const [selectedLevel, setSelectedLevel] = useState<"class" | "major" | "school" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [showClassSelection, setShowClassSelection] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  // Fetch classes when class level is selected
  useEffect(() => {
    if (selectedLevel === "class" && !showClassSelection) {
      const fetchClasses = async () => {
        try {
          setError(null);
          const classList = await classService.getAllClasses();
          // Filter out personal classes
          const nonPersonal = classList.filter(c => !c.isPersonal);
          setClasses(nonPersonal);
          setShowClassSelection(true);
        } catch (err: any) {
          console.error("Error fetching classes:", err);
          setError("Failed to load your classes. Please try again.");
          setSelectedLevel(null);
        }
      };
      fetchClasses();
    }
  }, [selectedLevel, showClassSelection]);

  const handleSelectLevel = async (level: "class" | "major" | "school") => {
    if (level === "class") {
      // Show class selection instead of immediately saving
      setSelectedLevel(level);
      return;
    }

    // For major and school, save immediately
    await saveSearchLevel(level);
  };

  const handleSelectClass = async (classId: string) => {
    setSelectedClass(classId);
    await saveSearchLevel("class", classId);
  };

  const saveSearchLevel = async (level: "class" | "major" | "school", classId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await userService.setSearchLevel(level, classId);
      
      // Update user context with the new search level
      if (user) {
        setUserState({
          preferences: {
            searchLevel: level,
            section: user.preferences?.section || "",
            course: classId || user.preferences?.course || "",
          },
        });
      }

      // Call the callback to show the main friends page
      onComplete();
    } catch (err: any) {
      console.error("Error setting search level:", err);
      setError(err.message || "Failed to set search level. Please try again.");
      setIsLoading(false);
      setSelectedLevel(null);
      setShowClassSelection(false);
      setSelectedClass(null);
    }
  };

  const searchLevelOptions = [
    {
      id: "class",
      title: "Class",
      description: "Find study partners from your classes",
      icon: "📚",
    },
    {
      id: "major",
      title: "Major",
      description: "Connect with students in your major",
      icon: "🎓",
    },
    {
      id: "school",
      title: "School",
      description: "Meet students from your school",
      icon: "🏫",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-lg p-8">
        {!showClassSelection ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Set Your Search Level</h1>
              <p className="text-muted-foreground">
                How would you like to find study partners?
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3 mb-8">
              {searchLevelOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectLevel(option.id as "class" | "major" | "school")}
                  disabled={isLoading}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedLevel === option.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 bg-background"
                  } ${isLoading && selectedLevel !== option.id ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{option.title}</h3>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                    {selectedLevel === option.id && isLoading && (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              You can change this preference later in your settings
            </p>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Select Your Class</h1>
              <p className="text-muted-foreground">
                Which class would you like to find study partners from?
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            {classes.length === 0 ? (
              <div className="text-center text-muted-foreground">
                <p className="mb-4">You don't have any classes yet.</p>
                <button
                  onClick={() => {
                    setShowClassSelection(false);
                    setSelectedLevel(null);
                  }}
                  className="px-4 py-2 border border-border hover:bg-secondary rounded-md text-sm font-medium transition-colors"
                >
                  Go Back
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-8 max-h-96 overflow-y-auto">
                  {classes.map((cls) => (
                    <button
                      key={cls._id}
                      onClick={() => handleSelectClass(cls._id)}
                      disabled={isLoading}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        selectedClass === cls._id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 bg-background"
                      } ${isLoading && selectedClass !== cls._id ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">📖</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{cls.name}</h3>
                          {cls.professor && (
                            <p className="text-sm text-muted-foreground">{cls.professor}</p>
                          )}
                        </div>
                        {selectedClass === cls._id && isLoading && (
                          <div className="flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setShowClassSelection(false);
                    setSelectedLevel(null);
                  }}
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-border hover:bg-secondary rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Go Back
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchLevelSetupPage;
