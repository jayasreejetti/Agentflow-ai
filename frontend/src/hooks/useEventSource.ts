import { useEffect, useState, useRef } from 'react';
import { SSEEventPayload } from '../types';

export interface TimelineLogEntry {
  id: string;
  timestamp: string;
  eventType: string;
  data: any;
}

export function useTaskEventSource(taskId: string | null) {
  const [events, setEvents] = useState<TimelineLogEntry[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [latestEvent, setLatestEvent] = useState<SSEEventPayload | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!taskId) {
      setEvents([]);
      setIsConnected(false);
      return;
    }

    const eventSource = new EventSource(`/api/tasks/${taskId}/events`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    const handleEvent = (type: string, e: MessageEvent) => {
      try {
        const payload: SSEEventPayload = JSON.parse(e.data);
        const logEntry: TimelineLogEntry = {
          id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          timestamp: payload.timestamp || new Date().toISOString(),
          eventType: type,
          data: payload.data
        };

        setLatestEvent(payload);
        setEvents((prev) => [...prev, logEntry]);
      } catch (err) {
        console.error('Failed to parse SSE event payload:', err);
      }
    };

    const eventNames = [
      'task_started',
      'plan_created',
      'step_started',
      'tool_called',
      'tool_result',
      'approval_required',
      'approval_resolved',
      'reflection',
      'task_completed',
      'task_failed'
    ];

    eventNames.forEach((eventName) => {
      eventSource.addEventListener(eventName, (e: MessageEvent) => handleEvent(eventName, e));
    });

    eventSource.onerror = () => {
      setIsConnected(false);
      // Auto-reconnect managed by browser EventSource
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [taskId]);

  return { events, isConnected, latestEvent };
}

