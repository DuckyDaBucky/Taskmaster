import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  View,
  ToolbarProps,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addDays, subDays } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getTasks } from "../components/tasksStore";
import AddEventModal from "../components/AddEventModal";

interface MyEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  allDay?: boolean;
}

const style = document.createElement("style");
style.innerHTML = `
  .dark .rbc-month-view,
  .dark .rbc-time-view,
  .dark .rbc-agenda-view,
  .dark .rbc-time-header,
  .dark .rbc-timeslot-group,
  .dark .rbc-time-content,
  .dark .rbc-day-slot,
  .dark .rbc-time-slot,
  .dark .rbc-time-gutter,
  .dark .rbc-time-column,
  .dark .rbc-row,
  .dark .rbc-date-cell {
    background-color: #1e1e1e !important;
    color: #f5f5f5 !important;
  }

  .dark .rbc-off-range,
  .dark .rbc-off-range-bg {
    background-color: #2a2a2a !important;
    color: #888 !important;
  }

  .dark .rbc-today {
    background-color: rgba(139, 92, 246, 0.15) !important;
  }

  .rbc-event {
    width: 100% !important;
    box-sizing: border-box !important;
    border-radius: 0.5rem !important;
    overflow: hidden !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .rbc-event-content {
    white-space: normal !important;
    padding: 0 !important;
    margin: 0 !important;
    height: 100%;
  }
`;


document.head.appendChild(style);

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { "en-US": enUS },
});

const CustomToolbar: React.FC<ToolbarProps<MyEvent, object>> = ({ label }) => (
  <div className="text-center text-xl font-bold py-3 text-emphasis">
    {label}
  </div>
);

const EventComponent = ({ event }: { event: MyEvent }) => {
  return (
    <div className="w-full h-full px-2 py-1 text-white text-sm truncate flex items-center gap-1">
      <span className="font-bold">{event.title}</span>
      {event.location && (
        <span className="text-xs opacity-80 truncate">({event.location})</span>
      )}
    </div>
  );
};

const Calendar = () => {
  const [view, setView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<MyEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MyEvent | null>(null);

  useEffect(() => {
    const tasks = getTasks();
    const taskEvents = tasks.map((task) => {
      const deadline = new Date(task.deadline);
      const start = new Date(deadline.getTime() - 1 * 60 * 60 * 1000); // 1 hour before
      return {
        id: task._id,
        title: task.title,
        start,
        end: deadline,
        description: task.topic || "",
        location: task.classLocation || "",
        allDay: false,
      };
    });
    setEvents(taskEvents);
  }, []);

  const handleNavigate = (action: "TODAY" | "PREV" | "NEXT") => {
    const base = new Date(currentDate);
    const delta = view === "month" ? 30 : view === "week" ? 7 : 1;
    if (action === "TODAY") setCurrentDate(new Date());
    if (action === "NEXT") setCurrentDate(addDays(base, delta));
    if (action === "PREV") setCurrentDate(subDays(base, delta));
  };

  return (
    <div className="relative min-h-screen px-4 py-10 text-gray-900 dark:text-white">
      <div className="relative z-10 w-full max-w-screen-xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-emphasis">Your Calendar</h1>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleNavigate("TODAY")}
              className="bg-pink-400 hover:bg-pink-500 text-white font-semibold px-4 py-2 rounded-md"
            >
              Today
            </button>
            <button
              onClick={() => handleNavigate("PREV")}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-4 py-2 rounded-md"
            >
              Back
            </button>
            <button
              onClick={() => handleNavigate("NEXT")}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-4 py-2 rounded-md"
            >
              Next
            </button>
            <select
              value={view}
              onChange={(e) => setView(e.target.value as View)}
              className="px-4 py-2 rounded-md text-white bg-pink-400 hover:bg-pink-500 font-semibold"
            >
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="day">Day</option>
            </select>
            <button
              className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-md transition"
              onClick={() => {
                const now = new Date();
                const blankEvent: MyEvent = {
                  id: crypto.randomUUID(),
                  title: "",
                  start: now,
                  end: now,
                  description: "",
                  location: "",
                };
                setNewEvent(blankEvent);
                setSelectedEvent(null);
                setModalOpen(true);
              }}
            >
              + Add Event
            </button>
          </div>
        </div>

        <motion.div
          key={`${view}-${currentDate.toDateString()}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="w-full h-[750px] bg-card rounded-2xl shadow-soft overflow-hidden border border-border"
        >
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            date={currentDate}
            onNavigate={(date) => setCurrentDate(date)}
            view={view}
            onView={(v) => setView(v)}
            views={["month", "week", "day"]}
            components={{
              toolbar: CustomToolbar,
              event: (props) => <EventComponent {...props} />,
            }}
            onSelectEvent={(event) => {
              setSelectedEvent(event as MyEvent);
              setNewEvent(event as MyEvent);
              setModalOpen(true);
            }}
            step={60}
            timeslots={1}
          />
        </motion.div>
      </div>

      {newEvent && (
        <AddEventModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedEvent(null);
          }}
          onSave={(updatedEvent) => {
            if (selectedEvent) {
              setEvents((prev) =>
                prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
              );
            } else {
              setEvents((prev) => [...prev, updatedEvent]);
            }
            setModalOpen(false);
            setSelectedEvent(null);
          }}
          onDelete={() => {
            if (selectedEvent) {
              setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id));
              setModalOpen(false);
              setSelectedEvent(null);
            }
          }}
          isEditing={!!selectedEvent}
          eventData={newEvent}
          setEventData={setNewEvent}
        />
      )}
    </div>
  );
};

export default Calendar;
