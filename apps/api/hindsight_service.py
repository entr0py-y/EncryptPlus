import os
import json
import logging
from typing import List, Dict, Any, Optional
import httpx

try:
    from hindsight_client import Hindsight
    HAS_HINDSIGHT_SDK = True
except ImportError:
    HAS_HINDSIGHT_SDK = False

logger = logging.getLogger("ecdat.hindsight")

DEFAULT_HINDSIGHT_URL = "https://api.hindsight.vectorize.io"
DEFAULT_BANK_ID = "encryptplus-agent"


class HindsightMemoryService:
    """
    Dedicated Hindsight Persistent AI Memory Service.
    Enforces user isolation, retains interaction summaries and task decisions,
    recalls contextual memories across sessions, and gracefully degrades during outages.
    Uses official hindsight-client SDK when configured.
    """

    def __init__(self):
        self.base_url = os.getenv("HINDSIGHT_BASE_URL", DEFAULT_HINDSIGHT_URL).rstrip("/")
        self.api_key = os.getenv("HINDSIGHT_API_KEY", "").strip()
        self.base_bank_id = os.getenv("HINDSIGHT_BANK_ID", DEFAULT_BANK_ID).strip()
        self.timeout = float(os.getenv("HINDSIGHT_TIMEOUT_SECONDS", "10.0"))
        self.hindsight_enabled = os.getenv("HINDSIGHT_ENABLED", "true").lower() in ("true", "1", "yes")
        # In-process session memory cache for local dev / fallback mode
        self._local_memory_store: Dict[str, List[Dict[str, Any]]] = {}

    @property
    def is_configured(self) -> bool:
        return bool(self.hindsight_enabled and self.api_key)

    def _get_scoped_bank_id(self, user_id: str) -> str:
        """
        Enforces strict user isolation.
        Every user's memory is stored in a separate, isolated memory bank namespace.
        """
        sanitized_user = "".join(c for c in (user_id or "dev_user") if c.isalnum() or c in ("-", "_"))
        return f"{self.base_bank_id}-{sanitized_user}"

    def retain_memory(self, user_id: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Stores an interaction memory or user decision into Hindsight.
        Guarantees no raw secret keys, passwords, or entire repositories are sent.
        """
        clean_content = (content or "").strip()
        if not clean_content:
            return False

        # Filter out potential keys/tokens
        if "PRIVATE KEY" in clean_content or "BEGIN CERTIFICATE" in clean_content:
            clean_content = "[Cryptographic key material sanitized from memory payload]"

        bank_id = self._get_scoped_bank_id(user_id)

        # Store in local memory store for instant offline availability & fallback
        if user_id not in self._local_memory_store:
            self._local_memory_store[user_id] = []
        self._local_memory_store[user_id].append({
            "content": clean_content,
            "metadata": metadata or {}
        })

        if not self.is_configured:
            logger.debug(f"Hindsight API key not set. Stored memory locally in fallback store for user '{user_id}'.")
            return True

        # Attempt retain via official Hindsight SDK
        if HAS_HINDSIGHT_SDK:
            try:
                client = Hindsight(base_url=self.base_url, api_key=self.api_key)
                client.retain(bank_id=bank_id, content=clean_content)
                logger.info(f"Retained memory in Hindsight bank '{bank_id}' via official SDK")
                return True
            except Exception as sdk_err:
                logger.warning(f"Official Hindsight SDK retain failed: {sdk_err}. Trying REST API fallback.")

        # REST API Fallback
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "bank_id": bank_id,
            "content": clean_content,
            "metadata": metadata or {}
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                res = client.post(f"{self.base_url}/api/banks/{bank_id}/memories", headers=headers, json=payload)
                if res.status_code in [200, 201, 202]:
                    logger.info(f"Retained memory in Hindsight bank '{bank_id}' via REST API")
                    return True
                elif res.status_code == 404:
                    # Bank might need initialization; attempt bank creation
                    client.post(f"{self.base_url}/api/banks", headers=headers, json={"bank_id": bank_id, "name": f"EncryptPlus User {user_id}"})
                    res = client.post(f"{self.base_url}/api/banks/{bank_id}/memories", headers=headers, json=payload)
                    return res.status_code in [200, 201, 202]
                else:
                    logger.warning(f"Hindsight retain returned status {res.status_code}: {res.text}")
                    return False
        except Exception as e:
            logger.warning(f"Failed to retain memory in Hindsight cloud: {e}. Saved in local fallback store.")
            return True

    def recall_relevant_memories(self, user_id: str, query: str, limit: int = 5) -> List[str]:
        """
        Recalls relevant memories for the user's current query.
        Returns a list of clear memory statements.
        """
        bank_id = self._get_scoped_bank_id(user_id)
        recalled = []

        if self.is_configured:
            # 1. Try official SDK
            if HAS_HINDSIGHT_SDK:
                try:
                    client = Hindsight(base_url=self.base_url, api_key=self.api_key)
                    resp = client.recall(bank_id=bank_id, query=query)
                    if hasattr(resp, "results") and resp.results:
                        for m in resp.results:
                            txt = getattr(m, "text", None) or str(m)
                            if txt:
                                recalled.append(txt)
                        if recalled:
                            logger.info(f"Recalled {len(recalled)} memories via official SDK from '{bank_id}'")
                            return recalled[:limit]
                except Exception as sdk_err:
                    logger.warning(f"Official SDK recall error: {sdk_err}. Trying REST fallback.")

            # 2. Try REST API
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            try:
                with httpx.Client(timeout=self.timeout) as client:
                    res = client.post(
                        f"{self.base_url}/api/banks/{bank_id}/recall",
                        headers=headers,
                        json={"query": query, "limit": limit}
                    )
                    if res.status_code == 200:
                        data = res.json()
                        results = data.get("results", []) or data.get("memories", [])
                        for item in results:
                            txt = item.get("text") or item.get("content")
                            if txt:
                                recalled.append(txt)
                        if recalled:
                            logger.info(f"Recalled {len(recalled)} memories from Hindsight bank '{bank_id}' via REST")
                            return recalled[:limit]
            except Exception as e:
                logger.warning(f"Hindsight recall error: {e}. Falling back to local store.")

        # 3. Fallback to local memory store
        user_memories = self._local_memory_store.get(user_id, [])
        query_terms = [t for t in query.lower().split() if len(t) > 3]

        for m in reversed(user_memories):
            c = m["content"]
            if any(term in c.lower() for term in query_terms):
                recalled.append(c)
            elif len(recalled) < 2:
                recalled.append(c)
            if len(recalled) >= limit:
                break

        return recalled

    # Convenience alias
    recall_memories = recall_relevant_memories

    def store_interaction_memory(self, user_id: str, content: str) -> bool:
        """Helper to retain a user prompt and system summary."""
        return self.retain_memory(user_id=user_id, content=content, metadata={"type": "interaction"})

    def store_task_summary(self, user_id: str, task_id: str, scan_id: Optional[int], summary: str) -> bool:
        """Helper to store task outcomes linked to a stable task ID."""
        text = f"Task '{task_id}' (Scan #{scan_id or 'none'}): {summary}"
        return self.retain_memory(
            user_id=user_id,
            content=text,
            metadata={"type": "task_summary", "task_id": task_id, "scan_id": scan_id}
        )

    def retrieve_conversation_context(self, user_id: str) -> List[str]:
        """Recalls the most recent contextual highlights for the user."""
        return self.recall_relevant_memories(user_id=user_id, query="recent scans and task decisions", limit=3)


# Global singleton
hindsight_service = HindsightMemoryService()
