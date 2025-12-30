import React, { useState, useEffect, useCallback, useRef } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";

import AddEventModal from "../../components/AddEventModal";
import { TaskModal } from "../../components/tasks/TaskModal";
import { useUser } from "../../context/UserContext";
import { apiService } from "../../services/api";
import { authService } from "../../services/api/authService";
import type { TasksData } from "../../services/types";
import { googleService } from "../../services/api/googleService";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const hasTimezoneInfo = (s: string) =>
  /Z$|[+-]\d{2}:\d{2}$/.test(s);

const hasExplicitTime = (s: string) =>
  s.includes("T") && /\d{2}:\d{2}/.test(s);

const parseTaskDeadline = (deadlineStr: string): Date => {
  if (deadlineStr.includes("T") && !hasTimezoneInfo(deadlineStr)) {
    const [d, t = "00:00"] = deadlineStr.split("T");
    const [y, m, day] = d.split("-").map(Number);
    const [h, min] = t.split(":").map(Number);
    return new Date(y, m - 1, day, h || 0, min || 0);
  }

  if (!deadlineStr.includes("T")) {
    const [y, m, day] = deadlineStr.split("-").map(Number);
    return new Date(y, m - 1, day, 0, 0, 0);
  }

  return new Date(deadlineStr);
};

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  isTask?: boolean;
  status?: "pending" | "completed" | "overdue";
  taskId?: string;
  source?: "app" | "task" | "google";
  allDay?: boolean;
}

interface ClassData {
  _id: string;
  name: string;
}

const CalendarPage: React.FC = () => {
  const { user, isLoadingUser } = useUser();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const initialLoadRef = useRef(true);

  const [eventData, setEventData] = useState<CalendarEvent>({
    id: "",
    title: "",
    start: new Date(),
    end: new Date(Date.now() + 60 * 60 * 1000),
  });

  const resetEventData = () => {
    setEventData({
      id: "",
      title: "",
      start: new Date(),
      end: new Date(Date.now() + 60 * 60 * 1000),
    });
  };

  const fetchData = useCallback(async () => {
    if (!user?._id) return;

    try {
      if (initialLoadRef.current) setIsLoading(true);

      const userEvents = await apiService.getEvents();
      const allTasks = await apiService.getAllTasks();

      const appEvents: CalendarEvent[] = userEvents.map((e: any) => ({
        id: e._id,
        title: e.title,
        start: new Date(e.start),
        end: new Date(e.end),
        source: "app",
      }));

      const taskEvents: CalendarEvent[] = allTasks
        .filter((t: TasksData) => t.deadline)
        .map((task: TasksData) => {
          const start = parseTaskDeadline(task.deadline!);
          const end = new Date(start.getTime());
          
          // All-day events: midnight to 11:59:59 PM
          end.setHours(23, 59, 59);

          return {
            id: `task-${task._id}`,
            title: task.title,
            start,
            end,
            isTask: true,
            status: task.status,
            taskId: task._id,
            source: "task",
            allDay: true,
          };
        });

      let googleEvents: CalendarEvent[] = [];
      try {
        const raw = await googleService.getEvents();
        googleEvents = raw.map((event: any) => {
          const isAllDay =
            typeof event.start === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(event.start);

          if (isAllDay) {
            // event.start like "YYYY-MM-DD"
            // event.end might be "YYYY-MM-DD" (exclusive) OR undefined depending on your service
            const [sy, sm, sd] = event.start.split("-").map(Number);

            const startTime = new Date(sy, sm - 1, sd, 0, 0, 0);

            // If end is provided as date-only and exclusive, use (end - 1 day) at 23:59:59.
            // Otherwise default to same day end at 23:59:59.
            let endTime = new Date(sy, sm - 1, sd, 23, 59, 59);

            if (typeof event.end === "string" && /^\d{4}-\d{2}-\d{2}$/.test(event.end)) {
              const [ey, em, ed] = event.end.split("-").map(Number);
              endTime = new Date(ey, em - 1, ed, 0, 0, 0);
              endTime.setDate(endTime.getDate() - 1);
              endTime.setHours(23, 59, 59);
            }

            return {
              id: `google-${event.id}`,
              title: event.title,
              start: startTime,
              end: endTime,
              source: "google",
              allDay: true,
            };
          }

          // Timed events: keep your existing behavior
          const start = typeof event.start === "string" ? new Date(event.start) : event.start;
          const end = typeof event.end === "string" ? new Date(event.end) : event.end;

          return {
            id: `google-${event.id}`,
            title: event.title,
            start: new Date(start.getTime()),
            end: new Date(end.getTime()),
            source: "google",
          };
        });

      } catch {}

      setEvents([...appEvents, ...taskEvents, ...googleEvents]);
      initialLoadRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    if (!isLoadingUser) fetchData();
  }, [fetchData, isLoadingUser]);

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setEventData({
      id: "",
      title: "",
      start,
      end,
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.source === "google") {
      setEventData(event);
      setIsEditing(false);
      setShowModal(true);
      return;
    }

    if (event.isTask && event.taskId) {
      setEditingTaskId(event.taskId);
      setShowTaskModal(true);
      return;
    }

    setEventData(event);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSaveEvent = async (event: CalendarEvent) => {
    if (event.source === "google") return;

    const payload = {
      title: event.title,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
    };

    isEditing
      ? await apiService.updateEvent(event.id, payload)
      : await apiService.createEvent(payload);

    await fetchData();
    setShowModal(false);
    resetEventData();
  };

  const handleDeleteEvent = async () => {
    if (!eventData.id || eventData.id.startsWith("task-") || eventData.source === "google") {
      return;
    }

    try {
      await apiService.deleteEvent(eventData.id);
      await fetchData();
      setShowModal(false);
      resetEventData();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const calendarEvents = events.map((event) => ({
    ...event,
    style: {
      backgroundColor:
        event.source === "google"
          ? "#4285F4"
          : event.isTask
            ? "#f59e0b"
            : "#3b82f6",
      color: "#fff",
    },
  }));

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header with title and Add Event button */}
      <div className="flex items-center justify-between px-4">
        <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
        <button
          onClick={() => {
            resetEventData();
            setIsEditing(false);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-md text-sm font-medium transition-colors"
        >
          + Add Event
        </button>
      </div>

      {/* Loading state */}
      {isLoading || isLoadingUser ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      ) : (
        /* Calendar */
        <div className="flex-1 px-4">
          <BigCalendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            style={{ height: "100%", minHeight: "500px" }}
          />
        </div>
      )}

      {/* Add/Edit Event Modal */}
      <AddEventModal
        isOpen={showModal}
        isEditing={isEditing}
        eventData={eventData}
        setEventData={setEventData}
        onClose={() => {
          setShowModal(false);
          resetEventData();
        }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          editingTaskId={editingTaskId}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTaskId(null);
          }}
          onTaskSaved={fetchData}
        />
      )}
    </div>
  );
};

export default CalendarPage;