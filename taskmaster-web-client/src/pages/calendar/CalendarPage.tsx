import React, { useState, useEffect } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../../styles/calendar.css";
import AddEventModal from "../../components/AddEventModal";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/apiService";
import type { TasksData } from "../../services/types";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  isTask?: boolean; // Flag to distinguish tasks from events
  status?: "pending" | "completed" | "overdue";
  classId?: string; // For color coding
  color?: string; // Color for the event
  taskId?: string; // Original task ID for editing
}

const CalendarPage: React.FC = () => {
  const { user } = useUser();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [eventData, setEventData] = useState<CalendarEvent>({
    id: "",
    title: "",
    start: new Date(),
    end: new Date(new Date().setHours(new Date().getHours() + 1)),
    description: "",
    location: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Fetch classes
        const userClasses = await apiService.getClassesByUserId(user._id);

        // Fetch events
        const userEvents = await apiService.getEvents(user._id);
        const formattedEvents: CalendarEvent[] = userEvents.map((event: any) => ({
          id: event._id || event.id,
          title: event.title,
          start: new Date(event.start),
          end: new Date(event.end),
          description: event.notes?.[0] || "",
          location: event.location || "",
          isTask: false,
        }));

        // Fetch all tasks (includes personal tasks)
        const allTasks = await apiService.getAllTasks();

        // Generate color map for classes
        const classColors = new Map<string, string>();
        const colors = [
          "#3b82f6", // blue
          "#10b981", // green
          "#f59e0b", // orange
          "#ef4444", // red
          "#8b5cf6", // purple
          "#ec4899", // pink
          "#06b6d4", // cyan
          "#84cc16", // lime
        ];
        userClasses.forEach((cls, idx) => {
          classColors.set(cls._id, colors[idx % colors.length]);
        });

        // Convert tasks to calendar events (using deadline as the date)
        const taskEvents: CalendarEvent[] = allTasks
          .filter((task: TasksData) => task.deadline) // Only include tasks with deadlines
          .map((task: TasksData) => {
            const deadlineDate = new Date(task.deadline);
            const className = task.class 
              ? (userClasses.find((c) => c._id === task.class)?.name || "Unknown Class")
              : "Personal";
            const taskClassId = task.class || "personal";
            const color = classColors.get(taskClassId) || "#6b7280"; // gray for personal
            
            // Set end time to 1 hour after start (or end of day if no specific time)
            const endDate = new Date(deadlineDate);
            if (task.deadline.includes("T")) {
              // Has time component, add 1 hour
              endDate.setHours(endDate.getHours() + 1);
            } else {
              // No time component, set to end of day
              endDate.setHours(23, 59, 59);
            }

            return {
              id: `task-${task._id}`,
              title: task.title,
              start: deadlineDate,
              end: endDate,
              description: task.topic || `Class: ${className}`,
              location: className,
              isTask: true,
              status: task.status,
              classId: taskClassId,
              color: color,
            };
          });

        // Combine events and tasks
        setEvents([...formattedEvents, ...taskEvents]);
      } catch (error) {
        console.error("Error fetching calendar data:", error);
        setError("Failed to load calendar");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?._id]);

  const handleSaveEvent = async (event: CalendarEvent) => {
    try {
      setError(null);

      const eventPayload = {
        title: event.title,
        start: event.start.toISOString(),
        end: event.end.toISOString(),
        taskInput: "", // Optional - can be linked to a task
        classInput: "", // Optional - can be linked to a class
        repeatWeekly: false,
        notes: event.description ? [event.description] : [],
        color: "#3b82f6",
      };

      if (isEditing && event.id) {
        // Update existing event
        await apiService.updateEvent(event.id, eventPayload);
      } else {
        // Create new event
        await apiService.createEvent(eventPayload);
      }

      // Refresh events and tasks
      await refreshCalendarData();

      setShowModal(false);
      setIsEditing(false);
      setEventData({
        id: "",
        title: "",
        start: new Date(),
        end: new Date(new Date().setHours(new Date().getHours() + 1)),
        description: "",
        location: "",
      });
    } catch (error: any) {
      console.error("Error saving event:", error);
      setError(error.response?.data?.message || "Failed to save event");
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventData.id) return;

    try {
      await apiService.deleteEvent(eventData.id);

      // Refresh events and tasks
      await refreshCalendarData();

      setShowModal(false);
      setIsEditing(false);
      setEventData({
        id: "",
        title: "",
        start: new Date(),
        end: new Date(new Date().setHours(new Date().getHours() + 1)),
        description: "",
        location: "",
      });
    } catch (error: any) {
      console.error("Error deleting event:", error);
      setError(error.response?.data?.message || "Failed to delete event");
    }
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setEventData({
      id: "",
      title: "",
      start,
      end,
      description: "",
      location: "",
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const refreshCalendarData = async () => {
    if (!user?._id) return;

    try {
      // Fetch classes
      const userClasses = await apiService.getClassesByUserId(user._id);

      // Fetch events
      const userEvents = await apiService.getEvents(user._id);
      const formattedEvents: CalendarEvent[] = userEvents.map((event: any) => ({
        id: event._id || event.id,
        title: event.title,
        start: new Date(event.start),
        end: new Date(event.end),
        description: event.notes?.[0] || "",
        location: event.location || "",
        isTask: false,
      }));

      // Fetch all tasks (includes personal tasks)
      const allTasks = await apiService.getAllTasks();

      // Generate color map for classes
      const classColors = new Map<string, string>();
      const colors = [
        "#3b82f6", // blue
        "#10b981", // green
        "#f59e0b", // orange
        "#ef4444", // red
        "#8b5cf6", // purple
        "#ec4899", // pink
        "#06b6d4", // cyan
        "#84cc16", // lime
      ];
      userClasses.forEach((cls, idx) => {
        classColors.set(cls._id, colors[idx % colors.length]);
      });

      // Convert tasks to calendar events
      const taskEvents: CalendarEvent[] = allTasks
        .filter((task: TasksData) => task.deadline)
        .map((task: TasksData) => {
          const deadlineDate = new Date(task.deadline);
          const className = task.class 
            ? (userClasses.find((c) => c._id === task.class)?.name || "Unknown Class")
            : "Personal";
          const taskClassId = task.class || "personal";
          const color = classColors.get(taskClassId) || "#6b7280"; // gray for personal
          
          const endDate = new Date(deadlineDate);
          if (task.deadline.includes("T")) {
            endDate.setHours(endDate.getHours() + 1);
          } else {
            endDate.setHours(23, 59, 59);
          }

          return {
            id: `task-${task._id}`,
            title: task.title,
            start: deadlineDate,
            end: endDate,
            description: task.topic || `Class: ${className}`,
            location: className,
            isTask: true,
            status: task.status,
            classId: taskClassId,
            color: color,
            taskId: task._id,
          };
        });

      // Combine events and tasks
      setEvents([...formattedEvents, ...taskEvents]);
    } catch (error) {
      console.error("Error refreshing calendar data:", error);
    }
  };

  const handleSelectEvent = async (event: CalendarEvent) => {
    if (event.isTask && event.taskId) {
      // For tasks, allow editing deadline only
      const newDeadline = prompt(
        `Edit deadline for "${event.title}"\nCurrent: ${event.start.toLocaleString()}\nEnter new deadline (YYYY-MM-DDTHH:mm):`,
        event.start.toISOString().slice(0, 16)
      );
      
      if (newDeadline) {
        try {
          const deadlineDate = new Date(newDeadline);
          await apiService.updateTask(event.taskId, {
            deadline: deadlineDate.toISOString(),
          });
          await refreshCalendarData();
        } catch (error: any) {
          console.error("Error updating task deadline:", error);
          setError(error.response?.data?.message || "Failed to update task deadline");
        }
      }
      return;
    }
    
    // Regular events can be edited normally
    setEventData(event);
    setIsEditing(true);
    setShowModal(true);
  };

  // Convert events to react-big-calendar format with styling
  const calendarEvents = events.map((event) => ({
    ...event,
    resource: event,
    style: {
      backgroundColor: event.color || (event.isTask 
        ? (event.status === 'completed' ? '#10b981' : event.status === 'overdue' ? '#ef4444' : '#f59e0b')
        : '#3b82f6'),
      borderColor: event.color || (event.isTask 
        ? (event.status === 'completed' ? '#10b981' : event.status === 'overdue' ? '#ef4444' : '#f59e0b')
        : '#3b82f6'),
      color: '#ffffff',
    },
    className: event.isTask 
      ? `task-${event.status || 'pending'}` 
      : '',
  }));

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
        <button
          onClick={() => {
            setEventData({
              id: "",
              title: "",
              start: new Date(),
              end: new Date(new Date().setHours(new Date().getHours() + 1)),
              description: "",
              location: "",
            });
            setIsEditing(false);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-md text-sm font-medium transition-colors"
        >
          + Add Event
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      <div className="flex-1 bg-card border border-border rounded-md overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-full p-4">
            <p className="text-muted-foreground">Loading calendar...</p>
          </div>
        ) : (
          <div className="h-full flex flex-col p-4 pt-4">
            <BigCalendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%", minHeight: "500px" }}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
            />
          </div>
        )}
      </div>

      <AddEventModal
        isOpen={showModal}
        isEditing={isEditing}
        eventData={eventData}
        setEventData={setEventData}
        onClose={() => {
          setShowModal(false);
          setIsEditing(false);
          setEventData({
            id: "",
            title: "",
            start: new Date(),
            end: new Date(new Date().setHours(new Date().getHours() + 1)),
            description: "",
            location: "",
          });
        }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
};

export default CalendarPage;
