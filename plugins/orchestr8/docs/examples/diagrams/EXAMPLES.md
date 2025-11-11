# Mermaid Diagram Examples

This document demonstrates the Mermaid diagram generation capabilities available through the `diagram-specialist` agent and `/orchestr8:generate-diagrams` command.

## Quick Start

Generate diagrams for your project:

```bash
# Generate all diagram types
/orchestr8:generate-diagrams .

# Generate only architecture diagrams
/orchestr8:generate-diagrams . --type=architecture

# Generate for specific component
/orchestr8:generate-diagrams src/services/api
```

## Example Diagrams

### 1. System Context (C4 L0)

Shows the big picture - your system and its external dependencies.

```mermaid
graph TB
    User[End User]
    Admin[Administrator]
    System[Orchestr8 Plugin System]
    Claude[Claude AI API]
    GitHub[GitHub API]
    NPM[NPM Registry]
    
    User -->|Uses plugins via| System
    Admin -->|Manages plugins via| System
    System -->|Executes agents with| Claude
    System -->|Fetches code from| GitHub
    System -->|Installs dependencies from| NPM
    
    style System fill:#1168bd,stroke:#0b4884,color:#fff
    style Claude fill:#999,stroke:#666,color:#fff
    style GitHub fill:#999,stroke:#666,color:#fff
    style NPM fill:#999,stroke:#666,color:#fff
```

**Use Case**: High-level overview for stakeholders, architecture reviews, documentation.

---

### 2. Container Diagram (C4 L1)

Shows major applications, services, and data stores.

```mermaid
graph TB
    User[User/Developer]
    
    subgraph "Orchestr8 Plugin"
        CLI[Command-Line Interface]
        AgentLoader[Agent Loader]
        CommandRegistry[Command Registry]
        WorkflowEngine[Workflow Engine]
    end
    
    subgraph "Data Layer"
        AgentFiles[Agent Definitions<br/>Markdown Files]
        CommandFiles[Command Definitions<br/>Markdown Files]
        ConfigDB[(Configuration<br/>JSON/YAML)]
    end
    
    ClaudeAPI[Claude AI API]
    
    User -->|Executes commands| CLI
    CLI --> CommandRegistry
    CommandRegistry --> WorkflowEngine
    WorkflowEngine --> AgentLoader
    AgentLoader --> AgentFiles
    CommandRegistry --> CommandFiles
    WorkflowEngine --> ConfigDB
    WorkflowEngine -->|API calls| ClaudeAPI
    
    style CLI fill:#1168bd,stroke:#0b4884,color:#fff
    style WorkflowEngine fill:#1168bd,stroke:#0b4884,color:#fff
    style AgentLoader fill:#1168bd,stroke:#0b4884,color:#fff
    style ConfigDB fill:#2d7a3e,stroke:#1a4d25,color:#fff
    style AgentFiles fill:#2d7a3e,stroke:#1a4d25,color:#fff
```

**Use Case**: Understanding system architecture, onboarding new developers, technical documentation.

---

### 3. Data Flow Diagram

Shows how data moves through the system.

```mermaid
graph LR
    Input[User Command] -->|Parse| Parser[Command Parser]
    Parser -->|Validate| Validator[Argument Validator]
    Validator -->|Valid| Orchestrator[Workflow Orchestrator]
    Validator -->|Invalid| Error[Error Handler]
    
    Orchestrator -->|Load| AgentLoader[Agent Loader]
    AgentLoader -->|Read| Files[(Agent Files)]
    AgentLoader -->|Return Agent| Orchestrator
    
    Orchestrator -->|Execute| Claude[Claude API]
    Claude -->|Stream Response| ResponseHandler[Response Handler]
    ResponseHandler -->|Format| Output[Formatted Output]
    
    style Orchestrator fill:#1168bd,stroke:#0b4884,color:#fff
    style Files fill:#2d7a3e,stroke:#1a4d25,color:#fff
    style Claude fill:#f0ad4e,stroke:#eea236,color:#fff
```

**Use Case**: Understanding data transformations, debugging data issues, optimization opportunities.

---

### 4. Sequence Diagram

Shows API interactions and timing.

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant CommandRegistry
    participant WorkflowEngine
    participant AgentLoader
    participant ClaudeAPI
    
    User->>CLI: /orchestr8:fix-bug "Issue #123"
    CLI->>CommandRegistry: getCommand("fix-bug")
    CommandRegistry-->>CLI: Command definition
    CLI->>WorkflowEngine: executeWorkflow(command, args)
    
    loop For each phase
        WorkflowEngine->>AgentLoader: loadAgent(agentType)
        AgentLoader-->>WorkflowEngine: Agent instance
        WorkflowEngine->>ClaudeAPI: executeAgent(agent, prompt)
        ClaudeAPI-->>WorkflowEngine: Stream response
        WorkflowEngine->>User: Display progress
    end
    
    WorkflowEngine-->>CLI: Workflow complete
    CLI-->>User: Show summary
```

**Use Case**: API debugging, performance optimization, understanding async workflows.

---

### 5. User Journey Flow

Shows user decision paths and experiences.

```mermaid
graph TD
    Start([Developer needs<br/>to fix bug]) --> Research{Know how<br/>to fix?}
    Research -->|Yes| ManualFix[Fix manually]
    Research -->|No| UseOrchest8[Use /orchestr8:fix-bug]
    
    UseOrchest8 --> Describe[Describe bug]
    Describe --> Execute[Execute command]
    Execute --> Analyze[Orchestr8 analyzes code]
    Analyze --> Implement[Implements fix]
    Implement --> Test[Runs tests]
    
    Test --> TestResult{Tests pass?}
    TestResult -->|Yes| Review[Review changes]
    TestResult -->|No| Retry[Fix test failures]
    Retry --> Test
    
    Review --> Approve{Approve fix?}
    Approve -->|Yes| Commit[Commit changes]
    Approve -->|No| Adjust[Request adjustments]
    Adjust --> Implement
    
    ManualFix --> ManualTest[Manual testing]
    ManualTest --> ManualReview{Works?}
    ManualReview -->|Yes| Commit
    ManualReview -->|No| ManualFix
    
    Commit --> Done([Bug fixed!])
    
    style Start fill:#5bc0de,stroke:#46b8da,color:#fff
    style Done fill:#5cb85c,stroke:#4cae4c,color:#fff
    style UseOrchest8 fill:#1168bd,stroke:#0b4884,color:#fff
```

**Use Case**: UX improvements, identifying pain points, user onboarding.

---

### 6. Entity Relationship Diagram

Shows database schema relationships.

```mermaid
erDiagram
    PLUGIN ||--o{ COMMAND : contains
    PLUGIN ||--o{ AGENT : contains
    PLUGIN ||--o{ SKILL : contains
    PLUGIN {
        string name PK
        string version
        string description
        string author
    }
    COMMAND ||--o{ WORKFLOW_PHASE : defines
    COMMAND {
        string name PK
        string description
        string argumentHint
        string model
    }
    WORKFLOW_PHASE }o--|| AGENT : uses
    WORKFLOW_PHASE {
        int id PK
        string commandName FK
        string agentType FK
        int phaseNumber
        string description
    }
    AGENT {
        string type PK
        string name
        string description
        string model
        json sandbox
    }
    SKILL {
        string name PK
        string description
        string category
    }
```

**Use Case**: Database design, understanding relationships, migration planning.

---

### 7. State Machine Diagram

Shows workflow states and transitions.

```mermaid
stateDiagram-v2
    [*] --> Idle
    
    Idle --> Parsing: User executes command
    Parsing --> Validating: Command parsed
    Parsing --> Error: Parse error
    
    Validating --> LoadingAgent: Arguments valid
    Validating --> Error: Validation failed
    
    LoadingAgent --> ExecutingWorkflow: Agent loaded
    LoadingAgent --> Error: Agent not found
    
    ExecutingWorkflow --> PhaseComplete: Phase finished
    PhaseComplete --> ExecutingWorkflow: More phases
    PhaseComplete --> GeneratingReport: All phases done
    
    GeneratingReport --> Success: Report complete
    
    Error --> Idle: Show error
    Success --> Idle: Show results
    Success --> [*]
```

**Use Case**: Understanding workflow states, debugging state transitions, documenting processes.

---

### 8. Deployment Diagram

Shows infrastructure and deployment topology.

```mermaid
graph TB
    subgraph "Developer Machine"
        VSCode[VS Code]
        ClaudeCLI[Claude CLI]
        LocalFiles[Local Codebase]
    end
    
    subgraph "Orchestr8 Plugin"
        PluginLoader[Plugin Loader]
        AgentRegistry[Agent Registry]
        CommandEngine[Command Engine]
    end
    
    subgraph "External Services"
        ClaudeAPI[Claude AI API<br/>Anthropic]
        GitHubAPI[GitHub API]
        NPMRegistry[NPM Registry]
    end
    
    VSCode --> ClaudeCLI
    ClaudeCLI --> PluginLoader
    PluginLoader --> AgentRegistry
    PluginLoader --> CommandEngine
    
    AgentRegistry --> LocalFiles
    CommandEngine --> LocalFiles
    
    CommandEngine -->|Agent execution| ClaudeAPI
    CommandEngine -->|Code operations| GitHubAPI
    PluginLoader -->|Dependencies| NPMRegistry
    
    style PluginLoader fill:#1168bd,stroke:#0b4884,color:#fff
    style AgentRegistry fill:#1168bd,stroke:#0b4884,color:#fff
    style CommandEngine fill:#1168bd,stroke:#0b4884,color:#fff
    style ClaudeAPI fill:#f0ad4e,stroke:#eea236,color:#fff
```

**Use Case**: Infrastructure documentation, deployment planning, architecture reviews.

---

## Diagram Types Summary

| Type | Purpose | When to Use |
|------|---------|-------------|
| **System Context (L0)** | Big picture view | Stakeholder presentations, high-level docs |
| **Container (L1)** | Apps, services, databases | Architecture reviews, onboarding |
| **Component (L2)** | Internal structure | Detailed technical docs, refactoring |
| **Code (L3)** | Classes and relationships | Deep technical docs, complex modules |
| **Data Flow** | Data movement | Debugging, optimization, understanding flows |
| **Sequence** | Time-based interactions | API debugging, async workflows |
| **User Journey** | User paths and decisions | UX improvements, feature planning |
| **ERD** | Database relationships | Schema design, migrations |
| **State Machine** | States and transitions | Workflow documentation, debugging |
| **Deployment** | Infrastructure topology | DevOps, deployment planning |

---

## Best Practices

### 1. Keep Diagrams Focused
Don't try to show everything in one diagram. Create multiple diagrams for different perspectives.

### 2. Update Regularly
Diagrams become stale. Regenerate after major changes:
```bash
/orchestr8:generate-diagrams . --type=all
```

### 3. Use Consistent Styling
Follow the color scheme:
- **Blue**: Internal systems
- **Gray**: External systems
- **Green**: Databases
- **Red**: Caching
- **Orange**: Queues/Events
- **Light Blue**: User interactions

### 4. Add Context
Every diagram should have:
- Title describing what it shows
- Brief description (1-2 sentences)
- Legend if using custom symbols

### 5. Test Rendering
Verify diagrams render correctly in:
- GitHub (automatic)
- VS Code (Mermaid extension)
- [Mermaid Live Editor](https://mermaid.live)

---

## Integration with Architecture Review

The `/orchestr8:review-architecture` command can now optionally generate diagrams:

```bash
# Architecture review with diagrams
/orchestr8:review-architecture . --with-diagrams

# Just diagrams, no review
/orchestr8:generate-diagrams .
```

---

## Viewing Diagrams

### GitHub
Diagrams render automatically in GitHub Markdown files.

### VS Code
Install the "Markdown Preview Mermaid Support" extension.

### Mermaid Live Editor
1. Copy diagram code
2. Go to https://mermaid.live
3. Paste and edit

---

## Advanced Features

### Custom Themes
Modify node styles for custom branding:
```mermaid
graph LR
    A[Node A] --> B[Node B]
    style A fill:#yourcolor,stroke:#yourstroke,color:#fff
```

### Subgraphs for Grouping
Organize related components:
```mermaid
graph TB
    subgraph "Frontend"
        WebApp
        MobileApp
    end
    subgraph "Backend"
        API
        Database
    end
```

### Links in Diagrams
Add clickable links (GitHub only):
```mermaid
graph LR
    A[Documentation]
    click A "https://docs.example.com"
```

---

## Next Steps

1. **Generate your first diagrams**: `/orchestr8:generate-diagrams .`
2. **Review generated diagrams**: Check `.orchestr8/docs/diagrams/`
3. **Include in docs**: Link diagrams from your README
4. **Keep updated**: Regenerate after major changes

Happy diagramming! 🎨
