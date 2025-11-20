---
id: mermaid-c4-architecture
category: example
tags: [mermaid, c4-model, architecture, system-design, diagrams]
relatedSkills:
  - mermaid-diagram-generation
useWhen:
  - Documenting system architecture with C4 model (Context, Container, Component, Code)
  - Creating hierarchical architecture documentation for stakeholders
  - Visualizing system boundaries and technology containers
---

# Mermaid C4 Architecture Diagrams

Complete examples of C4 model architecture diagrams using Mermaid syntax.

## Level 0: System Context

Shows the system and its relationships with users and external systems.

```mermaid
C4Context
    title System Context for E-Commerce Platform

    Person(customer, "Customer", "End user shopping online")
    Person(admin, "Administrator", "Manages products and orders")

    System(ecommerce, "E-Commerce Platform", "Core shopping system")

    System_Ext(payment, "Payment Gateway", "Stripe API")
    System_Ext(shipping, "Shipping Service", "FedEx/UPS API")
    SystemDb_Ext(analytics, "Analytics Platform", "Google Analytics")

    Rel(customer, ecommerce, "Browse products, place orders", "HTTPS")
    Rel(admin, ecommerce, "Manages inventory", "HTTPS")
    Rel(ecommerce, payment, "Process payments", "REST/JSON")
    Rel(ecommerce, shipping, "Calculate shipping", "REST/JSON")
    Rel(ecommerce, analytics, "Track events", "JavaScript SDK")

    UpdateRelStyle(customer, ecommerce, $textColor="blue", $lineColor="blue")
```

**When to use:**
- Initial architecture documentation
- Explaining system boundaries
- Stakeholder communication
- Medium article: "How [System] fits in the ecosystem"

## Level 1: Container Diagram

Shows major technology containers (applications, databases, file systems).

```mermaid
C4Container
    title Container Diagram for E-Commerce Platform

    Person(customer, "Customer", "End user")
    Person(admin, "Admin", "System administrator")

    System_Boundary(system, "E-Commerce Platform") {
        Container(webapp, "Web Application", "React, TypeScript", "User interface")
        Container(api, "API Server", "Node.js, Express", "Business logic and API")
        Container(worker, "Background Worker", "Python", "Async order processing")
        ContainerDb(db, "Database", "PostgreSQL", "Stores products, orders, users")
        ContainerDb(cache, "Cache", "Redis", "Session and product cache")
        Container(cdn, "Static Assets", "S3 + CloudFront", "Images, CSS, JS")
    }

    System_Ext(payment, "Payment Gateway", "Stripe")
    System_Ext(email, "Email Service", "SendGrid")

    Rel(customer, webapp, "Uses", "HTTPS")
    Rel(admin, webapp, "Manages", "HTTPS")
    Rel(webapp, cdn, "Loads assets from", "HTTPS")
    Rel(webapp, api, "Makes API calls", "JSON/HTTPS")
    Rel(api, db, "Reads/writes", "SQL over TLS")
    Rel(api, cache, "Caches data", "Redis protocol")
    Rel(api, worker, "Enqueues jobs", "Message queue")
    Rel(api, payment, "Processes payments", "HTTPS/API")
    Rel(worker, email, "Sends order confirmations", "HTTPS/API")
    Rel(worker, db, "Updates order status", "SQL over TLS")
```

**When to use:**
- Showing technical architecture
- Deployment planning
- Technology stack explanation
- Medium article: "How we built [System]"

## Level 2: Component Diagram

Shows components within a container and their relationships.

```mermaid
C4Component
    title Component Diagram for API Server

    Container_Boundary(api, "API Server") {
        Component(router, "Router", "Express Router", "Routes requests to controllers")
        Component(authCtrl, "Auth Controller", "Node.js", "Authentication and authorization")
        Component(productCtrl, "Product Controller", "Node.js", "Product CRUD operations")
        Component(orderCtrl, "Order Controller", "Node.js", "Order management")
        Component(validator, "Request Validator", "Joi", "Validates incoming requests")
        Component(cacheManager, "Cache Manager", "Node.js", "Caching abstraction layer")
        Component(dbClient, "Database Client", "Knex.js", "Database query builder")
    }

    ContainerDb(db, "PostgreSQL Database", "PostgreSQL")
    ContainerDb(redis, "Redis Cache", "Redis")
    Container(queue, "Job Queue", "Bull/Redis")

    Rel(router, validator, "Validates all requests")
    Rel(router, authCtrl, "Authenticates user")
    Rel(router, productCtrl, "Product operations")
    Rel(router, orderCtrl, "Order operations")

    Rel(authCtrl, cacheManager, "Check session cache")
    Rel(authCtrl, dbClient, "Fetch user data")

    Rel(productCtrl, cacheManager, "Check product cache")
    Rel(productCtrl, dbClient, "Query products")

    Rel(orderCtrl, dbClient, "Create/update orders")
    Rel(orderCtrl, queue, "Enqueue fulfillment jobs")

    Rel(cacheManager, redis, "Get/Set cached data")
    Rel(dbClient, db, "Execute SQL queries")
```

**When to use:**
- Detailed technical documentation
- Code review preparation
- Onboarding new developers
- Medium article: "Inside the [Component] architecture"

## Level 3: Code Diagram (Class Diagram)

Shows classes, interfaces, and their relationships.

```mermaid
classDiagram
    class OrderController {
        +create(orderData) Order
        +getById(orderId) Order
        +update(orderId, updates) Order
        +cancel(orderId) boolean
        -validateOrder(data) boolean
        -calculateTotal(items) number
    }

    class OrderService {
        +findById(orderId) Order
        +save(order) Order
        +cancel(orderId) boolean
        +getOrdersByUser(userId) Order[]
    }

    class Order {
        +id string
        +userId string
        +items OrderItem[]
        +total number
        +status OrderStatus
        +createdAt Date
        +updatedAt Date
    }

    class OrderItem {
        +productId string
        +quantity number
        +price number
        +subtotal number
    }

    class CacheManager {
        +get(key) any
        +set(key, value, ttl) void
        +invalidate(key) void
        +invalidatePattern(pattern) void
    }

    class DatabaseClient {
        <<interface>>
        +query(sql, params) Result
        +transaction(callback) Result
    }

    class JobQueue {
        <<interface>>
        +enqueue(jobName, data) Job
        +process(jobName, handler) void
    }

    OrderController --> OrderService : uses
    OrderController --> CacheManager : caches with
    OrderService --> DatabaseClient : persists to
    OrderService --> CacheManager : caches with
    OrderController --> JobQueue : enqueues jobs to
    OrderService ..> Order : creates
    Order *-- OrderItem : contains
```

**When to use:**
- Detailed implementation documentation
- Design pattern explanation
- Code refactoring planning

## Microservices Architecture Example

```mermaid
C4Container
    title Microservices Architecture

    System_Boundary(system, "Microservices Ecosystem") {
        Container(api, "API Gateway", "Kong/NGINX", "Routes and authenticates requests")
        Container(authSvc, "Auth Service", "Node.js", "Authentication and JWT")
        Container(userSvc, "User Service", "Go", "User management")
        Container(productSvc, "Product Service", "Python/FastAPI", "Product catalog")
        Container(orderSvc, "Order Service", "Java/Spring", "Order processing")
        Container(notificationSvc, "Notification Service", "Node.js", "Email/SMS")

        ContainerDb(authDb, "Auth DB", "PostgreSQL")
        ContainerDb(userDb, "User DB", "PostgreSQL")
        ContainerDb(productDb, "Product DB", "MongoDB")
        ContainerDb(orderDb, "Order DB", "PostgreSQL")

        Container(msgBroker, "Message Broker", "RabbitMQ", "Event bus")
        ContainerDb(sharedCache, "Shared Cache", "Redis")
    }

    Person(user, "User")

    Rel(user, api, "Makes requests", "HTTPS")
    Rel(api, authSvc, "Authenticates", "gRPC")
    Rel(api, userSvc, "User operations", "REST")
    Rel(api, productSvc, "Product operations", "REST")
    Rel(api, orderSvc, "Order operations", "REST")

    Rel(authSvc, authDb, "Reads/writes")
    Rel(userSvc, userDb, "Reads/writes")
    Rel(productSvc, productDb, "Reads/writes")
    Rel(orderSvc, orderDb, "Reads/writes")

    Rel(authSvc, sharedCache, "Session cache")
    Rel(userSvc, sharedCache, "User cache")
    Rel(productSvc, sharedCache, "Product cache")

    Rel(orderSvc, msgBroker, "Publishes order events")
    Rel(notificationSvc, msgBroker, "Subscribes to events")
    Rel(userSvc, msgBroker, "Subscribes to user events")
```

## Deployment Topology

```mermaid
flowchart TB
    subgraph Internet
        Users[Users/Clients]
    end

    subgraph CDN[CloudFlare CDN]
        CDN1[Edge Servers Worldwide]
    end

    subgraph AWS["AWS (us-east-1)"]
        subgraph ELB[Application Load Balancer]
            LB[ALB]
        end

        subgraph AZ1["Availability Zone 1"]
            App1[App Server 1<br/>EC2 t3.large]
            Worker1[Worker 1<br/>EC2 t3.medium]
        end

        subgraph AZ2["Availability Zone 2"]
            App2[App Server 2<br/>EC2 t3.large]
            Worker2[Worker 2<br/>EC2 t3.medium]
        end

        subgraph AZ3["Availability Zone 3"]
            App3[App Server 3<br/>EC2 t3.large]
        end

        subgraph Data[Data Layer]
            RDS[(RDS PostgreSQL<br/>Multi-AZ<br/>db.r5.xlarge)]
            Redis[(ElastiCache Redis<br/>Cluster Mode<br/>cache.r5.large)]
        end

        subgraph Storage
            S3[S3 Bucket<br/>Static Assets]
        end
    end

    Users --> CDN1
    CDN1 --> LB
    LB --> App1
    LB --> App2
    LB --> App3

    App1 --> RDS
    App2 --> RDS
    App3 --> RDS

    App1 --> Redis
    App2 --> Redis
    App3 --> Redis

    Worker1 --> RDS
    Worker2 --> RDS
    Worker1 --> Redis
    Worker2 --> Redis

    App1 --> S3
    App2 --> S3
    App3 --> S3

    style RDS fill:#2d7a3e
    style Redis fill:#d9534f
    style S3 fill:#f0ad4e
```

**When to use:**
- Infrastructure documentation
- Deployment planning
- Scaling strategy explanation
- Medium article: "How we scale [System]"
