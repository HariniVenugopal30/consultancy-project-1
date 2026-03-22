from __future__ import annotations

import hashlib
import threading
import time
from collections import OrderedDict
from typing import Any


class InMemoryImageResultCache:
    """Thread-safe LRU cache with TTL for image-derived API responses."""

    def __init__(self, max_entries: int = 256, ttl_seconds: int = 600) -> None:
        self._max_entries = max_entries
        self._ttl_seconds = ttl_seconds
        self._lock = threading.Lock()
        self._store: OrderedDict[str, tuple[float, Any]] = OrderedDict()

    def build_key(self, image_bytes: bytes, *, algorithm: str, top_k: int) -> str:
        digest = hashlib.sha256(image_bytes).hexdigest()
        return f"{digest}:{algorithm}:{top_k}"

    def get(self, key: str) -> Any | None:
        now = time.time()
        with self._lock:
            value = self._store.get(key)
            if value is None:
                return None

            expires_at, payload = value
            if expires_at <= now:
                self._store.pop(key, None)
                return None

            self._store.move_to_end(key)
            return payload

    def set(self, key: str, payload: Any) -> None:
        expires_at = time.time() + self._ttl_seconds
        with self._lock:
            self._store[key] = (expires_at, payload)
            self._store.move_to_end(key)
            while len(self._store) > self._max_entries:
                self._store.popitem(last=False)


# Shared singleton for match requests.
image_match_cache = InMemoryImageResultCache(max_entries=256, ttl_seconds=600)
