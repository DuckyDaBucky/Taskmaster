import PageLayout from "./components/PageLayout";
import Login from "./pages/Login";
import SignUp from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Classes from "./pages/Classes";
import Friends from "./pages/Friends";
import Settings from "./pages/Settings";
import SplashPage from "./pages/SplashPage";
import Tasks from "./pages/Tasks";
import FlashCards from "./pages/FlashCards";
import Resources from "./pages/Resources";
import Profile from "./pages/Profile";
import { ThemeProvider } from "./context/ThemeContext";
import { UserProvider } from "./context/UserContext";

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/" element={<SplashPage/>} />

            {/* Routes using shared layout */}
            <Route element={<PageLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/classes" element={<Classes />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/flashcards" element={<FlashCards />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Routes>
        </Router>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
