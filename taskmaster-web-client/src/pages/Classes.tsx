import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState } from "react";
import { apiService } from "../services/apiService";
import { X } from "lucide-react";
import { PageContainer } from "../components/ui/PageContainer";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { theme } from "../constants/theme";

// Interface for class data (using lowercase string)
interface ClassData {
  _id: string;
  name: string; // Standardized to lowercase string
  professor: string; // Standardized to lowercase string
  timing: string; // Standardized to lowercase string
  examDates: string[]; // Standardized to lowercase string array
  topics: string[]; // Standardized to lowercase string array
  gradingPolicy: string; // Standardized to lowercase string
  contactInfo: string; // Standardized to lowercase string
  textbooks: string[]; // Standardized to lowercase string array
  location: string; // Standardized to lowercase string
  user: string; // Standardized to lowercase string
}

// Interface for user data from /me endpoint
interface UserData {
  _id: string;
}

// Form schema remains the same
const schema = z.object({
  file: z.instanceof(FileList).refine((files) => files.length > 0, {
    message: "File is required",
  }),
});

type FormData = z.infer<typeof schema>;

const Classes = () => {
  // Original state variables
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({
    message: "",
    type: "success" as "success" | "error",
    show: false,
  });
  const [userClasses, setUserClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(false); // Combined loading state
  const [error, setError] = useState<string | null>(null); // Use string for error message

  // State and constant added for backend integration
  const [userData, setUserData] = useState<UserData | null>(null); // Store fetched user data (optional)
  const token = localStorage.getItem("token"); // Get token

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fileName = watch("file")?.[0]?.name ?? null;

  // onSubmit updated with backend integration logic
  const onSubmit = async (data: FormData) => {
    if (!token) {
        setToast({ message: "Authentication token not found. Please log in.", type: "error", show: true });
        return;
    }

    const file = data.file[0];
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setToast({ message: "", type: "success", show: false }); // Clear previous toast

    try {
      // 1. Get user ID from /me endpoint
      const userResp = await apiService.getUserMe(token);
      const userId = userResp._id;
      setUserData(userResp); // Store user data if needed elsewhere

      // 2. Upload the file using the fetched user ID
      await apiService.uploadSyllabus(userId, file, token);

      // Use original success toast message
      setToast({
        message: "File uploaded successfully. Please wait up to 2 minutes for data to be parsed",
        type: "success",
        show: true,
      });
      reset(); // Clears file input

      // Optionally: Trigger a refetch of classes after successful upload
      // fetchClasses(); // You would need to extract fetchClasses logic to call it here

    } catch (err: any) {
      console.error("Upload Error:", err);
      // Use original error toast message style, but potentially more specific error
      const message = err.response?.data?.message || err.message || "File upload failed. Please try again.";
      setToast({
        message: message,
        type: "error",
        show: true,
      });
    } finally {
      setUploading(false);
    }
  };

  // useEffect updated with backend integration logic
  useEffect(() => {
    const fetchClasses = async () => { // Make the function async
      setLoading(true);
      setError(null);

      if (!token) {
        setError("Authentication token not found. Please log in.");
        setLoading(false);
        setUserClasses([]); // Ensure classes are cleared if no token
        return;
      }

      try {
        // 1. Get user ID from /me endpoint
        const userResp = await apiService.getUserMe(token);
        const userId = userResp._id;
        setUserData(userResp); // Store user data if needed

        // 2. Fetch classes using the obtained user ID
        const classes = await apiService.getClassesByUserId(userId, token);
        setUserClasses(classes);

      } catch (err: any) {
        console.error("Failed to fetch classes:", err);
        const message = err.response?.data?.message || err.message || "Failed to load classes.";
        setError(message); // Set specific error message
        setUserClasses([]); // Clear classes on error
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [token]); // Re-run effect if token changes


  // --- Original JSX Structure and Styling (Unaltered) ---

  // Loading State
  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-screen">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-4 border-t-transparent"
            style={{ 
              borderColor: theme.colors.accentPrimary,
              borderTopColor: "transparent"
            }}
          />
        </div>
      </PageContainer>
    );
  }

  // Error State
  if (error && userClasses.length === 0 && !loading) {
    return (
      <PageContainer>
        <div className="text-center p-6" style={{ color: theme.colors.error }}>
          {error}
        </div>
      </PageContainer>
    );
  }

  // Main component return
  return (
    <PageContainer>
      {/* Toast Notification */}
      {toast.show && (
        <div
          className="fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border"
          style={{
            backgroundColor: toast.type === "success" 
              ? `rgba(107, 107, 255, 0.1)` 
              : `rgba(239, 68, 68, 0.1)`,
            color: toast.type === "success" ? theme.colors.accentPrimary : theme.colors.error,
            borderColor: toast.type === "success" 
              ? `rgba(107, 107, 255, 0.3)` 
              : `rgba(239, 68, 68, 0.3)`,
            borderRadius: theme.borderRadius.card,
          }}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="ml-auto text-xl font-bold transition"
            style={{ 
              color: toast.type === "success" ? theme.colors.accentPrimary : theme.colors.error 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="relative z-10 space-y-6">
         {error && (
           <div 
             className="mb-4 p-3 rounded-md"
             style={{ 
               backgroundColor: `rgba(239, 68, 68, 0.1)`,
               color: theme.colors.error,
               border: `1px solid rgba(239, 68, 68, 0.3)`
             }}
           >
             {error}
           </div>
         )}

        <h1 className="text-3xl font-bold" style={{ color: theme.colors.textPrimary }}>
          AI Syllabus Reader
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Card title="Upload Syllabus">
            <label
              htmlFor="file"
              className="relative border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer block"
              style={{
                borderColor: "#E3E4EC",
                backgroundColor: "#FFFFFF",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#6B6BFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E3E4EC";
              }}
            >
              <p style={{ color: "#6C7080" }}>
                Drag or click to select a file (PDF, DOCX)
              </p>
              <input
                id="file"
                type="file"
                 accept=".pdf,.doc,.docx" // Added accept attribute for clarity
                {...register("file")}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </label>
            {errors.file && (
              <p className="text-sm mt-1" style={{ color: theme.colors.error }}>
                {errors.file.message}
              </p>
            )}
            {fileName && (
              <p className="text-sm mt-2" style={{ color: theme.colors.textSecondary }}>
                <strong style={{ color: theme.colors.textPrimary }}>Selected File:</strong> {fileName}
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              className="mt-4"
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Submit"}
            </Button>
          </Card>
        </form>

        {/* Classes Section */}
        <h2 className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
          Classes
        </h2>
        {userClasses.length === 0 && !loading && (
          <p style={{ color: theme.colors.textSecondary }}>
            No classes found. Upload a syllabus to get started.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
          {userClasses.map((classItem) => (
            <Card key={classItem._id} className="flex flex-col" hoverable>
              <h3 className="text-lg font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
                {classItem.name}
              </h3>
              <p className="text-sm mb-1" style={{ color: theme.colors.textSecondary }}>
                <strong style={{ color: theme.colors.textPrimary }}>Professor:</strong> {classItem.professor}
              </p>
              <p className="text-sm mb-1" style={{ color: theme.colors.textSecondary }}>
                <strong style={{ color: theme.colors.textPrimary }}>Location:</strong> {classItem.location || "N/A"}
              </p>
              <p className="text-sm mb-1" style={{ color: theme.colors.textSecondary }}>
                <strong style={{ color: theme.colors.textPrimary }}>Timing:</strong> {classItem.timing || "N/A"}
              </p>
              <p className="text-sm mb-1" style={{ color: theme.colors.textSecondary }}>
                <strong style={{ color: theme.colors.textPrimary }}>Topics:</strong>
              </p>
              <div 
                className="border rounded-lg p-3 max-h-32 overflow-y-auto mb-3"
                style={{ 
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceMuted
                }}
              >
                {classItem.topics && classItem.topics.length > 0 ? (
                  <ul className="list-disc list-inside text-sm space-y-1" style={{ color: theme.colors.textSecondary }}>
                    {classItem.topics.map((topic, index) => (
                      <li key={index}>{topic}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs italic" style={{ color: theme.colors.textSecondary }}>
                    No topics listed.
                  </p>
                )}
              </div>
              <p className="text-sm mt-auto" style={{ color: theme.colors.textSecondary }}>
                <strong style={{ color: theme.colors.textPrimary }}>Grading Policy:</strong> {classItem.gradingPolicy || "N/A"}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};

export default Classes;