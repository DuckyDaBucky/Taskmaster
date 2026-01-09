import React from "react";
import { User } from "lucide-react";
import type { UserData } from "../../../context/UserContext";


type ProfileForm = {
  firstName: string;
  lastName: string;
  displayName: string;
};

type Props = {
  user: UserData | null;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  form: ProfileForm;
  setForm: React.Dispatch<React.SetStateAction<ProfileForm>>;
  onSave: () => void;
  isSaving: boolean;
};

const ProfileSection: React.FC<Props> = ({
  user,
  isEditing,
  setIsEditing,
  form,
  setForm,
  onSave,
  isSaving,
}) => {
  const initials = (user?.firstName?.[0] || user?.displayName?.[0] || "U").toUpperCase();

  return (
    <section className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <User size={20} className="text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Profile</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
            {initials}
          </div>
          <div>
            <p className="font-medium text-foreground">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-sm text-muted-foreground">@{user?.displayName || user?.username}</p>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">First Name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Display Name</label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setIsEditing(true)} className="text-sm text-primary hover:underline">
            Edit Profile
          </button>
        )}
      </div>
    </section>
  );
};

export default ProfileSection;
