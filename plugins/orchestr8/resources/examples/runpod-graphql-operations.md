---
id: runpod-graphql-operations
category: example
tags: [runpod, graphql, api, pods, python, mutations]
capabilities:
  - Complete GraphQL pod lifecycle management
  - Python implementation with error handling
  - Template and volume creation
useWhen:
  - Implementing RunPod pod management via GraphQL API with Python requests library
  - Creating automated pod provisioning scripts with GraphQL mutations for on-demand and spot instances
  - Building RunPod infrastructure automation requiring template creation, pod lifecycle management, and volume operations
  - Need complete Python GraphQL client implementation with error handling and retry logic
estimatedTokens: 600
---

# RunPod GraphQL Operations - Complete Python Implementation

```python
import requests
import time
from typing import Dict, Any, Optional

class RunPodGraphQLClient:
    """Complete RunPod GraphQL client implementation"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.endpoint = "https://api.runpod.io/graphql"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def _execute(self, query: str, variables: Optional[Dict] = None) -> Dict[str, Any]:
        """Execute GraphQL query with error handling"""
        payload = {"query": query}
        if variables:
            payload["variables"] = variables

        response = requests.post(self.endpoint, headers=self.headers, json=payload)
        result = response.json()

        if "errors" in result:
            raise Exception(f"GraphQL errors: {result['errors']}")

        return result["data"]

    # Pod Operations

    def create_on_demand_pod(self, gpu_type: str, image: str,
                            volume_gb: int = 50, container_disk_gb: int = 20,
                            ports: str = "8888/http", env: Dict[str, str] = None) -> str:
        """Create on-demand pod"""
        query = """
        mutation($input: PodFindAndDeployOnDemandInput!) {
          podFindAndDeployOnDemand(input: $input) {
            id
            name
            desiredStatus
            costPerHr
            machine {
              gpuDisplayName
              gpuCount
            }
            runtime {
              ports {
                publicPort
                type
              }
            }
          }
        }
        """

        variables = {
            "input": {
                "cloudType": "SECURE",
                "gpuCount": 1,
                "volumeInGb": volume_gb,
                "containerDiskInGb": container_disk_gb,
                "minVcpuCount": 4,
                "minMemoryInGb": 16,
                "gpuTypeId": gpu_type,
                "imageName": image,
                "ports": ports,
                "volumeMountPath": "/workspace",
                "env": [{"key": k, "value": v} for k, v in (env or {}).items()]
            }
        }

        result = self._execute(query, variables)
        pod = result["podFindAndDeployOnDemand"]
        print(f"Created pod {pod['id']} - {pod['machine']['gpuDisplayName']} @ ${pod['costPerHr']}/hr")
        return pod["id"]

    def create_spot_pod(self, gpu_type: str, image: str, bid_per_gpu: float,
                       volume_gb: int = 50) -> str:
        """Create spot (interruptable) pod"""
        query = """
        mutation($input: PodRentInterruptableInput!) {
          podRentInterruptable(input: $input) {
            id
            costPerHr
          }
        }
        """

        variables = {
            "input": {
                "bidPerGpu": bid_per_gpu,
                "cloudType": "SECURE",
                "gpuCount": 1,
                "volumeInGb": volume_gb,
                "containerDiskInGb": 20,
                "minVcpuCount": 4,
                "minMemoryInGb": 16,
                "gpuTypeId": gpu_type,
                "imageName": image,
                "ports": "8888/http",
                "volumeMountPath": "/workspace"
            }
        }

        result = self._execute(query, variables)
        pod = result["podRentInterruptable"]
        print(f"Created spot pod {pod['id']} @ ${pod['costPerHr']}/hr")
        return pod["id"]

    def stop_pod(self, pod_id: str) -> None:
        """Stop pod (pause, keeps configuration)"""
        query = """
        mutation($input: PodStopInput!) {
          podStop(input: $input) {
            id
            desiredStatus
          }
        }
        """

        result = self._execute(query, {"input": {"podId": pod_id}})
        print(f"Stopped pod {pod_id}")

    def resume_pod(self, pod_id: str) -> None:
        """Resume stopped pod"""
        query = """
        mutation($input: PodResumeInput!) {
          podResume(input: $input) {
            id
            desiredStatus
          }
        }
        """

        result = self._execute(query, {"input": {"podId": pod_id}})
        print(f"Resumed pod {pod_id}")

    def terminate_pod(self, pod_id: str) -> None:
        """Terminate pod (permanent deletion)"""
        query = """
        mutation($input: PodTerminateInput!) {
          podTerminate(input: $input) {
            id
          }
        }
        """

        result = self._execute(query, {"input": {"podId": pod_id}})
        print(f"Terminated pod {pod_id}")

    def get_pods(self) -> list:
        """Get all my pods"""
        query = """
        query {
          myself {
            pods {
              id
              name
              desiredStatus
              imageName
              costPerHr
              machine {
                gpuDisplayName
                gpuCount
              }
              runtime {
                uptimeInSeconds
                ports {
                  publicPort
                  type
                }
              }
            }
          }
        }
        """

        result = self._execute(query)
        return result["myself"]["pods"]

    def get_pod_details(self, pod_id: str) -> Dict:
        """Get detailed pod information"""
        query = """
        query($podId: String!) {
          pod(input: { podId: $podId }) {
            id
            name
            desiredStatus
            imageName
            costPerHr
            machine {
              gpuDisplayName
              gpuCount
              cpuCores
              memoryInGb
            }
            runtime {
              uptimeInSeconds
              gpuUtilPercent
              ports {
                ip
                publicPort
                type
              }
            }
          }
        }
        """

        result = self._execute(query, {"podId": pod_id})
        return result["pod"]

    # Template Operations

    def create_template(self, name: str, image: str,
                       container_disk_gb: int = 30, volume_gb: int = 100,
                       ports: str = "8888/http", is_serverless: bool = False) -> str:
        """Create pod template"""
        query = """
        mutation($input: SaveTemplateInput!) {
          saveTemplate(input: $input) {
            id
            name
          }
        }
        """

        variables = {
            "input": {
                "name": name,
                "imageName": image,
                "containerDiskInGb": container_disk_gb,
                "volumeInGb": volume_gb if not is_serverless else 0,
                "ports": ports,
                "isServerless": is_serverless
            }
        }

        result = self._execute(query, variables)
        template = result["saveTemplate"]
        print(f"Created template {template['id']}: {template['name']}")
        return template["id"]

    # Network Volume Operations

    def create_network_volume(self, name: str, size_gb: int,
                             datacenter: str = "US-TX-2") -> str:
        """Create network volume"""
        query = """
        mutation($input: CreateNetworkVolumeInput!) {
          createNetworkVolume(input: $input) {
            id
            name
          }
        }
        """

        variables = {
            "input": {
                "name": name,
                "size": size_gb,
                "dataCenterId": datacenter
            }
        }

        result = self._execute(query, variables)
        volume = result["createNetworkVolume"]
        print(f"Created volume {volume['id']}: {volume['name']} ({size_gb}GB)")
        return volume["id"]

    # GPU Type Queries

    def get_gpu_types(self) -> list:
        """Get available GPU types and pricing"""
        query = """
        query {
          gpuTypes {
            id
            displayName
            memoryInGb
            securePrice
            communityPrice
            lowestPrice(input: { gpuCount: 1 }) {
              minimumBidPrice
            }
          }
        }
        """

        result = self._execute(query)
        return result["gpuTypes"]


# Usage Examples

if __name__ == "__main__":
    client = RunPodGraphQLClient("your_api_key_here")

    # Example 1: Create on-demand pod
    pod_id = client.create_on_demand_pod(
        gpu_type="NVIDIA RTX A6000",
        image="runpod/pytorch:latest",
        volume_gb=50,
        env={"JUPYTER_PASSWORD": "secure123"}
    )

    # Example 2: Get pod details
    pod_details = client.get_pod_details(pod_id)
    print(f"Pod status: {pod_details['desiredStatus']}")
    print(f"GPU: {pod_details['machine']['gpuDisplayName']}")

    # Example 3: List all pods
    pods = client.get_pods()
    for pod in pods:
        print(f"{pod['id']}: {pod['name']} - {pod['desiredStatus']}")

    # Example 4: Create spot pod (cheaper)
    spot_pod_id = client.create_spot_pod(
        gpu_type="NVIDIA RTX A6000",
        image="runpod/pytorch:latest",
        bid_per_gpu=0.30  # Max price per GPU per hour
    )

    # Example 5: Create template for reuse
    template_id = client.create_template(
        name="PyTorch Training Template",
        image="runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel",
        container_disk_gb=30,
        volume_gb=100
    )

    # Example 6: Create network volume
    volume_id = client.create_network_volume(
        name="shared-models",
        size_gb=500,
        datacenter="US-TX-2"
    )

    # Example 7: Stop pod when not in use
    client.stop_pod(pod_id)

    # Example 8: Resume when needed
    client.resume_pod(pod_id)

    # Example 9: Terminate when done
    # client.terminate_pod(pod_id)
```
