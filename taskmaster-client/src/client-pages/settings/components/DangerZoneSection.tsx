import React from "react";
import { Trash2 } from "lucide-react";

type Props = {
  onLogout: () => void;
  onDeleteAccount?: () => void;
};

const DangerZoneSection: React.FC<Props> = ({ onLogout, onDeleteAccount }) => {
  return (
    <section className="bg-card border border-red-500/30 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trash2 size={20} className="text-red-500" />
        <h2 className="text-lg font-semibold text-red-500">Danger Zone</h2>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={onLogout}
          className="w-full px-4 py-2 border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
        >
          Log Out
        </button>

        <button
          type="button"
          onClick={onDeleteAccount ?? (() => alert("Contact support to delete your account"))}
          className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Delete Account
        </button>
      </div>
    </section>
  );
};

export default DangerZoneSection;
