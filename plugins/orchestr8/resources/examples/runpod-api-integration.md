---
id: runpod-api-integration
category: example
tags: [runpod, rest, api, python, client, async, webhooks]
capabilities:
  - Complete REST API client implementation
  - Async and sync job handling
  - Webhook integration
useWhen:
  - Building RunPod REST API client with async/sync job submission and status polling
  - Implementing webhook-based notifications for RunPod serverless job completion
  - Creating production-ready RunPod integration with retry logic, error handling, and rate limiting
  - Need complete Python client for RunPod serverless endpoints with polling and webhook support
estimatedTokens: 550
---

# RunPod REST API Integration - Complete Client

```python
import requests
import time
from typing import Dict, Any, Optional, Callable
from dataclasses import dataclass
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class JobResult:
    """Job result container"""
    job_id: str
    status: str  # IN_QUEUE, IN_PROGRESS, COMPLETED, FAILED, CANCELLED
    output: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time: Optional[int] = None
    delay_time: Optional[int] = None


class RunPodAPIClient:
    """Complete RunPod REST API client"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.runpod.ai/v2"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def _request(self, method: str, url: str, **kwargs) -> Dict[str, Any]:
        """Make HTTP request with error handling"""
        try:
            response = requests.request(method, url, headers=self.headers, **kwargs)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:
                logger.warning("Rate limited, retrying after 5s...")
                time.sleep(5)
                return self._request(method, url, **kwargs)
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            raise

    # Async Job Operations

    def run_async(self, endpoint_id: str, input_data: Dict[str, Any],
                  webhook: Optional[str] = None) -> str:
        """Submit async job"""
        url = f"{self.base_url}/{endpoint_id}/run"

        payload = {"input": input_data}
        if webhook:
            payload["webhook"] = webhook

        result = self._request("POST", url, json=payload)
        job_id = result["id"]
        logger.info(f"Job submitted: {job_id}")
        return job_id

    def run_sync(self, endpoint_id: str, input_data: Dict[str, Any],
                timeout: int = 95) -> JobResult:
        """Submit sync job (90s max on RunPod side)"""
        url = f"{self.base_url}/{endpoint_id}/runsync"

        result = self._request("POST", url, json={"input": input_data}, timeout=timeout)

        return JobResult(
            job_id=result["id"],
            status=result["status"],
            output=result.get("output"),
            error=result.get("error"),
            execution_time=result.get("executionTime")
        )

    def status(self, endpoint_id: str, job_id: str) -> JobResult:
        """Check job status"""
        url = f"{self.base_url}/{endpoint_id}/status/{job_id}"

        result = self._request("GET", url)

        return JobResult(
            job_id=result["id"],
            status=result["status"],
            output=result.get("output"),
            error=result.get("error"),
            execution_time=result.get("executionTime"),
            delay_time=result.get("delayTime")
        )

    def cancel(self, endpoint_id: str, job_id: str) -> JobResult:
        """Cancel running job"""
        url = f"{self.base_url}/{endpoint_id}/cancel/{job_id}"

        result = self._request("POST", url)

        return JobResult(
            job_id=result["id"],
            status=result["status"]
        )

    def purge_queue(self, endpoint_id: str) -> int:
        """Purge all queued jobs"""
        url = f"{self.base_url}/{endpoint_id}/purge-queue"

        result = self._request("POST", url)
        removed = result.get("removed", 0)
        logger.info(f"Purged {removed} jobs from queue")
        return removed

    def health(self, endpoint_id: str) -> Dict[str, Any]:
        """Check endpoint health"""
        url = f"{self.base_url}/{endpoint_id}/health"

        return self._request("GET", url)

    # Advanced Operations

    def wait_for_completion(self, endpoint_id: str, job_id: str,
                          poll_interval: int = 2, max_wait: int = 300,
                          progress_callback: Optional[Callable] = None) -> JobResult:
        """Poll until job completes with optional progress callback"""
        start_time = time.time()

        while time.time() - start_time < max_wait:
            result = self.status(endpoint_id, job_id)

            if progress_callback:
                progress_callback(result)

            if result.status in ["COMPLETED", "FAILED", "CANCELLED", "TIMED_OUT"]:
                elapsed = time.time() - start_time
                logger.info(f"Job {job_id} {result.status} after {elapsed:.1f}s")
                return result

            time.sleep(poll_interval)

        raise TimeoutError(f"Job {job_id} did not complete within {max_wait}s")

    def batch_submit(self, endpoint_id: str, inputs: list[Dict[str, Any]],
                    webhook: Optional[str] = None) -> list[str]:
        """Submit multiple jobs"""
        job_ids = []
        for i, input_data in enumerate(inputs):
            job_id = self.run_async(endpoint_id, input_data, webhook)
            job_ids.append(job_id)
            logger.info(f"Submitted batch job {i+1}/{len(inputs)}: {job_id}")

        return job_ids

    def batch_wait(self, endpoint_id: str, job_ids: list[str],
                   poll_interval: int = 2, max_wait: int = 300) -> list[JobResult]:
        """Wait for multiple jobs to complete"""
        results = {}
        start_time = time.time()

        while len(results) < len(job_ids) and time.time() - start_time < max_wait:
            for job_id in job_ids:
                if job_id in results:
                    continue

                result = self.status(endpoint_id, job_id)
                if result.status in ["COMPLETED", "FAILED", "CANCELLED"]:
                    results[job_id] = result
                    logger.info(f"Job {job_id} completed ({len(results)}/{len(job_ids)})")

            if len(results) < len(job_ids):
                time.sleep(poll_interval)

        return [results.get(jid) for jid in job_ids]


# Webhook Handler (Flask example)

from flask import Flask, request, jsonify

app = Flask(__name__)

# Store results
completed_jobs = {}


@app.route("/runpod-webhook", methods=["POST"])
def handle_webhook():
    """Handle RunPod webhook notifications"""
    data = request.json

    job_id = data["id"]
    status = data["status"]
    output = data.get("output")
    error = data.get("error")

    logger.info(f"Webhook received: {job_id} - {status}")

    if status == "COMPLETED":
        completed_jobs[job_id] = output
        # Process result, send notification, trigger next step, etc.
        logger.info(f"Job {job_id} completed successfully")

    elif status == "FAILED":
        logger.error(f"Job {job_id} failed: {error}")
        # Handle failure, retry, alert, etc.

    return jsonify({"received": True}), 200


# Usage Examples

if __name__ == "__main__":
    client = RunPodAPIClient("your_api_key")
    ENDPOINT_ID = "your_endpoint_id"

    # Example 1: Async job with polling
    job_id = client.run_async(ENDPOINT_ID, {
        "prompt": "Write a story about AI",
        "max_tokens": 500
    })

    result = client.wait_for_completion(ENDPOINT_ID, job_id)
    if result.status == "COMPLETED":
        print(result.output)

    # Example 2: Sync job (fast inference <90s)
    result = client.run_sync(ENDPOINT_ID, {
        "prompt": "Quick summary",
        "max_tokens": 100
    })
    print(result.output)

    # Example 3: Async with webhook (no polling needed)
    job_id = client.run_async(
        ENDPOINT_ID,
        {"prompt": "Long generation task", "max_tokens": 2000},
        webhook="https://your-api.com/runpod-webhook"
    )
    print(f"Job submitted with webhook: {job_id}")

    # Example 4: Progress callback
    def progress(result: JobResult):
        print(f"Job status: {result.status}")

    result = client.wait_for_completion(
        ENDPOINT_ID, job_id,
        progress_callback=progress
    )

    # Example 5: Batch processing
    inputs = [
        {"prompt": f"Story {i}", "max_tokens": 200}
        for i in range(10)
    ]

    job_ids = client.batch_submit(ENDPOINT_ID, inputs)
    results = client.batch_wait(ENDPOINT_ID, job_ids)

    for job_id, result in zip(job_ids, results):
        if result and result.status == "COMPLETED":
            print(f"{job_id}: SUCCESS")
        else:
            print(f"{job_id}: {result.status if result else 'TIMEOUT'}")

    # Example 6: Check health
    health = client.health(ENDPOINT_ID)
    print(f"Workers: {health['workers']['idle']} idle, {health['workers']['running']} running")
    print(f"Queue: {health['jobs']['inQueue']} jobs")

    # Example 7: Cancel job
    job_id = client.run_async(ENDPOINT_ID, {"prompt": "test"})
    time.sleep(1)
    client.cancel(ENDPOINT_ID, job_id)

    # Example 8: Purge queue
    removed = client.purge_queue(ENDPOINT_ID)
    print(f"Removed {removed} jobs from queue")


# Retry Logic with Exponential Backoff

def submit_with_retry(client: RunPodAPIClient, endpoint_id: str,
                     input_data: Dict, max_retries: int = 3) -> str:
    """Submit job with retry logic"""
    for attempt in range(max_retries):
        try:
            return client.run_async(endpoint_id, input_data)
        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                logger.warning(f"Attempt {attempt+1} failed, retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                logger.error(f"All {max_retries} attempts failed")
                raise


# Rate Limiting

from time import sleep
from collections import deque

class RateLimiter:
    """Simple rate limiter for API requests"""

    def __init__(self, max_requests: int, time_window: int):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = deque()

    def wait_if_needed(self):
        """Wait if rate limit would be exceeded"""
        now = time.time()

        # Remove old requests outside time window
        while self.requests and self.requests[0] < now - self.time_window:
            self.requests.popleft()

        # Wait if at limit
        if len(self.requests) >= self.max_requests:
            sleep_time = self.time_window - (now - self.requests[0])
            if sleep_time > 0:
                logger.info(f"Rate limit reached, waiting {sleep_time:.1f}s")
                sleep(sleep_time)

        self.requests.append(now)


# Example with rate limiting
rate_limiter = RateLimiter(max_requests=100, time_window=60)

for i in range(200):
    rate_limiter.wait_if_needed()
    job_id = client.run_async(ENDPOINT_ID, {"prompt": f"Request {i}"})
```
