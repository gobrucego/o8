---
description: Generate Mermaid architecture diagrams (C4 L0-L3), data flows, sequence diagrams, and user journey flows from codebase analysis
argument-hint: [scope-or-path] [--type=all|architecture|dataflow|sequence|ux|erd]
model: claude-opus-4-1
---

# Generate Diagrams Workflow

Autonomous generation of visual documentation using Mermaid diagrams for architecture, data flows, and user experiences.

## Intelligence Database Integration

```bash
# Initialize workflow
echo "🎨 Starting Diagram Generation Workflow"
echo "Scope: $1"
echo "Diagram Type: ${2:-all}"
```

---

## Phase 1: Codebase Analysis (0-30%)

**Objective**: Analyze codebase to understand structure, patterns, and flows

**⚡ EXECUTE TASK TOOL:**
```
Use the diagram-specialist agent to:
1. Analyze codebase structure and architecture
2. Identify major components and services
3. Map dependencies and data flows
4. Identify external integrations
5. Understand user journeys and API flows

subagent_type: "orchestr8:visualization:diagram-specialist"
description: "Analyze codebase for diagram generation"
prompt: "Analyze the codebase to prepare for diagram generation:

Scope: $1
Diagram Type: ${2:-all}

Tasks:

1. **Architecture Analysis**
   - Identify architecture pattern (monolith, microservices, serverless, etc.)
   - Find main entry points and applications
   - Map major components and services
   - Identify technology stack
   
   \`\`\`bash
   # Find main applications
   find . -name 'main.*' -o -name 'index.*' -o -name 'app.*' -o -name 'server.*'
   
   # Identify services/modules
   ls -d */ | grep -E '(src|lib|services|api|apps|packages)'
   
   # Check dependencies
   cat package.json requirements.txt pom.xml Cargo.toml go.mod 2>/dev/null
   \`\`\`

2. **Component Mapping**
   - List frontend applications (web, mobile)
   - List backend services/APIs
   - List databases and data stores
   - List external integrations
   - List message queues or event buses

3. **Data Flow Identification**
   - Find API endpoints and routes
   - Identify data transformations
   - Map database operations
   - Track event publishing/consumption

4. **User Journey Analysis**
   - Identify main user flows (authentication, checkout, etc.)
   - Find UI routing and navigation
   - Map decision points and branching

5. **Create Analysis Document**
   Save to '.orchestr8/docs/diagrams/analysis.md' with:
   - Architecture type and pattern
   - Component inventory (frontend, backend, databases, external)
   - Key data flows
   - User journey touchpoints
   - Technology stack summary

Expected outputs:
- .orchestr8/docs/diagrams/analysis.md
- Component and service inventory
- Data flow summary
- User journey outline
"
```

**Expected Outputs:**
- `.orchestr8/docs/diagrams/analysis.md` - Complete codebase analysis

**Quality Gate: Analysis Validation**
```bash
# Validate analysis exists
if [ ! -f ".orchestr8/docs/diagrams/analysis.md" ]; then
  echo "❌ Analysis document not created"
  exit 1
fi

echo "✅ Codebase analysis complete"
```

---

## Phase 2: Architecture Diagram Generation (30-50%)

**Objective**: Generate C4 model architecture diagrams (L0-L3)

**⚡ EXECUTE TASK TOOL:**
```
Use the diagram-specialist agent to:
1. Generate L0 (System Context) diagram
2. Generate L1 (Container) diagram
3. Generate L2 (Component) diagram for key services
4. Optionally generate L3 (Code) diagrams for complex modules

subagent_type: "orchestr8:visualization:diagram-specialist"
description: "Generate C4 architecture diagrams"
prompt: "Generate C4 model architecture diagrams using Mermaid:

Based on .orchestr8/docs/diagrams/analysis.md:

**1. Level 0: System Context Diagram**

Create '.orchestr8/docs/diagrams/architecture-l0-context.md' showing:
- The system boundary
- External actors (users, admins, external systems)
- High-level relationships
- External integrations (payment gateways, email services, etc.)

Example structure:
\`\`\`markdown
# Architecture Diagram - L0 System Context

## Overview
[Brief description of the system and its context]

## Diagram

\`\`\`mermaid
graph TB
    User[User/Customer]
    Admin[Administrator]
    System[Your System Name]
    External1[Payment Gateway]
    External2[Email Service]
    
    User -->|Uses| System
    Admin -->|Manages| System
    System -->|Processes payments| External1
    System -->|Sends emails| External2
    
    style System fill:#1168bd,stroke:#0b4884,color:#fff
    style External1 fill:#999,stroke:#666,color:#fff
    style External2 fill:#999,stroke:#666,color:#fff
\`\`\`

## Key Elements
- **Users**: [Description]
- **System**: [What it does]
- **External Systems**: [List and purpose]
\`\`\`

**2. Level 1: Container Diagram**

Create '.orchestr8/docs/diagrams/architecture-l1-containers.md' showing:
- Frontend applications (web, mobile, desktop)
- Backend services and APIs
- Databases and data stores
- Message queues and caching layers
- Technology choices for each container

Example structure:
\`\`\`markdown
# Architecture Diagram - L1 Containers

## Overview
[Description of major containers and their responsibilities]

## Diagram

\`\`\`mermaid
graph TB
    User[User]
    WebApp[Web Application<br/>Technology: React/Vue/Angular]
    API[API Server<br/>Technology: Node.js/Python/Java]
    Database[(Database<br/>PostgreSQL/MySQL)]
    Cache[(Cache<br/>Redis)]
    
    User -->|HTTPS| WebApp
    WebApp -->|JSON/REST API| API
    API --> Database
    API --> Cache
    
    style WebApp fill:#1168bd,stroke:#0b4884,color:#fff
    style API fill:#1168bd,stroke:#0b4884,color:#fff
    style Database fill:#2d7a3e,stroke:#1a4d25,color:#fff
    style Cache fill:#d9534f,stroke:#a94442,color:#fff
\`\`\`

## Containers
- **Web Application**: [Tech stack and purpose]
- **API Server**: [Tech stack and purpose]
- **Database**: [Type and purpose]
- **Cache**: [Purpose and data cached]
\`\`\`

**3. Level 2: Component Diagrams**

For each major service/container, create component diagrams showing:
- Internal components (controllers, services, repositories)
- Component relationships
- External dependencies

Save to '.orchestr8/docs/diagrams/architecture-l2-[service-name].md'

**4. Level 3: Code Diagrams (Optional)**

For complex modules, create class diagrams showing:
- Key classes and interfaces
- Relationships and dependencies
- Important methods

Save to '.orchestr8/docs/diagrams/architecture-l3-[module-name].md'

Expected outputs:
- .orchestr8/docs/diagrams/architecture-l0-context.md
- .orchestr8/docs/diagrams/architecture-l1-containers.md
- .orchestr8/docs/diagrams/architecture-l2-[service].md (for each major service)
- .orchestr8/docs/diagrams/architecture-l3-[module].md (optional, for complex modules)
"
```

**Expected Outputs:**
- `architecture-l0-context.md` - System context diagram
- `architecture-l1-containers.md` - Container diagram
- `architecture-l2-*.md` - Component diagrams
- `architecture-l3-*.md` - Code diagrams (optional)

**Quality Gate: Architecture Diagrams Validation**
```bash
# Validate L0 exists
if [ ! -f ".orchestr8/docs/diagrams/architecture-l0-context.md" ]; then
  echo "❌ L0 diagram not created"
  exit 1
fi

# Validate L1 exists
if [ ! -f ".orchestr8/docs/diagrams/architecture-l1-containers.md" ]; then
  echo "❌ L1 diagram not created"
  exit 1
fi

echo "✅ Architecture diagrams generated"
```

---

## Phase 3: Data Flow Diagram Generation (50-70%)

**Objective**: Generate data flow diagrams showing data movement through the system

**⚡ EXECUTE TASK TOOL:**
```
Use the diagram-specialist agent to:
1. Generate overall system data flow
2. Generate specific flow diagrams for key processes
3. Show data transformations and validations

subagent_type: "orchestr8:visualization:diagram-specialist"
description: "Generate data flow diagrams"
prompt: "Generate data flow diagrams using Mermaid:

Based on .orchestr8/docs/diagrams/analysis.md:

**1. Overall Data Flow**

Create '.orchestr8/docs/diagrams/data-flow-system.md' showing:
- How data enters the system
- Major transformation points
- Data storage locations
- Data exits (APIs, reports, exports)

Example structure:
\`\`\`markdown
# Data Flow - System Overview

## Overview
[Description of how data moves through the system]

## Diagram

\`\`\`mermaid
graph LR
    Input[User Input] -->|Validation| Validator[Input Validator]
    Validator -->|Valid Data| Logic[Business Logic]
    Validator -->|Errors| ErrorHandler[Error Handler]
    Logic -->|Transform| Mapper[Data Mapper]
    Mapper -->|Persist| DB[(Database)]
    Logic -->|Publish| Queue[Event Queue]
    Queue --> Analytics[Analytics Service]
    
    style Logic fill:#1168bd,stroke:#0b4884,color:#fff
    style DB fill:#2d7a3e,stroke:#1a4d25,color:#fff
    style Queue fill:#f0ad4e,stroke:#eea236,color:#fff
\`\`\`

## Data Flow Steps
1. **Input**: [How data enters]
2. **Validation**: [What validations occur]
3. **Processing**: [Business logic applied]
4. **Storage**: [Where data is stored]
5. **Events**: [Events published]
\`\`\`

**2. Process-Specific Data Flows**

For key business processes (e.g., user registration, order processing, payment flow):
Create '.orchestr8/docs/diagrams/data-flow-[process-name].md' for each

Example processes to diagram:
- User authentication flow
- Order/transaction processing
- Data synchronization
- Batch processing jobs
- API request/response cycle

Expected outputs:
- .orchestr8/docs/diagrams/data-flow-system.md
- .orchestr8/docs/diagrams/data-flow-[process].md (for each key process)
"
```

**Expected Outputs:**
- `data-flow-system.md` - Overall system data flow
- `data-flow-*.md` - Process-specific flows

**Quality Gate: Data Flow Diagrams Validation**
```bash
# Validate system data flow exists
if [ ! -f ".orchestr8/docs/diagrams/data-flow-system.md" ]; then
  echo "❌ System data flow diagram not created"
  exit 1
fi

echo "✅ Data flow diagrams generated"
```

---

## Phase 4: Sequence Diagram Generation (70-85%)

**Objective**: Generate sequence diagrams for API interactions and async processes

**⚡ EXECUTE TASK TOOL:**
```
Use the diagram-specialist agent to:
1. Generate API sequence diagrams
2. Generate async workflow sequences
3. Show timing and interactions between components

subagent_type: "orchestr8:visualization:diagram-specialist"
description: "Generate sequence diagrams"
prompt: "Generate sequence diagrams using Mermaid:

Based on .orchestr8/docs/diagrams/analysis.md:

**API Interaction Sequences**

For each major API endpoint or workflow, create sequence diagrams showing:
- Request/response flow
- Service interactions
- Database operations
- Error handling

Save to '.orchestr8/docs/diagrams/sequence-[api-name].md'

Example structure:
\`\`\`markdown
# Sequence Diagram - [API/Process Name]

## Overview
[Brief description of the interaction]

## Diagram

\`\`\`mermaid
sequenceDiagram
    participant User
    participant WebApp
    participant API
    participant Service
    participant Database
    
    User->>WebApp: Click action
    WebApp->>API: POST /endpoint
    API->>Service: processRequest(data)
    Service->>Database: Query/Insert
    Database-->>Service: Result
    Service-->>API: Response
    API-->>WebApp: 200 OK
    WebApp-->>User: Show result
\`\`\`

## Flow Steps
1. **User Action**: [Description]
2. **API Call**: [Endpoint and method]
3. **Processing**: [Business logic]
4. **Database**: [Operations performed]
5. **Response**: [What's returned]

## Error Scenarios
[How errors are handled]
\`\`\`

**Key Sequences to Generate:**
- Authentication/login flow
- Main business transactions
- Background job processing
- Event-driven workflows
- Third-party API integrations

Expected outputs:
- .orchestr8/docs/diagrams/sequence-[interaction].md (for each key interaction)
"
```

**Expected Outputs:**
- `sequence-*.md` - API and process sequence diagrams

**Quality Gate: Sequence Diagrams Validation**
```bash
# Count sequence diagrams
SEQ_COUNT=$(ls .orchestr8/docs/diagrams/sequence-*.md 2>/dev/null | wc -l)
if [ "$SEQ_COUNT" -eq 0 ]; then
  echo "⚠️  No sequence diagrams generated"
else
  echo "✅ Sequence diagrams generated ($SEQ_COUNT diagrams)"
fi
```

---

## Phase 5: User Journey Flow Generation (85-95%)

**Objective**: Generate user experience and journey flow diagrams

**⚡ EXECUTE TASK TOOL:**
```
Use the diagram-specialist agent to:
1. Generate main user journey flows
2. Show decision points and branching
3. Highlight happy paths and error scenarios

subagent_type: "orchestr8:visualization:diagram-specialist"
description: "Generate user journey flows"
prompt: "Generate user journey flow diagrams using Mermaid:

Based on .orchestr8/docs/diagrams/analysis.md:

**User Journey Flows**

For each major user journey, create flowcharts showing:
- Entry points
- Decision points
- Actions and outcomes
- Error paths
- Success states

Save to '.orchestr8/docs/diagrams/ux-[journey-name].md'

Example structure:
\`\`\`markdown
# User Journey - [Journey Name]

## Overview
[Description of the user journey]

## Diagram

\`\`\`mermaid
graph TD
    Start([User arrives]) --> Action1[First Action]
    Action1 --> Decision{Decision?}
    Decision -->|Option A| PathA[Path A]
    Decision -->|Option B| PathB[Path B]
    PathA --> Success([Success])
    PathB --> Error[Error State]
    Error --> Retry{Retry?}
    Retry -->|Yes| Action1
    Retry -->|No| End([Exit])
    
    style Start fill:#5bc0de,stroke:#46b8da,color:#fff
    style Success fill:#5cb85c,stroke:#4cae4c,color:#fff
    style Error fill:#d9534f,stroke:#a94442,color:#fff
\`\`\`

## Journey Steps
1. **Entry**: [How user enters this flow]
2. **Key Actions**: [Main actions user takes]
3. **Decision Points**: [Where user makes choices]
4. **Success Path**: [Happy path outcome]
5. **Error Handling**: [What happens on errors]

## Pain Points
[Potential UX issues or friction points]
\`\`\`

**Key Journeys to Generate:**
- User onboarding/registration
- Main workflow (e.g., checkout, booking, submission)
- Account management
- Search and discovery
- Error recovery flows

Expected outputs:
- .orchestr8/docs/diagrams/ux-[journey].md (for each user journey)
"
```

**Expected Outputs:**
- `ux-*.md` - User journey flow diagrams

**Quality Gate: User Journey Validation**
```bash
# Count UX diagrams
UX_COUNT=$(ls .orchestr8/docs/diagrams/ux-*.md 2>/dev/null | wc -l)
if [ "$UX_COUNT" -eq 0 ]; then
  echo "⚠️  No user journey diagrams generated"
else
  echo "✅ User journey diagrams generated ($UX_COUNT diagrams)"
fi
```

---

## Phase 6: Additional Diagrams & Documentation (95-100%)

**Objective**: Generate ERDs, state machines, deployment diagrams, and summary documentation

**⚡ EXECUTE TASK TOOL:**
```
Use the diagram-specialist agent to:
1. Generate Entity Relationship Diagram (ERD) for database schema
2. Generate state machine diagrams for workflows
3. Generate deployment/infrastructure diagram
4. Create summary index document

subagent_type: "orchestr8:visualization:diagram-specialist"
description: "Generate additional diagrams and documentation"
prompt: "Generate additional diagrams and create summary documentation:

Based on .orchestr8/docs/diagrams/analysis.md:

**1. Entity Relationship Diagram**

If database schema is identifiable, create '.orchestr8/docs/diagrams/erd-database-schema.md':

\`\`\`markdown
# Entity Relationship Diagram - Database Schema

## Overview
[Description of database structure]

## Diagram

\`\`\`mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER {
        uuid id PK
        string email UK
        string name
    }
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER {
        uuid id PK
        uuid user_id FK
        string status
    }
    ORDER_ITEM }o--|| PRODUCT : references
    ORDER_ITEM {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
    }
\`\`\`

## Tables
[List of tables and their purpose]

## Key Relationships
[Important relationships explained]
\`\`\`

**2. State Machine Diagrams**

For workflows with state transitions, create '.orchestr8/docs/diagrams/state-[workflow].md'

**3. Deployment Diagram**

Create '.orchestr8/docs/diagrams/deployment-infrastructure.md' showing:
- Cloud provider and regions
- Network topology
- Services and their deployment
- Load balancers, CDNs
- Monitoring and logging

**4. Summary Index**

Create '.orchestr8/docs/diagrams/README.md' with:
\`\`\`markdown
# Architecture Diagrams

Generated on $(date +%Y-%m-%d)

## Architecture Diagrams (C4 Model)

### Level 0: System Context
[Link to architecture-l0-context.md] - Shows the big picture

### Level 1: Containers
[Link to architecture-l1-containers.md] - Shows applications and databases

### Level 2: Components
[Links to component diagrams] - Internal structure of services

### Level 3: Code
[Links to code diagrams] - Class and module details

## Data Flow Diagrams

[List of data flow diagrams with descriptions]

## Sequence Diagrams

[List of sequence diagrams with descriptions]

## User Journey Flows

[List of UX flow diagrams with descriptions]

## Database & Infrastructure

- [Entity Relationship Diagram]
- [State Machine Diagrams]
- [Deployment Diagram]

## How to View

These diagrams use Mermaid syntax. View them in:
- GitHub (renders automatically)
- VS Code with Mermaid extension
- [Mermaid Live Editor](https://mermaid.live)

## Updating Diagrams

To regenerate diagrams:
\`\`\`bash
/orchestr8:generate-diagrams [scope]
\`\`\`
\`\`\`

Expected outputs:
- .orchestr8/docs/diagrams/erd-database-schema.md (if applicable)
- .orchestr8/docs/diagrams/state-*.md (if workflows exist)
- .orchestr8/docs/diagrams/deployment-infrastructure.md (if identifiable)
- .orchestr8/docs/diagrams/README.md (index of all diagrams)
"
```

**Expected Outputs:**
- `erd-database-schema.md` - Database ERD
- `state-*.md` - State machine diagrams
- `deployment-infrastructure.md` - Infrastructure diagram
- `README.md` - Index of all diagrams

**Quality Gate: Final Validation**
```bash
# Validate README exists
if [ ! -f ".orchestr8/docs/diagrams/README.md" ]; then
  echo "❌ Diagram index (README.md) not created"
  exit 1
fi

# Count total diagrams
TOTAL_DIAGRAMS=$(ls .orchestr8/docs/diagrams/*.md 2>/dev/null | grep -v README | wc -l)

echo "✅ Diagram generation complete"
echo "📊 Total diagrams created: $TOTAL_DIAGRAMS"
```

---

## Workflow Complete

```bash
echo "
✅ DIAGRAM GENERATION COMPLETE

Scope: $1

Generated Diagrams:
$(ls -1 .orchestr8/docs/diagrams/*.md | sed 's|.orchestr8/docs/diagrams/||')

Diagram Categories:
- 🏗️  Architecture (C4 Model L0-L3)
- 🔄 Data Flows
- ⏱️  Sequence Diagrams
- 👤 User Journey Flows
- 📊 Entity Relationships
- 🚀 Deployment/Infrastructure

Location: .orchestr8/docs/diagrams/

View diagrams:
- GitHub (automatic rendering)
- VS Code with Mermaid extension
- Mermaid Live Editor: https://mermaid.live

Next Steps:
1. Review diagrams in .orchestr8/docs/diagrams/
2. Include diagrams in documentation
3. Keep diagrams updated as system evolves
4. Share with team for better understanding

Happy visualizing! 🎨
"
```

---

## Success Criteria Checklist

- ✅ Codebase analyzed and documented
- ✅ L0 (System Context) diagram created
- ✅ L1 (Container) diagram created
- ✅ L2 (Component) diagrams for major services
- ✅ Data flow diagrams generated
- ✅ Sequence diagrams for key interactions
- ✅ User journey flows documented
- ✅ ERD created (if applicable)
- ✅ State machines documented (if applicable)
- ✅ Deployment diagram created (if applicable)
- ✅ All diagrams use valid Mermaid syntax
- ✅ Diagrams render correctly
- ✅ Summary index (README) created
- ✅ Diagrams saved to .orchestr8/docs/diagrams/

---

## Example Invocations

### Generate All Diagrams
```bash
/orchestr8:generate-diagrams .
```

### Generate Only Architecture Diagrams
```bash
/orchestr8:generate-diagrams . --type=architecture
```

### Generate for Specific Service
```bash
/orchestr8:generate-diagrams src/services/payment
```

### Generate Data Flow Only
```bash
/orchestr8:generate-diagrams . --type=dataflow
```

### Generate UX Flows Only
```bash
/orchestr8:generate-diagrams . --type=ux
```

---

Transform code into clear visual documentation that enhances understanding and communication across your team.
