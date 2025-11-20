---
id: mermaid-sequence-flow
category: example
tags: [mermaid, sequence-diagrams, flowcharts, data-flow, state-machines]
relatedSkills:
  - mermaid-diagram-generation
useWhen:
  - Documenting API interactions and request flows
  - Visualizing async workflows and message passing
  - Creating state machine diagrams for process lifecycles
  - Explaining timing and order of operations
---

# Mermaid Sequence and Flow Diagrams

Complete examples of sequence diagrams, flowcharts, and state machines using Mermaid.

## Sequence Diagrams

### API Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant AuthService
    participant Database

    User->>Frontend: Enter credentials
    Frontend->>API: POST /auth/login {email, password}
    activate API

    API->>AuthService: validateCredentials()
    activate AuthService

    AuthService->>Database: SELECT user WHERE email=?
    Database-->>AuthService: User data

    AuthService->>AuthService: verifyPassword(hash, input)

    alt Password valid
        AuthService-->>API: Valid + user data
        deactivate AuthService

        API->>API: generateJWT(user)
        API-->>Frontend: 200 OK + {token, user}
        deactivate API

        Frontend->>Frontend: Store token in localStorage
        Frontend-->>User: Redirect to dashboard
    else Password invalid
        AuthService-->>API: Invalid credentials
        deactivate AuthService
        API-->>Frontend: 401 Unauthorized
        deactivate API
        Frontend-->>User: Show error message
    end
```

### Async Job Processing Workflow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Queue
    participant Worker
    participant Storage
    participant NotificationSvc

    Client->>API: POST /process-file (large file)
    activate API

    API->>API: Validate file
    API->>Queue: Enqueue {jobId, fileUrl, userId}
    API-->>Client: 202 Accepted {jobId, status: pending}
    deactivate API

    Note over Queue,Worker: Async processing begins

    Worker->>Queue: Poll for jobs
    Queue-->>Worker: Job data {jobId, fileUrl, userId}
    activate Worker

    Worker->>Worker: Download file
    Worker->>Worker: Process file (heavy computation)
    Worker->>Storage: Upload result
    Storage-->>Worker: Success {resultUrl}

    Worker->>API: PATCH /jobs/{jobId} {status: completed}
    Worker->>NotificationSvc: Send completion notification
    deactivate Worker

    NotificationSvc->>Client: Email: "Processing complete"

    Note over Client,API: Client polls for status

    Client->>API: GET /jobs/{jobId}
    API-->>Client: 200 OK {status: completed, resultUrl}
```

### Distributed Transaction (Saga Pattern)

```mermaid
sequenceDiagram
    participant OrderSvc
    participant PaymentSvc
    participant InventorySvc
    participant ShippingSvc
    participant EventBus

    Note over OrderSvc,EventBus: Happy path - all succeed

    OrderSvc->>EventBus: OrderCreated event
    activate OrderSvc

    EventBus->>PaymentSvc: Process payment
    activate PaymentSvc
    PaymentSvc-->>EventBus: PaymentCompleted
    deactivate PaymentSvc

    EventBus->>InventorySvc: Reserve inventory
    activate InventorySvc
    InventorySvc-->>EventBus: InventoryReserved
    deactivate InventorySvc

    EventBus->>ShippingSvc: Create shipment
    activate ShippingSvc
    ShippingSvc-->>EventBus: ShipmentCreated
    deactivate ShippingSvc

    EventBus->>OrderSvc: All steps completed
    OrderSvc->>OrderSvc: Mark order as confirmed
    deactivate OrderSvc

    Note over OrderSvc,EventBus: Failure case - rollback

    OrderSvc->>EventBus: OrderCreated event
    activate OrderSvc

    EventBus->>PaymentSvc: Process payment
    activate PaymentSvc
    PaymentSvc-->>EventBus: PaymentCompleted
    deactivate PaymentSvc

    EventBus->>InventorySvc: Reserve inventory
    activate InventorySvc
    InventorySvc-->>EventBus: InventoryFailed (out of stock)
    deactivate InventorySvc

    Note over OrderSvc,EventBus: Compensating transactions

    EventBus->>PaymentSvc: Refund payment
    activate PaymentSvc
    PaymentSvc-->>EventBus: PaymentRefunded
    deactivate PaymentSvc

    EventBus->>OrderSvc: Order failed
    OrderSvc->>OrderSvc: Mark order as failed
    deactivate OrderSvc
```

## Flowcharts and Data Flows

### Request Processing with Caching

```mermaid
flowchart LR
    User[User Request] --> API[API Gateway]
    API --> Auth{Authenticated?}
    Auth -->|Yes| RateLimit{Rate limit OK?}
    Auth -->|No| Error401[Return 401]

    RateLimit -->|OK| Cache{In Cache?}
    RateLimit -->|Exceeded| Error429[Return 429]

    Cache -->|Hit| Transform1[Transform cached data]
    Cache -->|Miss| Validate{Valid request?}

    Validate -->|Yes| DB[(Database)]
    Validate -->|No| Error400[Return 400]

    DB --> Transform2[Transform data]
    Transform2 --> Store[Update cache]
    Store --> Response2[Return response]

    Transform1 --> Response1[Return response]

    Response1 --> User
    Response2 --> User
    Error401 --> User
    Error429 --> User
    Error400 --> User

    style Auth fill:#5bc0de
    style Cache fill:#f0ad4e
    style DB fill:#2d7a3e
    style RateLimit fill:#d9534f
```

### Complex Processing Pipeline with Swimlanes

```mermaid
flowchart TB
    subgraph Client Layer
        A[User Action] --> B[Frontend App]
    end

    subgraph API Gateway
        B --> C{Route Request}
        C -->|/auth/*| D[Auth Routes]
        C -->|/api/*| E[API Routes]
        C -->|/webhook/*| F[Webhook Routes]
    end

    subgraph Auth Service
        D --> G[Validate Token]
        G --> H{Valid?}
        H -->|Yes| I[User Context]
        H -->|No| J[Return 401]
    end

    subgraph Business Logic
        E --> K[Business Rules]
        I --> K
        K --> L{Action Type}
        L -->|Read| M[Query Service]
        L -->|Write| N[Command Service]
    end

    subgraph Data Layer
        M --> O[(Read Replica DB)]
        N --> P[(Primary DB)]
        N --> Q[Event Store]
    end

    subgraph Async Processing
        Q --> R[Message Queue]
        R --> S[Worker Pool]
        S --> T[Background Jobs]
    end

    subgraph Response Path
        O --> U[Data Transform]
        P --> U
        U --> V[API Response]
        V --> B
    end

    T --> W[Notifications]
    W --> X[Email/SMS Service]

    style G fill:#5bc0de
    style K fill:#1168bd
    style O fill:#2d7a3e
    style P fill:#2d7a3e
    style R fill:#f0ad4e
```

## State Machines

### Order Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Pending: Order created

    Pending --> PaymentProcessing: Payment initiated
    Pending --> Cancelled: User cancels

    PaymentProcessing --> PaymentFailed: Payment declined
    PaymentProcessing --> Paid: Payment successful

    PaymentFailed --> Pending: Retry payment
    PaymentFailed --> Cancelled: Max retries exceeded

    Paid --> FulfillmentQueued: Ready for fulfillment
    FulfillmentQueued --> Processing: Picked up by worker

    Processing --> Shipped: Items shipped
    Processing --> PartiallyShipped: Some items shipped
    Processing --> Failed: Fulfillment error

    Failed --> Refunding: Initiate refund
    Refunding --> Refunded: Refund completed
    Refunded --> [*]

    Shipped --> InTransit: Carrier confirmed
    PartiallyShipped --> InTransit: Tracking active

    InTransit --> Delivered: Delivered to customer
    InTransit --> DeliveryFailed: Delivery attempt failed

    DeliveryFailed --> InTransit: Retry delivery
    DeliveryFailed --> Returned: Return to sender

    Delivered --> Completed: Customer confirmed
    Delivered --> ReturnRequested: Customer wants return

    ReturnRequested --> Returned: Return approved
    Returned --> Refunding

    Completed --> [*]
    Cancelled --> [*]

    note right of Paid
        Payment captured
        Inventory reserved
    end note

    note right of Shipped
        Tracking number generated
        Customer notified
    end note

    note right of Completed
        Final state
        Cannot be changed
    end note
```

### File Upload State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle

    Idle --> Uploading: User selects file
    Uploading --> Validating: Upload complete
    Uploading --> UploadFailed: Network error

    UploadFailed --> Idle: Reset
    UploadFailed --> Uploading: Retry

    Validating --> ValidationFailed: Invalid file
    Validating --> Processing: File valid

    ValidationFailed --> Idle: User cancels
    ValidationFailed --> Uploading: User fixes + retries

    Processing --> Analyzing: Basic processing done
    Processing --> ProcessingFailed: Error during processing

    ProcessingFailed --> Idle: Cancel and retry
    ProcessingFailed --> Processing: Automatic retry

    Analyzing --> Complete: Analysis successful
    Analyzing --> AnalysisFailed: Analysis error

    AnalysisFailed --> Idle: User cancels
    AnalysisFailed --> Analyzing: Retry analysis

    Complete --> [*]

    note left of Processing
        Heavy computation:
        - Resize images
        - Extract metadata
        - Generate thumbnails
    end note

    note right of Analyzing
        ML processing:
        - Content analysis
        - Classification
        - Tag generation
    end note
```

## Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER ||--o{ REVIEW : writes
    USER {
        uuid id PK
        string email UK
        string name
        string password_hash
        boolean email_verified
        timestamp created_at
        timestamp updated_at
    }

    ORDER ||--|{ ORDER_ITEM : contains
    ORDER ||--o| PAYMENT : has
    ORDER {
        uuid id PK
        uuid user_id FK
        decimal total
        decimal tax
        decimal shipping
        string status
        string shipping_address
        timestamp created_at
        timestamp updated_at
    }

    PRODUCT ||--o{ ORDER_ITEM : "ordered in"
    PRODUCT ||--o{ REVIEW : has
    PRODUCT ||--o{ INVENTORY : tracks
    PRODUCT {
        uuid id PK
        string name
        string sku UK
        text description
        decimal price
        uuid category_id FK
        boolean active
        timestamp created_at
    }

    ORDER_ITEM {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        decimal unit_price
        decimal subtotal
    }

    PAYMENT {
        uuid id PK
        uuid order_id FK
        string payment_method
        string transaction_id UK
        decimal amount
        string status
        timestamp processed_at
    }

    REVIEW {
        uuid id PK
        uuid product_id FK
        uuid user_id FK
        int rating
        text comment
        boolean verified_purchase
        timestamp created_at
    }

    INVENTORY {
        uuid id PK
        uuid product_id FK
        string warehouse_location
        int quantity
        int reserved
        timestamp updated_at
    }

    CATEGORY ||--o{ PRODUCT : contains
    CATEGORY {
        uuid id PK
        string name
        string slug UK
        uuid parent_id FK
    }
```

## Common Patterns

### Caching Strategy Flow

```mermaid
flowchart TD
    Request[Incoming Request] --> CheckCache{Check Cache}
    CheckCache -->|Cache Hit| ValidateExpiry{Expired?}
    CheckCache -->|Cache Miss| FetchDB[Fetch from Database]

    ValidateExpiry -->|Fresh| ReturnCached[Return Cached Data]
    ValidateExpiry -->|Expired| FetchDB

    FetchDB --> Transform[Transform Data]
    Transform --> UpdateCache[Update Cache with TTL]
    UpdateCache --> ReturnFresh[Return Fresh Data]

    ReturnCached --> End[Response]
    ReturnFresh --> End

    style CheckCache fill:#f0ad4e
    style FetchDB fill:#2d7a3e
    style UpdateCache fill:#d9534f
```

### Circuit Breaker Pattern

```mermaid
stateDiagram-v2
    [*] --> Closed: Initial state

    Closed --> Open: Failure threshold exceeded
    Closed --> Closed: Success (reset counter)
    Closed --> Closed: Failure (increment counter)

    Open --> HalfOpen: Timeout elapsed
    Open --> Open: All requests fast-fail

    HalfOpen --> Closed: Success threshold met
    HalfOpen --> Open: Any failure
    HalfOpen --> HalfOpen: Collecting metrics

    note right of Closed
        Normal operation
        Requests pass through
        Track failure rate
    end note

    note right of Open
        Fast-fail mode
        Reject all requests immediately
        Wait for timeout
    end note

    note right of HalfOpen
        Testing if service recovered
        Allow limited requests
        Decide: Closed or Open
    end note
```

These diagrams provide comprehensive examples for documenting systems, APIs, and workflows!
