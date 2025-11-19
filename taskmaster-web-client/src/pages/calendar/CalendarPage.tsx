import React, { useState, useEffect } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import AddEventModal from "../../components/AddEventModal";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/apiService";
import type { ClassData } from "../../services/mockDatabase";

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
}

const CalendarPage: React.FC = () => {
  const { user } = useUser();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setClasses(userClasses);

        // Fetch events
        const userEvents = await apiService.getEvents(user._id);
        const formattedEvents: CalendarEvent[] = userEvents.map((event: any) => ({
          id: event._id || event.id,
          title: event.title,
          start: new Date(event.start),
          end: new Date(event.end),
          description: event.notes?.[0] || "",
          location: event.location || "",
        }));
        setEvents(formattedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
        setError("Failed to load events");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?._id]);

  const handleSaveEvent = async (event: CalendarEvent) => {
    try {
      setIsSubmitting(true);
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

      // Refresh events
      const userEvents = await apiService.getEvents(user!._id);
      const formattedEvents: CalendarEvent[] = userEvents.map((evt: any) => ({
        id: evt._id || evt.id,
        title: evt.title,
        start: new Date(evt.start),
        end: new Date(evt.end),
        description: evt.notes?.[0] || "",
        location: evt.location || "",
      }));
      setEvents(formattedEvents);

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventData.id) return;

    try {
      setIsSubmitting(true);
      await apiService.deleteEvent(eventData.id);

      // Refresh events
      const userEvents = await apiService.getEvents(user!._id);
      const formattedEvents: CalendarEvent[] = userEvents.map((evt: any) => ({
        id: evt._id || evt.id,
        title: evt.title,
        start: new Date(evt.start),
        end: new Date(evt.end),
        description: evt.notes?.[0] || "",
        location: evt.location || "",
      }));
      setEvents(formattedEvents);

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
    } finally {
      setIsSubmitting(false);
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

  const handleSelectEvent = (event: CalendarEvent) => {
    setEventData(event);
    setIsEditing(true);
    setShowModal(true);
  };

  // Convert events to react-big-calendar format
  const calendarEvents = events.map((event) => ({
    ...event,
    resource: event,
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

      <div className="flex-1 bg-surface border border-border-color rounded-md p-4 text-foreground [&_.rbc-off-range-bg]:bg-background/50 [&_.rbc-today]:bg-primary/10 [&_.rbc-event]:bg-primary [&_.rbc-event]:text-white [&_.rbc-header]:border-border-color [&_.rbc-month-view]:border-border-color [&_.rbc-month-row]:border-border-color [&_.rbc-day-bg]:border-border-color [&_.rbc-toolbar-label]:text-foreground [&_.rbc-btn-group_button]:text-foreground [&_.rbc-btn-group_button]:border-border-color [&_.rbc-btn-group_button]:hover:bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading calendar...</p>
          </div>
        ) : (
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
