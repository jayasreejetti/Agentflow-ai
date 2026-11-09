import asyncio
import json
from datetime import datetime
from typing import Dict, Any, AsyncGenerator, Set


class TaskEventManager:
    """
    In-memory pub/sub event broadcaster for Server-Sent Events (SSE).
    Allows clients to subscribe to real-time events for any task.
    """
    def __init__(self):
        # Mapping: task_id -> Set of asyncio.Queue
        self._listeners: Dict[str, Set[asyncio.Queue]] = {}
        # Keep an event history buffer per task so late-joining SSE streams can catch up
        self._history: Dict[str, list] = {}

    def subscribe(self, task_id: str) -> asyncio.Queue:
        if task_id not in self._listeners:
            self._listeners[task_id] = set()
            self._history[task_id] = []
        queue = asyncio.Queue()
        self._listeners[task_id].add(queue)

        # Replay past events to this subscriber
        for historical_event in self._history.get(task_id, []):
            queue.put_nowait(historical_event)

        return queue

    def unsubscribe(self, task_id: str, queue: asyncio.Queue):
        if task_id in self._listeners and queue in self._listeners[task_id]:
            self._listeners[task_id].remove(queue)
            if not self._listeners[task_id]:
                del self._listeners[task_id]

    async def emit(self, task_id: str, event_type: str, data: Any):
        """Broadcast an event to all subscribers of task_id and record in history."""
        event_payload = {
            "task_id": task_id,
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data
        }

        # Store in recent history (up to 100 events)
        if task_id not in self._history:
            self._history[task_id] = []
        self._history[task_id].append(event_payload)
        if len(self._history[task_id]) > 100:
            self._history[task_id].pop(0)

        # Dispatch to active listener queues
        if task_id in self._listeners:
            for queue in list(self._listeners[task_id]):
                try:
                    queue.put_nowait(event_payload)
                except Exception:
                    pass

    async def event_generator(self, task_id: str) -> AsyncGenerator[str, None]:
        """Generator yielding SSE formatted strings."""
        queue = self.subscribe(task_id)
        try:
            while True:
                # Wait for next event or heartbeat
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=20.0)
                    yield f"event: {event['event_type']}\ndata: {json.dumps(event)}\n\n"
                    if event["event_type"] in ("task_completed", "task_failed"):
                        # Keep connection alive briefly so client receives, then exit
                        await asyncio.sleep(0.5)
                        break
                except asyncio.TimeoutError:
                    # Send keepalive comment
                    yield ": ping\n\n"
        finally:
            self.unsubscribe(task_id, queue)


event_manager = TaskEventManager()

