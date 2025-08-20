"use client";

import React, { useRef, useImperativeHandle, forwardRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { type EventInput, type DatesSetArg, type EventDropArg } from "@fullcalendar/core";

interface AppointmentsFullCalendarProps {
  events: EventInput[];
  onDateClick: (arg: any) => void;
  onEventClick: (arg: any) => void;
  onDatesSet?: (arg: DatesSetArg) => void;
  onEventDrop: (arg: EventDropArg) => void;
  businessHours?: Array<{
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
  }>;
  slotMinTime?: string;
  slotMaxTime?: string;
}

export interface CalendarRef {
  getApi: () => any;
  getCurrentRange: () => { start: Date; end: Date };
}

const AppointmentsFullCalendar = forwardRef<CalendarRef, AppointmentsFullCalendarProps>(({
  events,
  onDateClick,
  onEventClick,
  onDatesSet,
  onEventDrop,
  businessHours = [],
  slotMinTime = "08:00:00",
  slotMaxTime = "20:00:00",
}, ref) => {
  const calendarRef = useRef<FullCalendar>(null);

  useImperativeHandle(ref, () => ({
    getApi: () => calendarRef.current?.getApi(),
    getCurrentRange: () => {
      const api = calendarRef.current?.getApi();
      if (api) {
        return {
          start: api.view.currentStart,
          end: api.view.currentEnd
        };
      }
      return { start: new Date(), end: new Date() };
    }
  }));

  // Preserve view in localStorage
  const getInitialView = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('calendar-view') || 'timeGridWeek';
    }
    return 'timeGridWeek';
  };

  const saveView = (viewName: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('calendar-view', viewName);
    }
  };

  const handleViewChange = (viewInfo: any) => {
    saveView(viewInfo.view.type);
  };
  return (
    <div className="h-full w-full">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={getInitialView()}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        buttonText={{
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day: 'Día'
        }}
        events={events}
        dateClick={onDateClick}
        eventClick={onEventClick}
        datesSet={onDatesSet || (() => {})}
        viewDidMount={handleViewChange}
        eventDrop={onEventDrop}
        editable={true}
        droppable={true}
        height="100%"
        locale="es"
        slotMinTime={slotMinTime}
        slotMaxTime={slotMaxTime}
        allDaySlot={false}
        businessHours={businessHours.length > 0 ? businessHours : undefined}
        selectConstraint="businessHours"
        eventConstraint="businessHours"
        eventOverlap={false}
        eventDisplay="block"
        eventTextColor="#ffffff"
        navLinks={true}
        nowIndicator={true}
        scrollTime="08:00:00"
        scrollTimeReset={false}
        slotDuration="00:30:00"
        slotLabelInterval="01:00:00"
        aspectRatio={1.35}
        expandRows={true}
        slotLabelFormat={{
          hour: 'numeric',
          minute: '2-digit',
          omitZeroMinute: false,
          meridiem: 'short'
        }}
        dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
        firstDay={1}
        weekNumbers={false}
        weekNumberFormat={{ week: 'numeric' }}
        hiddenDays={[]}
        dayMaxEvents={false}
        moreLinkClick="popover"
        eventMaxStack={3}
        dayPopoverFormat={{ month: 'long', day: 'numeric', year: 'numeric' }}
        views={{
          timeGridWeek: {
            titleFormat: { year: 'numeric', month: 'short', day: 'numeric' },
            buttonText: 'Semana'
          },
          timeGridDay: {
            titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
            buttonText: 'Día'
          },
          dayGridMonth: {
            titleFormat: { year: 'numeric', month: 'long' },
            buttonText: 'Mes'
          }
        }}
        validRange={{
          start: new Date(2020, 0, 1), // Permitir navegar desde 2020
          end: new Date(2030, 11, 31) // Hasta 2030
        }}
      />
    </div>
  );
});

AppointmentsFullCalendar.displayName = "AppointmentsFullCalendar";

export default AppointmentsFullCalendar;
