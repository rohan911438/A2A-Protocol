from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass
class TaskRecord:
    payload: dict[str, Any]
    status: str
    created_at: datetime


@dataclass
class DealRecord:
    status: str
    deal: dict[str, Any] | None
    updated_at: datetime


# In-memory storage for tasks and deals
TASKS: dict[str, TaskRecord] = {}
DEALS: dict[str, DealRecord] = {}
