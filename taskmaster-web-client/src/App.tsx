import { PageLayout } from "./components/layout/PageLayout";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import DashboardPage from "./pages/dashboard/DashboardPage";
import CalendarPage from "./pages/calendar/CalendarPage";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ClassesPage from "./pages/classes/ClassesPage";
import FriendsPage from "./pages/friends/FriendsPage";
import SettingsPage from "./pages/settings/SettingsPage";
import SplashPage from "./pages/SplashPage";
import TasksPage from "./pages/tasks/TasksPage";
import FlashCardsPage from "./pages/flashcards/FlashCardsPage";
import ResourcesPage from "./pages/resources/ResourcesPage";
import ProfilePage from "./pages/profile/ProfilePage";
import { ThemeProvider } from "./context/ThemeContext";
import { UserProvider } from "./context/UserContext";
import { ProtectedRoute } from "./components/ProtectedRoute";


function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route 
              path="/login" 
              element={<Login />}
            />
            <Route 
              path="/signup" 
              element={<SignUp />}
            />
            <Route 
              path="/" 
              element={<SplashPage />}
            />

            {/* Protected routes - require authentication */}
            <Route element={<ProtectedRoute />}>
              <Route element={<PageLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/classes" element={<ClassesPage />} />
                <Route path="/friends" element={<FriendsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/flashcards" element={<FlashCardsPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* Catch all - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
