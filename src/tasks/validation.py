import logging
import inspect
from enum import Enum
from typing import Any, Dict, Optional, Union

class TaskType(str, Enum):
    EMAIL = "email"
    REPORT = "report"
    CLEANUP = "cleanup"
    SYNC = "sync"

class TaskValidationError(Exception):
    pass

logger = logging.getLogger("tasks")

def validate_task_payload(payload: Any) -> bool:
    """
    Validates the task payload.
    Must contain a non-empty string 'title' and a valid enum value for 'type'.
    """
    if not isinstance(payload, dict):
        raise TaskValidationError("Payload must be a dictionary")

    # 1. Validate 'title'
    title = payload.get("title")
    if not isinstance(title, str) or not title.strip():
        # Identify caller
        caller = "unknown"
        stack = inspect.stack()
        if len(stack) > 1:
            # stack[0] is validate_task_payload, stack[1] is the immediate caller
            caller = f"{stack[1].frame.f_globals.get('__name__', 'unknown')}.{stack[1].function}"

        # Sanitize payload: mask sensitive fields
        sanitized_payload = sanitize_payload(payload)

        # Log at WARNING level
        logger.warning(
            "Task validation failed: Title is missing or empty. Caller: %s",
            caller,
            extra={
                "caller": caller,
                "payload": sanitized_payload,
                "missing_field": "title",
                "reason": "Title is missing or empty"
            }
        )
        raise TaskValidationError("Title is missing or empty")

    # 2. Validate 'type'
    task_type = payload.get("type")
    valid_types = {item.value for item in TaskType}
    if task_type not in valid_types:
        caller = "unknown"
        stack = inspect.stack()
        if len(stack) > 1:
            caller = f"{stack[1].frame.f_globals.get('__name__', 'unknown')}.{stack[1].function}"

        sanitized_payload = sanitize_payload(payload)

        logger.warning(
            "Task validation failed: Type is invalid. Caller: %s",
            caller,
            extra={
                "caller": caller,
                "payload": sanitized_payload,
                "missing_field": "type",
                "reason": f"Type is missing or not a valid enum value: '{task_type}'"
            }
        )
        raise TaskValidationError("Type is missing or not a valid enum value")

    return True

def sanitize_payload(payload: Any) -> Any:
    """
    Returns a sanitized copy of the payload with potential secrets/credentials redacted.
    """
    if not isinstance(payload, dict):
        return payload

    sensitive_keys = {"password", "secret", "token", "key", "auth", "credential"}
    sanitized: Dict[str, Any] = {}
    for k, v in payload.items():
        if any(sk in k.lower() for sk in sensitive_keys):
            sanitized[k] = "[REDACTED]"
        elif isinstance(v, dict):
            sanitized[k] = sanitize_payload(v)
        else:
            sanitized[k] = v
    return sanitized
