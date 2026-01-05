import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns';

type CalendarEvent = {
  id: number;
  title: string;
  start: Date;
  end?: Date;
  type: 'event' | 'shift' | 'opportunity' | 'task';
  color: string;
};

const typeColors = {
  event: 'bg-blue-500',
  shift: 'bg-green-500',
  opportunity: 'bg-purple-500',
  task: 'bg-orange-500'
};

export default function AdminCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch all data types
  const { data: eventsRaw } = useQuery(['events'], () => api.listEvents());
  const { data: shiftsRaw } = useQuery(['shifts'], () => api.listShifts());
  const { data: opportunitiesRaw } = useQuery(['opportunities'], () => api.listOrganizationOpportunities());
  const { data: tasksRaw } = useQuery(['tasks'], () => api.listTasks());

  // Normalize data
  const events = Array.isArray(eventsRaw) ? eventsRaw : (eventsRaw?.data ?? []);
  const shifts = Array.isArray(shiftsRaw) ? shiftsRaw : (shiftsRaw?.data ?? []);
  const opportunities = Array.isArray(opportunitiesRaw) ? opportunitiesRaw : (opportunitiesRaw?.data ?? []);
  const tasks = Array.isArray(tasksRaw) ? tasksRaw : (tasksRaw?.data ?? []);

  // Convert all items to calendar events
  const allCalendarEvents: CalendarEvent[] = [
    ...events.map((e: any) => ({
      id: e.id,
      title: e.title || e.name || 'Event',
      start: new Date(e.start_at || e.startAt),
      end: e.end_at || e.endAt ? new Date(e.end_at || e.endAt) : undefined,
      type: 'event' as const,
      color: typeColors.event
    })),
    ...shifts.map((s: any) => ({
      id: s.id,
      title: s.title || 'Shift',
      start: new Date(s.start_at || s.startAt),
      end: s.end_at || s.endAt ? new Date(s.end_at || s.endAt) : undefined,
      type: 'shift' as const,
      color: typeColors.shift
    })),
    ...opportunities.map((o: any) => ({
      id: o.id,
      title: o.title || o.name || 'Opportunity',
      start: new Date(o.start_at || o.startAt || o.start_date || o.startDate),
      end: o.end_at || o.endAt || o.end_date || o.endDate ? new Date(o.end_at || o.endAt || o.end_date || o.endDate) : undefined,
      type: 'opportunity' as const,
      color: typeColors.opportunity
    })),
    ...tasks.map((t: any) => ({
      id: t.id,
      title: t.title || t.name || 'Task',
      start: new Date(t.due_date || t.dueDate || t.created_at || t.createdAt),
      type: 'task' as const,
      color: typeColors.task
    }))
  ].filter(e => !isNaN(e.start.getTime())); // Filter out invalid dates

  // Get calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return allCalendarEvents.filter(event =>
      isSameDay(event.start, day) ||
      (event.end && event.start <= day && event.end >= day)
    );
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Admin Calendar</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setCurrentMonth(new Date())}>
            Today
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentDay = isToday(day);

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    min-h-[100px] p-2 border rounded-lg text-left transition-colors
                    ${isCurrentMonth ? 'bg-background' : 'bg-muted/30'}
                    ${isSelected ? 'ring-2 ring-primary' : ''}
                    ${isCurrentDay ? 'border-primary border-2' : 'border-border'}
                    hover:bg-accent
                  `}
                >
                  <div className={`text-sm font-medium mb-1 ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event, i) => (
                      <div
                        key={`${event.type}-${event.id}-${i}`}
                        className={`text-xs px-1 py-0.5 rounded text-white truncate ${event.color}`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-6 pt-6 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span className="text-sm">Events</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-sm">Shifts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-500" />
              <span className="text-sm">Opportunities</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500" />
              <span className="text-sm">Tasks</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Details */}
      {selectedDate && selectedDayEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Events on {format(selectedDate, 'MMMM d, yyyy')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedDayEvents.map((event, i) => (
                <div key={`${event.type}-${event.id}-${i}`} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className={`w-1 h-full rounded ${event.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{event.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
                        {event.type}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(event.start, 'h:mm a')}
                      {event.end && ` - ${format(event.end, 'h:mm a')}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
