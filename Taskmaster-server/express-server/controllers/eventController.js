import Event from "../models/eventModel.js";
import mongoose, { mongo } from "mongoose";


const createEvent = async(req, res) => {
    try {
        const { title, taskInput, classInput, repeatWeekly, start, end, notes, color, id } = req.body;

        // console.log({title, task, schoolClass, repeatWeekly, start, end, notes, color, id});

        if (!id) {
            return res.status(400).json({ message: "Error: User ID not entered" });
        }
        
        // Interpreter says ObjectId is deprecated but that's only for numbers
        // This use case is for strings, it's up to date
        const user = new mongoose.Types.ObjectId(id);
        const task = new mongoose.Types.ObjectId(taskInput);
        const course = new mongoose.Types.ObjectId(classInput);

        const newEvent = new Event({ title, task, course, repeatWeekly, start, end, notes, color, user });
        const savedEvent = await newEvent.save();

        res.status(201).json(savedEvent);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const editEventById = async(req, res) => {
    try {
        const { title, taskInput, classInput, repeatWeekly, start, end, notes, color } = req.body;

        const eventId = req.params.eventid;

        if (!eventId) {
            return res.status(400).json({ message: "Error: Event ID not entered" });
        }        

        const selectedEvent = await Event.findByIdAndUpdate(
            eventId, 
            { title, taskInput, classInput, repeatWeekly, start, end, notes, color }, 
            { returnDocument: 'after' }
        );
        
        return res.status(200).json(selectedEvent);

    } catch (error) {   
        res.status(500).json({ message: error.message })
    }

};

const getEventsByUserId = async(req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userid);
        console.log(req.params.userid);
        console.log(userId);

        const events = await Event.find({ 'user': userId });
        console.log(events);


        if (!events) {
            return res.status(404).json({ 'message': 'Event not found' });
        }

        return res.status(200).json(events);

    } catch (error) {   
        res.status(500).json({ message: error.message })
    }
};

const deleteEventById = async(req, res) => {
    try {
        const eventId = req.params.eventid;

        if (!eventId) {
            return res.status(400).json({ message: "Error: Event ID not entered" });
        } 

        const deletedEvent = await Event.findByIdAndDelete(eventId);
        return res.status(200).json(deletedEvent);

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
};

export {
    createEvent,
    editEventById,
    getEventsByUserId,
    deleteEventById,
}