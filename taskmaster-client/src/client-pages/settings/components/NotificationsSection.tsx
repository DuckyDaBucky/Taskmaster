import React from "react";
import { Bell } from "lucide-react";

type Notifications = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  taskReminders: boolean;
  friendRequests: boolean;
};

type Props = {
  notifications: Notifications;
  setNotifications: React.Dispatch<React.SetStateAction<Notifications>>;
  onSave: () => void;
  isSaving: boolean;
};

const items: { key: keyof Notifications; label: string }[] = [
  { key: "emailNotifications", label: "Email Notifications" },
  { key: "pushNotifications", label: "Push Notifications" },
  { key: "weeklyDigest", label: "Weekly Digest" },
  { key: "taskReminders", label: "Task Reminders" },
  { key: "friendRequests", label: "Friend Request Alerts" },
];

const NotificationsSection: React.FC<Props> = ({ notifications, setNotifications, onSave, isSaving }) => {
  return (
    <section className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={20} className="text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <span className="text-foreground">{item.label}</span>
            <button
              type="button"
              onClick={() => setNotifications((p) => ({ ...p, [item.key]: !p[item.key] }))}
              className={`w-11 h-6 rounded-full relative transition-colors ${
                notifications[item.key] ? "bg-primary" : "bg-secondary"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  notifications[item.key] ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Notifications"}
        </button>
      </div>
    </section>
  );
};

export default NotificationsSection;
