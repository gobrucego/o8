---
id: runpod-serverless-handler
category: example
tags: [runpod, serverless, python, handler, ml, inference, docker]
capabilities:
  - Complete serverless handler implementation
  - Model loading optimization
  - Docker image for RunPod serverless
useWhen:
  - Building RunPod serverless handlers for ML model inference with proper model loading and error handling
  - Creating Docker images for RunPod serverless deployment with model baking for faster cold starts
  - Implementing serverless inference endpoints requiring input validation, output formatting, and job management
  - Need production-ready serverless handler with logging, monitoring, and graceful error handling
estimatedTokens: 550
---

# RunPod Serverless Handler - Production Implementation

## handler.py

```python
import runpod
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import logging
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load model globally (once per worker, not per request)
logger.info("Loading model...")
MODEL_ID = "meta-llama/Llama-2-7b-hf"

try:
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        torch_dtype=torch.float16,
        device_map="auto"
    )
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    logger.info(f"Model {MODEL_ID} loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    raise


def validate_input(job_input: Dict[str, Any]) -> tuple[bool, str]:
    """Validate job input parameters"""
    if "prompt" not in job_input:
        return False, "Missing required field: prompt"

    if not isinstance(job_input["prompt"], str):
        return False, "prompt must be a string"

    if len(job_input["prompt"]) == 0:
        return False, "prompt cannot be empty"

    max_tokens = job_input.get("max_tokens", 100)
    if not isinstance(max_tokens, int) or max_tokens < 1 or max_tokens > 2048:
        return False, "max_tokens must be between 1 and 2048"

    return True, ""


def handler(job: Dict[str, Any]) -> Dict[str, Any]:
    """
    RunPod serverless handler function

    Args:
        job: {
            "input": {
                "prompt": str,              # Required
                "max_tokens": int,          # Optional, default 100
                "temperature": float,       # Optional, default 0.7
                "top_p": float,             # Optional, default 0.9
            },
            "id": str,                      # Job ID
            "webhook": str                  # Optional callback URL
        }

    Returns:
        {
            "generated_text": str,
            "tokens_generated": int,
            "model": str
        }
    """
    try:
        job_input = job["input"]
        logger.info(f"Processing job {job['id']}")

        # Validate input
        is_valid, error_msg = validate_input(job_input)
        if not is_valid:
            return {"error": error_msg}

        # Extract parameters
        prompt = job_input["prompt"]
        max_tokens = job_input.get("max_tokens", 100)
        temperature = job_input.get("temperature", 0.7)
        top_p = job_input.get("top_p", 0.9)

        logger.info(f"Generating {max_tokens} tokens for prompt: {prompt[:50]}...")

        # Tokenize input
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

        # Generate
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )

        # Decode output
        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        tokens_generated = len(outputs[0]) - len(inputs.input_ids[0])

        logger.info(f"Generated {tokens_generated} tokens successfully")

        return {
            "generated_text": generated_text,
            "tokens_generated": tokens_generated,
            "model": MODEL_ID,
            "parameters": {
                "max_tokens": max_tokens,
                "temperature": temperature,
                "top_p": top_p
            }
        }

    except Exception as e:
        logger.error(f"Error processing job: {e}", exc_info=True)
        return {"error": str(e)}


# Start the serverless worker
if __name__ == "__main__":
    logger.info("Starting RunPod serverless worker...")
    runpod.serverless.start({"handler": handler})
```

## Dockerfile

```dockerfile
# Use RunPod's official PyTorch base image
FROM runpod/pytorch:2.1.0-py3.10-cuda11.8.0-runtime

# Set working directory
WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir \
    transformers \
    accelerate \
    sentencepiece \
    protobuf

# Copy handler
COPY handler.py .

# Download and cache model (faster cold starts)
# This increases image size but drastically reduces cold start time
RUN python -c "from transformers import AutoModelForCausalLM, AutoTokenizer; \
    AutoModelForCausalLM.from_pretrained('meta-llama/Llama-2-7b-hf', torch_dtype='auto'); \
    AutoTokenizer.from_pretrained('meta-llama/Llama-2-7b-hf')"

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV TRANSFORMERS_CACHE=/root/.cache/huggingface

# Start handler
CMD ["python", "-u", "handler.py"]
```

## Build and Deploy

```bash
# Build for linux/amd64 (required by RunPod)
docker build --platform linux/amd64 -t yourname/llama2-serverless:v1 .

# Test locally (requires GPU)
docker run --gpus all -p 8000:8000 yourname/llama2-serverless:v1

# Push to registry
docker push yourname/llama2-serverless:v1

# Deploy via RunPod Dashboard:
# 1. Serverless > New Endpoint
# 2. Custom Image > yourname/llama2-serverless:v1
# 3. Select GPU (A100, A10G, etc.)
# 4. Set workers min/max (e.g., 0-5)
# 5. Set timeout (e.g., 300s)
# 6. Deploy
```

## Client Usage

```python
import requests

ENDPOINT_ID = "your_endpoint_id"
API_KEY = "your_api_key"

# Async job submission
response = requests.post(
    f"https://api.runpod.ai/v2/{ENDPOINT_ID}/run",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "input": {
            "prompt": "Once upon a time",
            "max_tokens": 200,
            "temperature": 0.8
        }
    }
)

job_id = response.json()["id"]
print(f"Job submitted: {job_id}")

# Check status
status_response = requests.get(
    f"https://api.runpod.ai/v2/{ENDPOINT_ID}/status/{job_id}",
    headers={"Authorization": f"Bearer {API_KEY}"}
)

result = status_response.json()
if result["status"] == "COMPLETED":
    print(result["output"]["generated_text"])
```

## Advanced: With Network Volume

For very large models, use network volume instead of baking into image:

```python
# handler.py (using network volume)
import os

# Model stored on network volume
MODEL_PATH = "/runpod-volume/models/llama-2-7b"

if os.path.exists(MODEL_PATH):
    model = AutoModelForCausalLM.from_pretrained(MODEL_PATH)
    logger.info(f"Loaded model from {MODEL_PATH}")
else:
    # Download on first run
    model = AutoModelForCausalLM.from_pretrained(MODEL_ID)
    model.save_pretrained(MODEL_PATH)
    logger.info(f"Downloaded and cached model to {MODEL_PATH}")
```

## Best Practices

1. **Load models globally** - Not inside handler function
2. **Validate inputs** - Return clear error messages
3. **Use proper logging** - Helps debugging in production
4. **Handle errors gracefully** - Return error in output, don't crash
5. **Set reasonable limits** - Prevent resource exhaustion
6. **Use torch.no_grad()** - Inference doesn't need gradients
7. **Bake models for speed** - Trade image size for cold start time
8. **Set timeout appropriately** - Match expected inference time
