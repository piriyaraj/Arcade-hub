import pytest
import logging
from unittest.mock import patch, MagicMock
from src.tasks.validation import validate_task_payload, TaskValidationError, TaskType
from src.queue.handler import TaskQueue, DLQHandler

def test_empty_title_rejected(caplog):
    """
    (a) submission with empty title is rejected
    """
    queue = TaskQueue()
    payload = {
        "title": "   ",
        "type": "email"
    }

    with caplog.at_level(logging.WARNING):
        with pytest.raises(TaskValidationError) as excinfo:
            queue.submit(payload)

        assert "Title is missing or empty" in str(excinfo.value)
        # Check that warning was logged
        warning_logs = [record for record in caplog.records if record.levelname == "WARNING"]
        assert len(warning_logs) >= 1
        assert "Title is missing or empty" in warning_logs[0].message

        # Verify fields in the structured log: caller, payload (sanitized), missing field, reason
        assert hasattr(warning_logs[0], "caller")
        assert warning_logs[0].missing_field == "title"
        assert warning_logs[0].reason == "Title is missing or empty"
        assert isinstance(warning_logs[0].payload, dict)

def test_missing_type_rejected(caplog):
    """
    (b) submission with missing/invalid type is rejected
    """
    queue = TaskQueue()
    payload = {
        "title": "Send Email",
        "type": "invalid_type"
    }

    with caplog.at_level(logging.WARNING):
        with pytest.raises(TaskValidationError) as excinfo:
            queue.submit(payload)

        assert "Type is missing or not a valid enum value" in str(excinfo.value)
        # Check warning log
        warning_logs = [record for record in caplog.records if record.levelname == "WARNING"]
        assert len(warning_logs) >= 1
        assert "Type is invalid" in warning_logs[0].message

        assert hasattr(warning_logs[0], "caller")
        assert warning_logs[0].missing_field == "type"
        assert "Type is missing or not a valid enum value" in warning_logs[0].reason
        assert isinstance(warning_logs[0].payload, dict)

def test_valid_submission_passes_through(caplog):
    """
    (c) valid submission passes through
    """
    queue = TaskQueue()
    payload = {
        "title": "Clean database",
        "type": "cleanup"
    }

    with caplog.at_level(logging.INFO):
        task_id = queue.submit(payload)
        assert task_id is not None
        assert len(queue.queue) == 1
        assert queue.queue[0]["payload"] == payload

        # Log at INFO level on success
        info_logs = [record for record in caplog.records if record.levelname == "INFO"]
        assert len(info_logs) >= 1
        assert "Task submitted successfully" in info_logs[0].message
        assert hasattr(info_logs[0], "task_id")
        assert info_logs[0].task_id == task_id
        assert info_logs[0].title == "Clean database"

def test_dlq_entry_contains_full_error_context():
    """
    (d) DLQ entry contains full error context (original error message, stack trace, full task payload).
    """
    dlq = DLQHandler()
    queue = TaskQueue(dlq=dlq)

    payload = {
        "title": "",  # Will fail validation
        "type": "email",
        "some_extra_data": "important payload metadata"
    }

    with pytest.raises(TaskValidationError) as excinfo:
        queue.submit(payload)

    assert len(dlq.dlq_store) == 1
    dlq_entry = dlq.dlq_store[0]

    # Check that error context contains: original error message, stack trace, full task payload
    assert dlq_entry["error_message"] == str(excinfo.value)
    assert "stack_trace" in dlq_entry
    assert dlq_entry["stack_trace"] != ""
    assert "Traceback" in dlq_entry["stack_trace"]
    assert dlq_entry["payload"] == payload

    # DLQ label fallback checking (replace 'Untitled task' with descriptive label)
    assert dlq_entry["title"].startswith("[Untitlted] submission @ ")
