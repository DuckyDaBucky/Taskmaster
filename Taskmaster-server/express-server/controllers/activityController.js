import Activity from '../models/activityModel.js';

// Get all activities for authenticated user
const getUserActivities = async (req, res) => {
    try {
        const userId = req.user?._id;
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const limit = parseInt(req.query.limit) || 20;
        const activities = await Activity.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();

        res.status(200).json(activities);
    } catch (error) {
        console.error("Error fetching activities:", error);
        res.status(500).json({ message: error.message });
    }
};

// Create activity (internal use - called by other controllers)
const createActivity = async (userId, type, description, metadata = {}) => {
    try {
        await Activity.create({
            user: userId,
            type,
            description,
            metadata
        });
    } catch (error) {
        console.error("Error creating activity:", error);
    }
};

export { getUserActivities, createActivity };

