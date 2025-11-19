import React from 'react';
import { motion } from 'framer-motion';

// Re-using the Friend interface (ensure it's imported or defined if needed)
interface Friend {
  id: string;
  username: string;
  isOnline: boolean;
  commonCourses: string[];
  notes?: string;
  streak?: number;
  xpAvailable?: boolean;
}

interface FriendInfoOverlayProps {
  friend: Friend;
  onClose: () => void;
  onMessageButtonClick: (friendId: string) => void; // Add function to handle messaging
}

const FriendInfoOverlay: React.FC<FriendInfoOverlayProps> = ({ friend, onClose, onMessageButtonClick }) => {
  // Local state for notes editing (can be re-added if needed)
  // const [notes, setNotes] = useState(friend.notes || '');
  // const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Handlers for actions (can be re-added if needed)
  // const handleRequestContactInfo = () => { ... };
  // const handleEditNotes = () => { ... };
  // const handleSaveNotes = () => { ... };
  // const handleRedeemStreakXP = () => { ... };

  // Handler for the message button
  const handleMessageClick = () => {
    onMessageButtonClick(friend.id);
    // This will close the overlay and open chat with this friend
  };

  return (
    // Use motion for animation, position fixed/absolute for overlay
    <motion.div
      initial={{ x: '100%' }} // Slide in from right
      animate={{ x: 0 }}
      exit={{ x: '100%' }} // Slide out to right
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-y-0 right-0 z-30 w-full md:w-2/5 bg-card border-l border-border shadow-lg p-6 space-y-6 overflow-y-auto" // Adjust width as needed (w-2/5)
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header with Username and Close Button */}
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <h2 className="text-xl font-semibold text-emphasis">{friend.username} - Details</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Message Button - Prominent at top */}
      <button
        onClick={handleMessageClick}
        className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-base font-medium flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </svg>
        Message {friend.username}
      </button>

      {/* Common Courses */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Common Courses</h3>
        {friend.commonCourses.length > 0 ? (
          <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
            {friend.commonCourses.map((course, index) => (
              <li key={index}>{course}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">No common courses.</p>
        )}
      </div>

      {/* Personal Notes (Read-only for now) */}
      <div>
         <div className="flex justify-between items-center mb-1">
             <h3 className="text-sm font-medium text-muted-foreground">Personal Notes</h3>
             {/* Add Edit button here later if needed */}
         </div>
         <p className={`text-sm text-foreground min-h-[3rem] p-2 rounded-md bg-muted/30 border border-input ${friend.notes ? '' : 'text-muted-foreground italic'}`}>
            {friend.notes || 'No notes added yet.'}
         </p>
      </div>

      {/* Friendship Streak */}
      {friend.streak !== undefined && (
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground">Friendship Streak</h3>
          <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
            <span className="text-base font-semibold text-foreground">{friend.streak} days</span>
            {friend.xpAvailable && (
              <button
                // onClick={handleRedeemStreakXP} // Add handler back if needed
                className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors"
                disabled // Disable button for now
              >
                Redeem XP
              </button>
            )}
          </div>
        </div>
      )}

       {/* Request Contact Info Button (Optional) */}
      <button
        // onClick={handleRequestContactInfo} // Add handler back if needed
        className="w-full mt-4 px-4 py-2 border border-input bg-transparent hover:bg-accent hover:text-accent-foreground text-foreground font-medium rounded-md transition-colors duration-200 text-sm"
        disabled // Disable button for now
      >
        Request Contact Info
      </button>

    </motion.div>
  );
};

export default FriendInfoOverlay; 