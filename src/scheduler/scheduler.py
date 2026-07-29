import logging
from src.queue.handler import TaskQueue, dlq_handler

logger = logging.getLogger("scheduler")

class TaskScheduler:
    def __init__(self, queue=None):
        self.queue = queue or TaskQueue()

    def schedule_task(self, payload):
        """
        Schedules a task by submitting it to the queue.
        """
        try:
            task_id = self.queue.submit(payload)
            logger.info("Task scheduled successfully: %s", task_id)
            return task_id
        except Exception as e:
            logger.error("Failed to schedule task: %s", e)
            raise
