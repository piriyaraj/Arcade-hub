import logging
import uuid
import traceback
from datetime import datetime
from typing import Any, Dict, List, Optional
from src.tasks.validation import validate_task_payload

logger = logging.getLogger("queue")

class DLQHandler:
    """
    DLQ (dead-letter queue) handler.
    Stores and formats failed tasks.
    """
    def __init__(self) -> None:
        self.dlq_store: List[Dict[str, Any]] = []

    def handle_failure(self, payload: Any, exception: Optional[Exception]) -> Dict[str, Any]:
        """
        Processes a task failure and saves it to the DLQ.
        """
        timestamp = datetime.utcnow().isoformat()

        # Extract title or default to fallback label if missing/invalid
        title = None
        if isinstance(payload, dict):
            title = payload.get("title")

        if not isinstance(title, str) or not title.strip():
            title = f"[Untitlted] submission @ {timestamp}"

        # Get error details
        error_message = str(exception) if exception else "Unknown queue execution failure"
        stack_trace = "".join(traceback.format_exception(type(exception), exception, exception.__traceback__)) if exception else ""

        dlq_entry = {
            "title": title,
            "timestamp": timestamp,
            "error_message": error_message,
            "stack_trace": stack_trace,
            "payload": payload
        }

        self.dlq_store.append(dlq_entry)

        logger.error(
            "Task failed and moved to DLQ: %s. Error: %s",
            title, error_message,
            extra={
                "dlq_entry": dlq_entry
            }
        )
        return dlq_entry

# Singleton DLQ Handler
dlq_handler = DLQHandler()

class TaskQueue:
    def __init__(self, dlq: DLQHandler = dlq_handler) -> None:
        self.queue: List[Dict[str, Any]] = []
        self.dlq = dlq

    def submit(self, payload: Any) -> str:
        """
        Submits a task to the queue after validation.
        """
        try:
            # 1. Validate payload
            validate_task_payload(payload)

            # 2. Add validation passed task to queue
            task_id = str(uuid.uuid4())
            task = {
                "id": task_id,
                "payload": payload,
                "submitted_at": datetime.utcnow().isoformat()
            }
            self.queue.append(task)

            # 3. Log at INFO level on success
            title = payload.get("title")
            logger.info(
                "Task submitted successfully. ID: %s, Title: %s",
                task_id, title,
                extra={"task_id": task_id, "title": title}
            )
            return task_id

        except Exception as e:
            # Wrap any failure (either validation or queuing error) into DLQ
            self.dlq.handle_failure(payload, e)
            raise
