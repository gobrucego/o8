---
name: setup-monitoring
description: Autonomous observability stack setup with Prometheus, Grafana, OpenTelemetry, logging, alerting, and SLO monitoring. Complete production-grade monitoring from scratch to full observability.
---

# Setup Monitoring Workflow

Autonomous deployment of comprehensive observability stack for production systems.

## Phases

### Phase 1: Requirements & Architecture (10-15 min)
**Objective**: Design observability architecture tailored to system needs

**Tasks**:
1. **Analyze System Architecture**
   - Identify all services and components
   - Map dependencies and data flows
   - Determine monitoring requirements per service
   - Identify critical paths and user journeys

2. **Define SLIs and SLOs**
   - Availability SLO (e.g., 99.9% uptime)
   - Latency SLO (e.g., p95 < 200ms)
   - Error rate SLO (e.g., < 0.1% errors)
   - Throughput requirements
   - Calculate error budgets

3. **Design Monitoring Stack**
   - Metrics: Prometheus, Grafana, VictoriaMetrics
   - Logs: ELK Stack, Loki, or Fluentd
   - Traces: Jaeger, Tempo, or Zipkin
   - APM: Datadog, New Relic, or self-hosted
   - Alerting: Alertmanager, PagerDuty, Slack

**Agents**: `architect`, `sre-specialist`, `observability-specialist`

**Deliverables**:
- Observability architecture diagram
- SLO definitions
- Tech stack selection
- Deployment plan

---

### Phase 2: Metrics Infrastructure (20-30 min)
**Objective**: Deploy Prometheus, Grafana, and exporters

**Tasks**:
1. **Deploy Prometheus**
   - Install Prometheus server (Docker/Kubernetes)
   - Configure service discovery (Kubernetes, Consul)
   - Set up persistent storage
   - Configure retention policies

2. **Deploy Exporters**
   - Node exporter (system metrics)
   - kube-state-metrics (Kubernetes state)
   - Custom application exporters
   - Database exporters (postgres_exporter, mongodb_exporter)

3. **Deploy Grafana**
   - Install Grafana
   - Configure Prometheus data source
   - Set up authentication (OAuth, LDAP)
   - Configure dashboards persistence

4. **Recording Rules**
   - Create aggregation rules for efficiency
   - Pre-compute SLI metrics
   - Optimize query performance

**Agents**: `observability-specialist`, `kubernetes-expert`, `infrastructure-engineer`

**Code Examples**:
```yaml
# Kubernetes deployment for Prometheus
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: monitoring
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        args:
          - '--config.file=/etc/prometheus/prometheus.yml'
          - '--storage.tsdb.path=/prometheus'
          - '--storage.tsdb.retention.time=30d'
          - '--web.enable-lifecycle'
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: prometheus-config
          mountPath: /etc/prometheus
        - name: prometheus-storage
          mountPath: /prometheus
      volumes:
      - name: prometheus-config
        configMap:
          name: prometheus-config
      - name: prometheus-storage
        persistentVolumeClaim:
          claimName: prometheus-pvc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: prometheus-pvc
  namespace: monitoring
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
```

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # Kubernetes pods
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true

  # Node exporter
  - job_name: 'node-exporter'
    kubernetes_sd_configs:
      - role: node
    relabel_configs:
      - source_labels: [__address__]
        regex: '(.*):10250'
        replacement: '${1}:9100'
        target_label: __address__

  # kube-state-metrics
  - job_name: 'kube-state-metrics'
    static_configs:
      - targets: ['kube-state-metrics.monitoring:8080']
```

**Deliverables**:
- Prometheus cluster deployed
- Grafana instance running
- Exporters collecting metrics
- Recording rules configured

---

### Phase 3: Application Instrumentation (30-40 min)
**Objective**: Instrument applications with metrics, logs, and traces

**Tasks**:
1. **Metrics Instrumentation**
   - Add Prometheus client libraries
   - Instrument HTTP endpoints (latency, status codes)
   - Add business metrics (orders, signups, revenue)
   - Database query metrics
   - Cache hit/miss ratios

2. **Structured Logging**
   - Implement JSON logging format
   - Add correlation IDs
   - Include trace context in logs
   - Log severity levels
   - Error stack traces

3. **Distributed Tracing**
   - Integrate OpenTelemetry SDK
   - Auto-instrument frameworks (Flask, FastAPI, Express)
   - Add custom spans for business logic
   - Context propagation across services
   - Sample rate configuration

4. **Health Checks**
   - Implement /health endpoint
   - Liveness probe (is process running?)
   - Readiness probe (can accept traffic?)
   - Dependency health checks

**Agents**: `observability-specialist`, language-specific developers (e.g., `python-developer`, `typescript-developer`)

**Code Examples**:
```python
# Python application instrumentation
from prometheus_client import Counter, Histogram, start_http_server
from opentelemetry import trace
from opentelemetry.instrumentation.flask import FlaskInstrumentor
import logging
import json

# Metrics
request_count = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint'],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0]
)

# Structured logging
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            'timestamp': self.formatTime(record),
            'level': record.levelname,
            'message': record.getMessage(),
            'module': record.module,
            'trace_id': getattr(record, 'trace_id', None),
            'span_id': getattr(record, 'span_id', None)
        }
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        return json.dumps(log_data)

# Tracing
tracer = trace.get_tracer(__name__)
FlaskInstrumentor().instrument_app(app)

@app.route('/api/orders', methods=['POST'])
def create_order():
    with tracer.start_as_current_span("create_order") as span:
        start = time.time()

        try:
            # Business logic
            order = process_order(request.json)

            span.set_attribute("order.id", order['id'])
            span.set_attribute("order.amount", order['amount'])

            request_count.labels(method='POST', endpoint='/api/orders', status=201).inc()
            request_duration.labels(method='POST', endpoint='/api/orders').observe(time.time() - start)

            return jsonify(order), 201

        except Exception as e:
            span.record_exception(e)
            request_count.labels(method='POST', endpoint='/api/orders', status=500).inc()
            logging.error("Order creation failed", exc_info=True)
            raise

# Health check
@app.route('/health')
def health():
    checks = {
        'database': check_database(),
        'cache': check_redis(),
        'queue': check_rabbitmq()
    }

    all_healthy = all(checks.values())
    status_code = 200 if all_healthy else 503

    return jsonify({
        'status': 'healthy' if all_healthy else 'unhealthy',
        'checks': checks
    }), status_code

# Start metrics server
start_http_server(8000)
```

**Deliverables**:
- Applications instrumented
- Metrics exposed
- Logs structured
- Traces enabled
- Health checks implemented

---

### Phase 4: Logging Infrastructure (20-30 min)
**Objective**: Deploy log aggregation and analysis platform

**Tasks**:
1. **Deploy Log Aggregation**
   - Option A: ELK Stack (Elasticsearch, Logstash, Kibana)
   - Option B: Loki + Promtail
   - Option C: Fluentd + Elasticsearch

2. **Configure Log Collection**
   - Container log collection (Filebeat, Fluentd)
   - Parse JSON logs
   - Add metadata (pod name, namespace, node)
   - Set up log retention policies

3. **Log Analysis**
   - Create log search indexes
   - Set up log dashboards in Kibana/Grafana
   - Configure saved searches
   - Error log aggregation

4. **Log-based Alerts**
   - Alert on error spikes
   - Alert on specific error patterns
   - Alert on security events

**Agents**: `observability-specialist`, `kubernetes-expert`

**Code Examples**:
```yaml
# Loki deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: loki
  namespace: monitoring
spec:
  template:
    spec:
      containers:
      - name: loki
        image: grafana/loki:latest
        args:
          - -config.file=/etc/loki/loki.yml
        ports:
        - containerPort: 3100
        volumeMounts:
        - name: loki-config
          mountPath: /etc/loki
        - name: loki-storage
          mountPath: /loki
---
# Promtail DaemonSet
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: promtail
  namespace: monitoring
spec:
  template:
    spec:
      containers:
      - name: promtail
        image: grafana/promtail:latest
        args:
          - -config.file=/etc/promtail/promtail.yml
        volumeMounts:
        - name: logs
          mountPath: /var/log
        - name: containers
          mountPath: /var/lib/docker/containers
          readOnly: true
      volumes:
      - name: logs
        hostPath:
          path: /var/log
      - name: containers
        hostPath:
          path: /var/lib/docker/containers
```

```yaml
# promtail.yml
server:
  http_listen_port: 9080

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: kubernetes-pods
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        target_label: app
      - source_labels: [__meta_kubernetes_namespace]
        target_label: namespace
    pipeline_stages:
      - docker: {}
      - json:
          expressions:
            level: level
            message: message
            trace_id: trace_id
      - labels:
          level:
          trace_id:
```

**Deliverables**:
- Log aggregation platform deployed
- Logs flowing from all services
- Log dashboards created
- Log retention configured

---

### Phase 5: Distributed Tracing (20-30 min)
**Objective**: Deploy and configure distributed tracing backend

**Tasks**:
1. **Deploy Tracing Backend**
   - Option A: Jaeger
   - Option B: Tempo + Grafana
   - Option C: Zipkin

2. **Configure OpenTelemetry Collector**
   - Receive traces from applications
   - Process and enrich traces
   - Export to tracing backend
   - Sample rate configuration

3. **Trace Visualization**
   - Service dependency map
   - Trace search and filtering
   - Latency analysis
   - Error trace analysis

**Agents**: `observability-specialist`, `kubernetes-expert`

**Code Examples**:
```yaml
# Tempo deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tempo
  namespace: monitoring
spec:
  template:
    spec:
      containers:
      - name: tempo
        image: grafana/tempo:latest
        args:
          - -config.file=/etc/tempo/tempo.yml
        ports:
        - containerPort: 3200  # HTTP
        - containerPort: 4317  # OTLP gRPC
        - containerPort: 4318  # OTLP HTTP
---
# OpenTelemetry Collector
apiVersion: apps/v1
kind: Deployment
metadata:
  name: otel-collector
  namespace: monitoring
spec:
  template:
    spec:
      containers:
      - name: otel-collector
        image: otel/opentelemetry-collector:latest
        args:
          - --config=/etc/otel/config.yaml
        ports:
        - containerPort: 4317  # OTLP gRPC
        - containerPort: 4318  # OTLP HTTP
```

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024

  # Add resource attributes
  resource:
    attributes:
      - key: environment
        value: production
        action: insert

  # Sampling
  probabilistic_sampler:
    sampling_percentage: 10  # 10% sampling

exporters:
  otlp/tempo:
    endpoint: tempo:4317
    tls:
      insecure: true

  prometheus:
    endpoint: "0.0.0.0:8889"

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch, resource, probabilistic_sampler]
      exporters: [otlp/tempo]

    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus]
```

**Deliverables**:
- Tracing backend deployed
- Traces flowing from applications
- Service maps visualized
- Trace search working

---

### Phase 6: Dashboards & Visualization (30-40 min)
**Objective**: Create comprehensive dashboards for monitoring

**Tasks**:
1. **Infrastructure Dashboards**
   - Cluster overview (CPU, memory, disk, network)
   - Node health and resource usage
   - Pod status and restarts
   - PersistentVolume usage

2. **Application Dashboards**
   - Request rate and latency (RED metrics)
   - Error rates and types
   - Dependency health
   - Business metrics

3. **SLO Dashboards**
   - Availability tracking
   - Error budget consumption
   - Burn rate alerts
   - SLO compliance trends

4. **Database Dashboards**
   - Query performance
   - Connection pool usage
   - Cache hit rates
   - Slow query analysis

**Agents**: `observability-specialist`

**Code Examples**:
```json
// Grafana dashboard JSON (API Service Overview)
{
  "dashboard": {
    "title": "API Service - Production",
    "tags": ["api", "production", "slo"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate (req/s)",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{service=\"api\"}[5m])) by (status)",
            "legendFormat": "{{ status }}"
          }
        ]
      },
      {
        "id": 2,
        "title": "Latency Percentiles",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "p50"
          },
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "p95"
          },
          {
            "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "p99"
          }
        ],
        "alert": {
          "conditions": [
            {
              "evaluator": {
                "params": [0.2],
                "type": "gt"
              },
              "query": {
                "params": ["B", "5m", "now"]
              }
            }
          ],
          "name": "High P95 Latency"
        }
      },
      {
        "id": 3,
        "title": "Error Rate (%)",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100"
          }
        ],
        "thresholds": {
          "steps": [
            { "color": "green", "value": null },
            { "color": "yellow", "value": 0.1 },
            { "color": "red", "value": 1.0 }
          ]
        }
      },
      {
        "id": 4,
        "title": "SLO Compliance (99.9%)",
        "type": "gauge",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status!~\"5..\"}[30d])) / sum(rate(http_requests_total[30d]))"
          }
        ],
        "options": {
          "thresholds": {
            "steps": [
              { "color": "red", "value": 0.995 },
              { "color": "yellow", "value": 0.998 },
              { "color": "green", "value": 0.999 }
            ]
          }
        }
      },
      {
        "id": 5,
        "title": "Error Budget Remaining",
        "type": "bargauge",
        "targets": [
          {
            "expr": "1 - ((1 - (sum(rate(http_requests_total{status!~\"5..\"}[30d])) / sum(rate(http_requests_total[30d])))) / (1 - 0.999))"
          }
        ]
      }
    ],
    "templating": {
      "list": [
        {
          "name": "namespace",
          "type": "query",
          "query": "label_values(kube_pod_info, namespace)"
        },
        {
          "name": "service",
          "type": "query",
          "query": "label_values(http_requests_total{namespace=\"$namespace\"}, service)"
        }
      ]
    }
  }
}
```

**Deliverables**:
- Infrastructure dashboards
- Application dashboards
- SLO dashboards
- Database dashboards

---

### Phase 7: Alerting & Incident Response (25-35 min)
**Objective**: Configure comprehensive alerting and on-call procedures

**Tasks**:
1. **Alert Rules**
   - SLO burn rate alerts
   - Error rate alerts
   - Latency alerts
   - Resource exhaustion alerts
   - Disk space alerts
   - Certificate expiration alerts

2. **Alertmanager Configuration**
   - Routing by severity
   - Grouping and deduplication
   - Inhibition rules
   - Silence management

3. **Notification Channels**
   - Slack integration (warnings, critical)
   - PagerDuty integration (critical only)
   - Email notifications
   - Webhook integrations

4. **On-Call Runbooks**
   - Create runbooks for common alerts
   - Link alerts to runbooks
   - Document escalation procedures
   - Test alert workflows

**Agents**: `sre-specialist`, `observability-specialist`

**Code Examples**:
```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/XXX'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'

  routes:
    # Critical -> PagerDuty + Slack
    - match:
        severity: critical
      receiver: pagerduty
      continue: true

    - match:
        severity: critical
      receiver: slack-critical

    # Warning -> Slack only
    - match:
        severity: warning
      receiver: slack-warnings

receivers:
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
        description: '{{ .GroupLabels.alertname }}: {{ .CommonAnnotations.summary }}'

  - name: 'slack-critical'
    slack_configs:
      - channel: '#incidents'
        color: 'danger'
        title: '🚨 {{ .GroupLabels.alertname }}'
        text: |
          *Summary:* {{ .CommonAnnotations.summary }}
          *Description:* {{ .CommonAnnotations.description }}
          *Runbook:* {{ .CommonAnnotations.runbook }}
          *Dashboard:* {{ .CommonAnnotations.dashboard }}

  - name: 'slack-warnings'
    slack_configs:
      - channel: '#alerts'
        color: 'warning'
        title: '⚠️  {{ .GroupLabels.alertname }}'

inhibit_rules:
  # Don't alert on warning if critical is firing
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'service']
```

**Deliverables**:
- Alert rules configured
- Alertmanager deployed
- Notification channels integrated
- Runbooks created

---

### Phase 8: Performance & Optimization (15-20 min)
**Objective**: Optimize monitoring stack performance

**Tasks**:
1. **Prometheus Optimization**
   - Configure scrape intervals
   - Set up remote write (long-term storage)
   - Implement recording rules for expensive queries
   - Configure federation for HA

2. **Query Optimization**
   - Identify slow queries
   - Add recording rules
   - Optimize dashboard queries
   - Set up query caching

3. **Storage Optimization**
   - Configure retention policies
   - Set up compaction
   - Implement tiered storage
   - Monitor disk usage

4. **High Availability**
   - Deploy Prometheus in HA mode
   - Set up Thanos or Cortex for long-term storage
   - Configure Grafana HA
   - Backup and disaster recovery

**Agents**: `observability-specialist`, `infrastructure-engineer`

**Deliverables**:
- Optimized Prometheus configuration
- HA monitoring stack
- Long-term storage configured
- Backup procedures documented

---

## Quality Gates

**Infrastructure Gate**:
- [ ] All monitoring components deployed
- [ ] Health checks passing
- [ ] Data persistence working
- [ ] HA configured for critical components

**Instrumentation Gate**:
- [ ] All services exposing metrics
- [ ] Logs flowing to aggregation platform
- [ ] Traces visible in backend
- [ ] Health checks implemented

**Dashboard Gate**:
- [ ] Key dashboards created (infra, app, SLO)
- [ ] Dashboards load within 2s
- [ ] All panels showing data
- [ ] Dashboards saved in version control

**Alerting Gate**:
- [ ] Critical alerts configured
- [ ] Alerts tested and firing correctly
- [ ] Runbooks linked
- [ ] On-call schedule configured

---

## Success Criteria

Monitoring setup is complete when:

1. **Metrics**: All services instrumented, metrics flowing to Prometheus
2. **Logs**: Structured logs from all services, searchable in central platform
3. **Traces**: Distributed tracing working across all services
4. **Dashboards**: Comprehensive dashboards for infra, apps, and SLOs
5. **Alerts**: Critical alerts configured and tested
6. **Runbooks**: Documentation for common incidents
7. **Performance**: Stack handles current scale with headroom
8. **HA**: Redundancy for critical components

---

## Example Invocation

```bash
# User request
"Set up complete observability for our Kubernetes cluster running 20 microservices.
We need metrics, logs, traces, and SLO monitoring with PagerDuty integration."

# Workflow executes:
# 1. Analyzes architecture (20 microservices, Kubernetes)
# 2. Designs stack (Prometheus, Grafana, Loki, Tempo, Alertmanager)
# 3. Deploys metrics infrastructure
# 4. Instruments applications
# 5. Sets up logging (Loki + Promtail)
# 6. Configures tracing (Tempo + OpenTelemetry)
# 7. Creates dashboards
# 8. Configures alerts with PagerDuty
```

---

This workflow orchestrates **observability-specialist**, **sre-specialist**, **kubernetes-expert**, and language-specific agents to deliver production-grade monitoring autonomously.
