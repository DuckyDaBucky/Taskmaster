import Event from "../models/eventModel.js";
import mongoose, { mongo } from "mongoose";


const createEvent = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        console.log("🔥 CREATE EVENT PAYLOAD:", req.body);
        
        const { title, taskInput, classInput, repeatWeekly, start, end, notes, color } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Title is required" });
        }

        // Convert to ObjectIds if provided (they may be empty strings)
        const task = taskInput ? new mongoose.Types.ObjectId(taskInput) : null;
        const course = classInput ? new mongoose.Types.ObjectId(classInput) : null;

        const newEvent = new Event({ 
            title, 
            task: task || undefined, 
            course: course || undefined, 
            repeatWeekly: repeatWeekly || false, 
            start: start ? new Date(start) : new Date(), 
            end: end ? new Date(end) : new Date(), 
            notes: notes || [], 
            color: color || "#3b82f6", 
            user: userId 
        });
        
        const savedEvent = await newEvent.save();
        console.log("✅ Event created successfully:", savedEvent._id);
        res.status(201).json(savedEvent);

    } catch (error) {
        console.error("❌ Error creating event:", error);
        res.status(500).json({ message: error.message });
    }
};

const editEventById = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const { title, taskInput, classInput, repeatWeekly, start, end, notes, color } = req.body;
        const eventId = req.params.eventid;

        if (!eventId) {
            return res.status(400).json({ message: "Error: Event ID not entered" });
        }

        // First verify ownership
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        if (event.user && event.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Access denied. This event does not belong to you." });
        }

        // Convert to ObjectIds if provided
        const task = taskInput ? new mongoose.Types.ObjectId(taskInput) : undefined;
        const course = classInput ? new mongoose.Types.ObjectId(classInput) : undefined;

        const updateData = {
            ...(title && { title }),
            ...(task !== undefined && { task }),
            ...(course !== undefined && { course }),
            ...(repeatWeekly !== undefined && { repeatWeekly }),
            ...(start && { start: new Date(start) }),
            ...(end && { end: new Date(end) }),
            ...(notes !== undefined && { notes }),
            ...(color && { color }),
        };

        const selectedEvent = await Event.findByIdAndUpdate(
            eventId, 
            updateData, 
            { new: true }
        );
        
        return res.status(200).json(selectedEvent);

    } catch (error) {   
        console.error("❌ Error updating event:", error);
        res.status(500).json({ message: error.message });
    }
};

const getEventsByUserId = async(req, res) => {
    try {
        const authenticatedUserId = req.user?._id; // Get from auth middleware
        const requestedUserId = req.params.userid;
        
        if (!authenticatedUserId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // ENFORCE DATA ISOLATION: Users can only see their own events
        if (requestedUserId !== authenticatedUserId.toString()) {
            return res.status(403).json({ message: "Access denied. You can only view your own events." });
        }

        const events = await Event.find({ user: authenticatedUserId });
        
        // Return empty array if no events found (not an error)
        return res.status(200).json(events || []);

    } catch (error) {   
        console.error("❌ Error fetching events:", error);
        res.status(500).json({ message: error.message });
    }
};

const deleteEventById = async(req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const eventId = req.params.eventid;

        if (!eventId) {
            return res.status(400).json({ message: "Error: Event ID not entered" });
        }

        // First verify ownership
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        if (event.user && event.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Access denied. This event does not belong to you." });
        }

        const deletedEvent = await Event.findByIdAndDelete(eventId);
        return res.status(200).json(deletedEvent);

    } catch (error) {
        console.error("❌ Error deleting event:", error);
        res.status(500).json({ message: error.message });
    }
};

export {
    createEvent,
    editEventById,
    getEventsByUserId,
    deleteEventById,
}