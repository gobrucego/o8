---
name: build-ml-pipeline
description: Autonomous ML pipeline creation from data ingestion to model deployment with monitoring. Coordinates data engineering, ML training, MLOps deployment, and observability for end-to-end ML systems.
---

# Build ML Pipeline Workflow

Autonomous end-to-end ML pipeline development from raw data to production deployment.

## Phases

### Phase 1: Requirements & Design (15-20 min)
**Objective**: Understand ML problem and design solution architecture

**Tasks**:
1. **Analyze ML Requirements**
   - Problem type (classification, regression, clustering, etc.)
   - Business metrics and success criteria
   - Data sources and availability
   - Performance requirements (latency, throughput)
   - Compliance requirements (GDPR, model explainability)

2. **Design ML Architecture**
   - Data pipeline architecture (batch vs streaming)
   - Feature engineering strategy
   - Model selection approach
   - Training infrastructure (local, cloud, distributed)
   - Deployment strategy (real-time API, batch predictions)
   - Monitoring and retraining triggers

3. **Define Success Metrics**
   - ML metrics (accuracy, precision, recall, F1, AUC-ROC)
   - Business metrics (conversion rate, revenue impact)
   - Operational metrics (latency p95, throughput)
   - Data quality metrics (completeness, freshness)

**Agents**: `requirements-analyzer`, `architect`, `ml-engineer`

**Deliverables**:
- Architecture diagram
- Tech stack selection
- ML metrics definition
- Project plan with milestones

---

### Phase 2: Data Pipeline Development (30-45 min)
**Objective**: Build robust data ingestion and feature engineering pipelines

**Tasks**:
1. **Data Ingestion**
   - Set up data sources (databases, APIs, S3, Kafka)
   - Implement data validation (schema checks, completeness)
   - Create data versioning (DVC, Delta Lake)
   - Schedule data refresh (Airflow DAGs)

2. **Feature Engineering**
   - Exploratory data analysis (EDA)
   - Feature creation and transformations
   - Feature selection and importance analysis
   - Handle missing values and outliers
   - Create train/validation/test splits

3. **Data Quality Framework**
   - Implement data quality checks (Great Expectations)
   - Monitor data drift detection
   - Create data quality dashboards
   - Set up alerting for data issues

**Agents**: `data-engineer`, `ml-engineer`

**Code Examples**:
```python
# Airflow DAG for data pipeline
from airflow import DAG
from airflow.operators.python import PythonOperator

dag = DAG(
    'ml_data_pipeline',
    schedule_interval='0 2 * * *',
    catchup=False
)

extract_task = PythonOperator(
    task_id='extract_data',
    python_callable=extract_from_sources,
    dag=dag
)

validate_task = PythonOperator(
    task_id='validate_data',
    python_callable=validate_data_quality,
    dag=dag
)

feature_task = PythonOperator(
    task_id='create_features',
    python_callable=engineer_features,
    dag=dag
)

extract_task >> validate_task >> feature_task
```

**Deliverables**:
- Data ingestion pipeline
- Feature engineering code
- Data quality checks
- Airflow DAGs

---

### Phase 3: Model Training & Experimentation (45-60 min)
**Objective**: Train and optimize ML models with experiment tracking

**Tasks**:
1. **Baseline Model**
   - Implement simple baseline (mean/median predictor)
   - Establish baseline performance metrics
   - Create evaluation framework

2. **Model Development**
   - Train multiple model types (linear, tree-based, neural networks)
   - Hyperparameter optimization (Optuna, GridSearch)
   - Cross-validation and evaluation
   - Feature importance analysis

3. **Experiment Tracking**
   - Track all experiments with MLflow
   - Log parameters, metrics, artifacts
   - Compare model performance
   - Version control for models

4. **Model Interpretability**
   - SHAP values for global interpretability
   - LIME for local explanations
   - Feature importance visualization
   - Model cards documentation

**Agents**: `ml-engineer`, `data-engineer`

**Code Examples**:
```python
import mlflow
import optuna

def objective(trial):
    params = {
        'n_estimators': trial.suggest_int('n_estimators', 100, 500),
        'max_depth': trial.suggest_int('max_depth', 3, 15),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3)
    }

    with mlflow.start_run(nested=True):
        mlflow.log_params(params)

        model = XGBClassifier(**params)
        model.fit(X_train, y_train)

        score = f1_score(y_val, model.predict(X_val))
        mlflow.log_metric('f1_score', score)

    return score

study = optuna.create_study(direction='maximize')
study.optimize(objective, n_trials=100)
```

**Deliverables**:
- Trained models (multiple candidates)
- Experiment tracking dashboard
- Model evaluation reports
- Model interpretability artifacts

---

### Phase 4: MLOps & Deployment (30-45 min)
**Objective**: Deploy model to production with CI/CD and monitoring

**Tasks**:
1. **Model Registry**
   - Register best model in MLflow
   - Version management
   - Model staging (dev → staging → production)
   - Model metadata and lineage

2. **Model Serving**
   - Create prediction API (FastAPI/Flask)
   - Containerize with Docker
   - Deploy to Kubernetes
   - Set up auto-scaling (HPA)
   - Configure load balancing

3. **CI/CD Pipeline**
   - Automated testing (unit, integration)
   - Model validation on hold-out set
   - Performance regression tests
   - Automated deployment to staging
   - Manual approval gate for production

4. **A/B Testing Setup**
   - Implement multi-armed bandit or A/B framework
   - Traffic splitting configuration
   - Statistical significance testing
   - Automated rollback on performance degradation

**Agents**: `mlops-specialist`, `kubernetes-expert`, `ci-cd-engineer`

**Code Examples**:
```python
# FastAPI model serving
from fastapi import FastAPI
import mlflow.pyfunc

app = FastAPI()
model = mlflow.pyfunc.load_model("models:/customer_churn/Production")

@app.post("/predict")
async def predict(features: PredictionRequest):
    predictions = model.predict(features.data)
    return {"predictions": predictions.tolist()}

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

```yaml
# Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-model-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: model-api
        image: myregistry/ml-model:v1.0
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ml-model-hpa
spec:
  scaleTargetRef:
    kind: Deployment
    name: ml-model-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**Deliverables**:
- Containerized model API
- Kubernetes manifests
- CI/CD pipelines
- A/B testing framework

---

### Phase 5: Monitoring & Observability (20-30 min)
**Objective**: Comprehensive monitoring for ML models in production

**Tasks**:
1. **Prediction Monitoring**
   - Log all predictions with features and outputs
   - Track prediction latency (p50, p95, p99)
   - Monitor prediction confidence scores
   - Alert on anomalous predictions

2. **Model Performance Monitoring**
   - Track online metrics vs offline metrics
   - Monitor for model drift and degradation
   - Compare A/B test variants
   - Alert on performance drops

3. **Data Drift Detection**
   - Monitor input feature distributions
   - Detect covariate shift
   - Concept drift detection
   - Alert on significant drift

4. **Dashboards & Alerting**
   - Grafana dashboards for model metrics
   - Prometheus alerts for degradation
   - PagerDuty integration for critical issues
   - Weekly performance reports

**Agents**: `observability-specialist`, `mlops-specialist`

**Code Examples**:
```python
# Prometheus metrics for ML
from prometheus_client import Counter, Histogram

prediction_counter = Counter(
    'ml_predictions_total',
    'Total predictions',
    ['model_version', 'prediction_class']
)

prediction_latency = Histogram(
    'ml_prediction_latency_seconds',
    'Prediction latency',
    buckets=[0.001, 0.01, 0.05, 0.1, 0.5, 1.0]
)

prediction_confidence = Histogram(
    'ml_prediction_confidence',
    'Prediction confidence scores',
    buckets=[0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99]
)

# Monitor predictions
@app.post("/predict")
async def predict(request: PredictionRequest):
    start = time.time()

    predictions = model.predict(request.features)
    confidence = np.max(predictions, axis=1)

    # Log metrics
    prediction_latency.observe(time.time() - start)
    prediction_counter.labels(
        model_version='v1.0',
        prediction_class=str(predictions[0])
    ).inc()
    prediction_confidence.observe(confidence[0])

    return {"predictions": predictions.tolist()}
```

**Deliverables**:
- Monitoring dashboards
- Alerting rules
- Data drift detection
- Performance tracking

---

### Phase 6: Continuous Training (15-20 min)
**Objective**: Automated model retraining and deployment

**Tasks**:
1. **Retraining Triggers**
   - Schedule-based retraining (weekly/monthly)
   - Performance-based triggers (accuracy drop > 5%)
   - Data drift triggers (distribution shift detected)
   - Manual triggers via API

2. **Automated Retraining Pipeline**
   - Fetch latest training data
   - Retrain model with same pipeline
   - Evaluate on validation set
   - Register new model version
   - A/B test new vs current model

3. **Automated Deployment**
   - Canary deployment (5% traffic)
   - Monitor performance for 24h
   - Gradual rollout (5% → 25% → 50% → 100%)
   - Automated rollback on degradation

**Agents**: `mlops-specialist`, `data-engineer`, `sre-specialist`

**Code Examples**:
```python
# Airflow DAG for continuous training
from airflow import DAG
from airflow.operators.python import PythonOperator

def check_retraining_needed():
    """Check if model needs retraining"""
    current_performance = get_current_f1_score()
    baseline_performance = 0.85

    if current_performance < baseline_performance - 0.05:
        return True
    return False

def trigger_retraining():
    """Trigger Kubeflow pipeline for retraining"""
    from kfp import Client
    client = Client(host='http://kubeflow:8080')
    client.create_run_from_pipeline_func(ml_training_pipeline)

dag = DAG(
    'continuous_ml_training',
    schedule_interval='0 2 * * 0',  # Weekly
    catchup=False
)

check_task = PythonOperator(
    task_id='check_performance',
    python_callable=check_retraining_needed,
    dag=dag
)

retrain_task = PythonOperator(
    task_id='trigger_retraining',
    python_callable=trigger_retraining,
    dag=dag
)

check_task >> retrain_task
```

**Deliverables**:
- Continuous training pipeline
- Automated deployment workflow
- Rollback mechanisms

---

## Quality Gates

Before proceeding to next phase, ensure:

**Data Pipeline Quality Gate**:
- [ ] Data validation passing (100% schema compliance)
- [ ] Data quality checks passing (>95% completeness)
- [ ] Feature engineering tested
- [ ] Pipeline can run end-to-end

**Model Training Quality Gate**:
- [ ] Model performance exceeds baseline by >10%
- [ ] Cross-validation scores consistent (std < 0.05)
- [ ] Model explainability artifacts generated
- [ ] All experiments tracked in MLflow

**Deployment Quality Gate**:
- [ ] Model API tests passing (unit + integration)
- [ ] Latency requirements met (p95 < 100ms)
- [ ] Load testing passed (1000 req/s)
- [ ] Security scan clean (no vulnerabilities)

**Monitoring Quality Gate**:
- [ ] All metrics instrumented
- [ ] Dashboards created and validated
- [ ] Alerts configured and tested
- [ ] On-call runbook created

---

## Success Criteria

The ML pipeline is complete when:

1. **Functional**:
   - End-to-end pipeline runs automatically
   - Model serves predictions in production
   - Continuous training working

2. **Performance**:
   - Model meets accuracy targets
   - API latency < requirements
   - System handles required throughput

3. **Operational**:
   - Monitoring dashboards live
   - Alerts firing correctly
   - On-call runbook documented
   - Data quality checks automated

4. **Maintained**:
   - Code in version control
   - CI/CD pipelines operational
   - Documentation complete
   - Team trained on system

---

## Rollback Plan

If issues detected:

1. **Immediate**: Route traffic to previous model version
2. **Investigate**: Check logs, metrics, traces
3. **Fix**: Correct issue in development
4. **Validate**: Test fix in staging environment
5. **Deploy**: Gradual rollout with monitoring

---

## Example Invocation

```bash
# User request
"Build an ML pipeline to predict customer churn. We have user activity data in PostgreSQL,
need real-time predictions via API, and want automated retraining weekly."

# Workflow executes:
# 1. Analyzes requirements (classification, real-time API, weekly retraining)
# 2. Designs architecture (Airflow + Spark + MLflow + Kubernetes)
# 3. Builds data pipeline (PostgreSQL → feature engineering → training data)
# 4. Trains models (XGBoost, Random Forest, Neural Network)
# 5. Deploys best model (FastAPI + Docker + Kubernetes)
# 6. Sets up monitoring (Prometheus + Grafana)
# 7. Implements continuous training (Airflow weekly DAG)
```

---

## Post-Deployment

After deployment:
- Monitor model performance for 7 days
- Conduct A/B test analysis
- Schedule postmortem/retrospective
- Document lessons learned
- Plan next iteration improvements

---

This workflow orchestrates **data-engineer**, **ml-engineer**, **mlops-specialist**, **observability-specialist**, and **sre-specialist** to deliver production-grade ML systems autonomously.
