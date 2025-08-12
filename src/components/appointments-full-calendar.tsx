"use client";

import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { type EventInput, type DatesSetArg, type EventDropArg } from "@fullcalendar/core";

interface AppointmentsFullCalendarProps {
  events: EventInput[];
  onDateClick: (arg: any) => void;
  onEventClick: (arg: any) => void;
  onDatesSet: (arg: DatesSetArg) => void;
  onEventDrop: (arg: EventDropArg) => void;
}

const AppointmentsFullCalendar: React.FC<AppointmentsFullCalendarProps> = ({
  events,
  onDateClick,
  onEventClick,
  onDatesSet,
  onEventDrop,
}) => {
  return (
    <div className="h-full w-full">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        dateClick={onDateClick}
        eventClick={onEventClick}
        datesSet={onDatesSet}
        eventDrop={onEventDrop}
        editable={true}
        droppable={true}
        height="100%"
        locale="es"
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        allDaySlot={false}
      />
    </div>
  );
};

export default AppointmentsFullCalendar;
