import React from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

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

const events = [
  {
    title: "Math Assignment Due",
    start: new Date(),
    end: new Date(),
    allDay: true,
  },
  {
    title: "Study Group",
    start: new Date(new Date().setHours(14, 0, 0)),
    end: new Date(new Date().setHours(16, 0, 0)),
  },
];

const CalendarPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
        <button className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-md text-sm font-medium transition-colors">
          + Add Event
        </button>
      </div>
      
      <div className="flex-1 bg-surface border border-border-color rounded-md p-4 text-foreground [&_.rbc-off-range-bg]:bg-background/50 [&_.rbc-today]:bg-primary/10 [&_.rbc-event]:bg-primary [&_.rbc-event]:text-white [&_.rbc-header]:border-border-color [&_.rbc-month-view]:border-border-color [&_.rbc-month-row]:border-border-color [&_.rbc-day-bg]:border-border-color [&_.rbc-toolbar-label]:text-foreground [&_.rbc-btn-group_button]:text-foreground [&_.rbc-btn-group_button]:border-border-color [&_.rbc-btn-group_button:hover]:bg-background">
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%", minHeight: "500px" }}
        />
      </div>
    </div>
  );
};

export default CalendarPage;
