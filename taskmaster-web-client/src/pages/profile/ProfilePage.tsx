import React from "react";
import { MapPin, Link as LinkIcon, Calendar, Edit } from "lucide-react";

const ProfilePage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header / Banner */}
      <div className="relative mb-16">
        <div className="h-48 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-md w-full"></div>
        <div className="absolute -bottom-12 left-8 flex items-end gap-4">
          <div className="w-32 h-32 rounded-full bg-card border-4 border-background flex items-center justify-center text-4xl font-bold text-foreground shadow-lg">
            U
          </div>
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-foreground">User Name</h1>
            <p className="text-muted-foreground">Computer Science Student</p>
          </div>
        </div>
        <div className="absolute top-4 right-4">
          <button className="px-4 py-2 bg-background/20 backdrop-blur-sm hover:bg-background/30 text-white border border-white/20 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
            <Edit size={16} /> Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Left Column: Info */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-md p-6 space-y-4">
            <h3 className="font-semibold text-foreground">About</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Passionate about algorithms and web development. Currently studying at Tech University.
            </p>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin size={16} />
                <span>San Francisco, CA</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <LinkIcon size={16} />
                <a href="#" className="text-primary hover:underline">github.com/username</a>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Calendar size={16} />
                <span>Joined September 2023</span>
              </div>
            </div>
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
              <h4 className="text-2xl font-bold text-foreground">128</h4>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Tasks Done</p>
            </div>
            <div className="bg-card border border-border rounded-md p-6 text-center">
              <h4 className="text-2xl font-bold text-foreground">85%</h4>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Avg Grade</p>
            </div>
            <div className="bg-card border border-border rounded-md p-6 text-center">
              <h4 className="text-2xl font-bold text-foreground">12</h4>
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
