import React, { useState, useEffect } from "react";
import { MapPin, Link as LinkIcon, Calendar, Edit, Save, X } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { authService } from "../../services/authService";

const ProfilePage: React.FC = () => {
  const { user, setUserState } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    pfp: "",
  });

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        pfp: (user as any).pfp || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updatedUser = await authService.updateProfile(formData);
      
      // Update UserContext
      setUserState({
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        ...((updatedUser.pfp && { profileImageUrl: updatedUser.pfp }) || {}),
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      console.error("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original user data
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        pfp: (user as any).pfp || "",
      });
    }
    setIsEditing(false);
  };

  const displayName = user?.firstName || user?.username || user?.email || "User";
  const fullName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : displayName;
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : (user?.firstName?.[0] || user?.username?.[0] || user?.email?.[0] || "U").toUpperCase();
  const avatarUrl = (user as any)?.pfp || user?.profileImageUrl;

  return (
    <div className="space-y-6">
      {/* Header / Banner */}
      <div className="relative mb-16">
        <div className="h-48 bg-blue-600 rounded-md w-full"></div>
        <div className="absolute -bottom-12 left-8 flex items-end gap-4">
          <div className="relative">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={fullName} 
                className="w-32 h-32 rounded-full border-4 border-background object-cover shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-card border-4 border-background flex items-center justify-center text-4xl font-bold text-foreground shadow-lg">
                {initials}
              </div>
            )}
          </div>
          <div className="mb-2">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="First Name"
                  className="px-3 py-1 bg-background border border-border rounded text-foreground text-xl font-bold"
                />
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Last Name"
                  className="px-3 py-1 bg-background border border-border rounded text-sm text-muted-foreground"
                />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
                <p className="text-muted-foreground">{user?.email || "No email"}</p>
              </>
            )}
          </div>
        </div>
        <div className="absolute top-4 right-4">
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white border border-white/20 rounded-md text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={16} /> {isLoading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-4 py-2 bg-background/20 backdrop-blur-sm hover:bg-background/30 text-white border border-white/20 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              >
                <X size={16} /> Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-background/20 backdrop-blur-sm hover:bg-background/30 text-white border border-white/20 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Edit size={16} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Left Column: Info */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-md p-6 space-y-4">
            <h3 className="font-semibold text-foreground">About</h3>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Avatar URL</label>
                  <input
                    type="text"
                    value={formData.pfp}
                    onChange={(e) => setFormData({ ...formData, pfp: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm"
                  />
                </div>
                {formData.pfp && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                    <img 
                      src={formData.pfp} 
                      alt="Preview" 
                      className="w-16 h-16 rounded-full object-cover border border-border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName} is a student using TaskMaster to organize their academic life.`
                    : "Student using TaskMaster to organize academic life."}
                </p>
                
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <MapPin size={16} />
                    <span>Location not set</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <LinkIcon size={16} />
                    <span className="text-primary">{user?.email || "No email"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Calendar size={16} />
                    <span>Member since {user ? new Date().getFullYear() : "2024"}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="bg-card border border-border rounded-md p-6">
            <h3 className="font-semibold text-foreground mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {["React", "TypeScript", "Node.js", "Python", "SQL", "Tailwind"].map(skill => (
                <span key={skill} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-md p-6 text-center">
              <h4 className="text-2xl font-bold text-foreground">-</h4>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Tasks Done</p>
            </div>
            <div className="bg-card border border-border rounded-md p-6 text-center">
              <h4 className="text-2xl font-bold text-foreground">-</h4>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Avg Grade</p>
            </div>
            <div className="bg-card border border-border rounded-md p-6 text-center">
              <h4 className="text-2xl font-bold text-foreground">-</h4>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Projects</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-md p-6">
            <h3 className="font-semibold text-foreground mb-4">Badges</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-square bg-secondary rounded-md flex flex-col items-center justify-center gap-2 p-4 text-center hover:bg-secondary/80 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    🏆
                  </div>
                  <span className="text-xs font-medium text-foreground">Achievement {i}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
