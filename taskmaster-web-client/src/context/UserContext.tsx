import { apiService } from "../services/apiService";
import { supabase } from "../lib/supabase";
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";

// Interface representing the user data structure used within the context,
// based directly on the expected API response.
interface UserData {
  _id: string;
  name?: string; // Optional combined name field
  firstName?: string; // Optional first name
  lastName?: string; // Optional last name
  username?: string; // Optional username (Corrected from userName)
  email: string; // Email should ideally always be present
  profileImageUrl?: string; // Optional profile image URL
  preferences?: {
    personality: number;
    inPerson: number;
    privateSpace: number;
    time: number;
  points?: number;
  streak?: number;
  level?: number;
  };
  friendsList?: string[]; // Array of friend user IDs
}

// Define the structure for personality data (remains the same)
export interface PersonalityData {
  introversionExtroversion: number; // 0-100
  preferredTime: "Morning" | "Afternoon" | "Evening" | null;
  interactionType: "In Person" | "Virtual" | null;
  preferredSpace: "Public" | "Private" | null; // Relevant only if interactionType is 'In Person'
}

// Define the props for the UserContext
interface UserContextProps {
  user: UserData | null; // Use UserData directly
  isLoadingUser: boolean; // Flag to indicate if user data is being fetched
  setUserState: (userData: Partial<UserData>) => void; // Function to update user state partially
  logout: () => void;
  personalityData: PersonalityData | null;
  updatePersonalityData: (data: Partial<PersonalityData>) => void;
  isPersonalityComplete: boolean;
}

// Create the UserContext
const UserContext = createContext<UserContextProps | undefined>(undefined);

// Default/initial personality data
const defaultPersonalityData: PersonalityData = {
  introversionExtroversion: 50,
  preferredTime: null,
  interactionType: null,
  preferredSpace: null,
};

// UserProvider component
export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // User State - Initialize to null, type is UserData
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true); // Start loading

  // Personality Data State
  const [personalityData, setPersonalityData] =
    useState<PersonalityData | null>(null);

  // Personality Completion State
  const [isPersonalityComplete, setIsPersonalityComplete] =
    useState<boolean>(false);

  // --- Effects ---

  // Effect to fetch user data on mount and listen for auth changes
  useEffect(() => {
    const loadUser = async () => {
      setIsLoadingUser(true);
      
      try {
        // Check Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // User is authenticated, fetch user data
          const fetchedUserData = await apiService.getUserMe();
          
          // Refine fetched data
          const refinedUserData: UserData = {
            ...fetchedUserData,
            email: fetchedUserData.email || "no-email@example.com",
            username: (fetchedUserData as any).userName || fetchedUserData.username,
          };

          setUser(refinedUserData);
          // Store in localStorage for quick access (optional, Supabase manages session)
          localStorage.setItem("userData", JSON.stringify(refinedUserData));
        } else {
          // No session, user is not authenticated
          setUser(null);
          localStorage.removeItem("userData");
          localStorage.removeItem("token"); // Clear any legacy tokens
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setUser(null);
        localStorage.removeItem("userData");
        localStorage.removeItem("token");
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          const fetchedUserData = await apiService.getUserMe();
          const refinedUserData: UserData = {
            ...fetchedUserData,
            email: fetchedUserData.email || "no-email@example.com",
            username: (fetchedUserData as any).userName || fetchedUserData.username,
          };
          setUser(refinedUserData);
          localStorage.setItem("userData", JSON.stringify(refinedUserData));
        } catch (error) {
          console.error("Failed to fetch user after sign in:", error);
          setUser(null);
        }
      } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setPersonalityData(null);
          localStorage.removeItem("userData");
          localStorage.removeItem("personalityData");
          localStorage.removeItem("token");
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Token refreshed, update user data if needed
          try {
            const fetchedUserData = await apiService.getUserMe();
            const refinedUserData: UserData = {
              ...fetchedUserData,
              email: fetchedUserData.email || "no-email@example.com",
              username: (fetchedUserData as any).userName || fetchedUserData.username,
            };
            setUser(refinedUserData);
            localStorage.setItem("userData", JSON.stringify(refinedUserData));
          } catch (error) {
            console.error("Failed to refresh user data:", error);
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Effect to load/initialize personality data after user is loaded
  useEffect(() => {
    if (!isLoadingUser && user) {
      const savedPersonality = localStorage.getItem("personalityData");
      if (savedPersonality) {
        try {
          setPersonalityData(JSON.parse(savedPersonality));
        } catch (e) {
          console.error("Failed to parse saved personality data:", e);
          setPersonalityData(defaultPersonalityData);
          localStorage.setItem("personalityData", JSON.stringify(defaultPersonalityData));
        }
      } else {
        setPersonalityData(defaultPersonalityData);
        localStorage.setItem("personalityData", JSON.stringify(defaultPersonalityData));
      }
    } else if (!isLoadingUser && !user) {
      setPersonalityData(null);
      localStorage.removeItem("personalityData");
    }
  }, [user, isLoadingUser]);

  // Effect to persist personality data changes
  useEffect(() => {
    if (personalityData) {
      localStorage.setItem("personalityData", JSON.stringify(personalityData));
    }
  }, [personalityData]);

  // Effect to calculate personality completion status
  useEffect(() => {
    if (!personalityData) {
      setIsPersonalityComplete(false);
      return;
    }
    const { introversionExtroversion, preferredTime, interactionType, preferredSpace } = personalityData;
    let complete = true;
    if (introversionExtroversion === null || introversionExtroversion < 0 || introversionExtroversion > 100) complete = false;
    if (!preferredTime) complete = false;
    if (!interactionType) complete = false;
    if (interactionType === "In Person" && !preferredSpace) complete = false;
    setIsPersonalityComplete(complete);
  }, [personalityData]);

  // --- Context Functions ---

  // Update User State Function (e.g., after editing profile)
  // Renamed from setUserProfile to setUserState for clarity
  const setUserState = (userDataUpdate: Partial<UserData>) => {
    setUser((currentUser) => {
      if (!currentUser) return null;
      const updatedUser = { ...currentUser, ...userDataUpdate };
      // Update localStorage when user state is manually updated
      localStorage.setItem("userData", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  // Update Personality Data Function
  const updatePersonalityData = (data: Partial<PersonalityData>) => {
    setPersonalityData((currentData) => {
      const baseData = currentData ?? defaultPersonalityData;
      const updatedData = { ...baseData, ...data };
      if (data.interactionType && data.interactionType !== "In Person" && updatedData.preferredSpace !== null) {
        updatedData.preferredSpace = null;
      }
      return updatedData;
    });
  };

  // Logout Function
  const logout = async () => {
    // Sign out from Supabase (this will trigger the auth state change listener)
    await supabase.auth.signOut();
    
    // Clear local state immediately
    setUser(null);
    setPersonalityData(null);
    localStorage.removeItem("userData");
    localStorage.removeItem("personalityData");
    localStorage.removeItem("token");
  };

  // Provide the context value
  return (
    <UserContext.Provider
      value={{
        user,
        isLoadingUser,
        setUserState, // Use the new function name
        logout,
        personalityData,
        updatePersonalityData,
        isPersonalityComplete,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUser = (): UserContextProps => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
