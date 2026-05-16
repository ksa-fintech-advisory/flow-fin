# FLOWFIN — MASTER AI CONTEXT SYSTEM

# FINANCIAL FLOW VISUALIZATION & ORCHESTRATION PLATFORM

---

# SECTION: CORE / PRODUCT VISION

## PROJECT IDENTITY

FlowFin is an interactive visual platform for designing, simulating, visualizing, replaying, and eventually executing financial systems and operational flows.

The platform conceptually feels like:

* Cisco Packet Tracer for fintech systems
* Figma for financial architecture
* Runtime observability for money movement
* A visual operating system for financial infrastructure
* A programmable financial topology simulator
* A financial orchestration control plane

The platform is NOT:

* a generic automation builder
* a CRUD dashboard
* a BPMN editor
* a generic low-code workflow tool
* a simple React Flow editor

FlowFin is intended to become:

* a financial systems IDE
* a runtime orchestration layer
* a topology visualization system
* a simulation environment for financial infrastructure
* a visual runtime control plane for fintech systems

---

## CORE PRODUCT VISION

Financial systems today are:

* invisible
* operationally fragmented
* difficult to debug
* difficult to communicate visually
* heavily dependent on logs and dashboards
* difficult to reason about operationally

FlowFin aims to transform financial infrastructure into:

* live graphs
* event-driven runtimes
* interactive topologies
* replayable execution flows
* runtime observability systems
* orchestration visualization systems
* financial simulation environments

The goal is to make financial systems:

* visible
* understandable
* replayable
* operationally observable
* interactive
* topology-aware

---

## MENTAL MODELS

FlowFin should conceptually feel like:

* Packet Tracer for financial systems
* Figma for fintech architecture
* Runtime observability for money movement
* Distributed systems topology visualization
* A financial orchestration control plane
* A visual operating system for money movement

The graph should feel:

* operational
* alive
* topology-driven
* event-driven
* cinematic
* enterprise-grade

---

## PRODUCT DIFFERENTIATORS

Unlike generic workflow systems, FlowFin is deeply financial-native.

The platform understands:

* money movement
* transaction lifecycle states
* retries
* settlement timing
* payment routing
* treasury operations
* fraud checks
* queue pressure
* reconciliation flows
* runtime propagation
* latency
* execution visibility
* operational state transitions

The platform is designed to model financial systems themselves — not simply automate workflows.

The system should feel closer to:

* topology simulation
* distributed runtime visualization
* orchestration systems
* operational infrastructure tooling

rather than:

* generic low-code automation
* admin dashboards
* BPM platforms
* CRUD software

---

## PLATFORM TERMINOLOGY

Preferred platform terminology:

* Flow
* Runtime
* Propagation
* Execution
* Topology
* Node
* Edge
* Runtime State
* Event Stream
* Settlement
* Retry
* Queue Pressure
* Orchestration
* Transaction Movement
* Operational Visibility

Maintain naming consistency across:

* code
* architecture
* UI
* APIs
* runtime systems
* AI-generated implementations

---

## FUTURE PRODUCT DIRECTION

The platform should eventually support:

* runtime replay systems
* execution tracing
* live orchestration
* Kafka integrations
* webhooks
* distributed event systems
* AI copilots
* runtime debugging
* architecture recommendations
* optimization recommendations
* flow generation
* financial topology analysis

The long-term direction is to evolve FlowFin into:

* a programmable financial infrastructure layer
* a runtime orchestration platform
* a financial systems IDE
* a visual execution layer for fintech systems

---

# SECTION: PHASES / IMPLEMENTATION STRATEGY

## CURRENT PHASE

# PHASE 1 — VISUAL FINANCIAL FLOW SIMULATOR

The current phase ONLY focuses on:

* frontend architecture
* flow definition language
* graph rendering
* orchestration UX
* runtime simulation
* runtime visualization
* edge rendering quality
* animation quality
* graph interaction systems

No production backend exists yet.

---

## CURRENT PHASE CONSTRAINTS

DO NOT IMPLEMENT:

* backend systems
* databases
* authentication
* real orchestration
* real payment systems
* distributed systems
* microservices
* collaborative editing
* production infrastructure
* Kafka integrations
* real event systems
* execution engines
* production APIs

Everything should currently be simulated or mocked.

---

## PHASE 1 SUCCESS CRITERIA

The platform should demonstrate:

* professional graph rendering
* clean topology layouts
* runtime propagation
* cinematic execution movement
* operational visibility
* runtime feel
* topology clarity
* simulation behavior
* orchestration UX quality

The platform should visually feel:

* alive
* operational
* interactive
* intelligent
* cinematic
* enterprise-grade

---

## IMPLEMENTATION STRATEGY

The system should be built incrementally through architectural passes.

Recommended implementation order:

1. Foundation Setup
2. Flow Definition Language
3. Graph Rendering System
4. Graph Layout System
5. Runtime Simulation
6. Runtime Visualization
7. Timeline & Event Streams
8. UI Polishing
9. Performance Optimization

---

## IMPLEMENTATION PHILOSOPHY

The AI should NOT invent architecture.

The architecture is already defined.

The AI should:

* implement
* refine
* optimize
* preserve architecture consistency
* preserve runtime philosophy
* preserve graph semantics

Avoid:

* speculative abstractions
* architecture drift
* unnecessary complexity
* premature backend systems

---

# SECTION: ARCHITECTURE / SYSTEM DESIGN

## CORE ARCHITECTURE LAYERS

The platform is conceptually divided into independent layers.

---

## 1) GRAPH LAYER

Responsible for:

* nodes
* edges
* topology structures
* graph relationships
* visual rendering
* runtime indicators

This layer handles visualization only.

---

## 2) FLOW DEFINITION LANGUAGE (FDL)

The Financial Flow Definition Language is one of the most important parts of the platform.

The FDL should remain:

* renderer-independent
* runtime-independent
* backend-independent

Flows are graphs.
NOT sequential arrays.

A flow contains:

* nodes
* edges
* metadata
* runtime rules
* conditions
* simulation configuration

---

## NODE PRINCIPLES

Nodes represent financial semantics and operational meaning.

Examples:

* payment
* approval
* fraud check
* retry
* settlement
* routing
* reconciliation
* wallet
* transfer

Nodes are logical entities.
NOT visual shapes.

Visual shapes are merely representations.

---

## EDGE PRINCIPLES

Edges represent:

* relationships
* propagation
* execution movement
* orchestration transitions
* transaction flow
* runtime direction

Edges are NOT decorative SVG lines.

Edges represent actual runtime semantics.

---

## GRAPH ARCHITECTURE

The graph system should support:

* hierarchy
* deterministic layouts
* runtime propagation
* modular node systems
* domain-specific semantics
* runtime visualization

The graph should remain:

* readable
* operational
* topology-aware
* visually clean

---

## RENDERING SYSTEM

React Flow should be used ONLY as the rendering layer.

The renderer should consume the FDL.

Rendering must remain separated from:

* runtime logic
* simulation logic
* future execution systems

The rendering system should support:

* custom nodes
* custom edges
* runtime overlays
* runtime animation
* topology rendering
* interaction systems

---

## NODE REGISTRY SYSTEM

The platform should use a node registry architecture.

Example conceptual structure:

```ts
const nodeRegistry = {
  payment: {
    component: PaymentNode,
    shape: "circle",
    color: "green"
  },

  approval: {
    component: ApprovalNode,
    shape: "diamond",
    color: "yellow"
  }
}
```

The registry should separate:

* flow semantics
* rendering logic
* runtime behavior
* visual identity

---

## GRAPH LAYOUT SYSTEM

The graph layout should initially be deterministic.

Avoid free-form positioning initially.

The layout engine should:

* minimize edge crossings
* minimize graph chaos
* maintain hierarchy
* preserve readability
* preserve spacing consistency

Use:

* Dagre initially
* ELK.js later if needed

---

## STATE MANAGEMENT

Use Zustand for state management.

Separate:

* graph state
* runtime state
* UI state
* interaction state

Minimize rerenders aggressively.

---

## ARCHITECTURE BOUNDARIES

The following separations MUST be preserved:

* FDL must remain renderer-independent
* runtime must remain separated from rendering
* rendering must remain separated from execution systems
* domain semantics must remain modular
* UI must remain decoupled from simulation logic

Avoid tightly coupled systems.

---

# SECTION: RUNTIME / SIMULATION & EXECUTION

## SIMULATION ENGINE

The simulation layer is responsible for:

* event propagation
* retries
* delays
* queue states
* probabilistic failures
* routing
* execution movement
* latency
* propagation timing

Simulation is a first-class concept.

The platform should eventually support:

* deterministic replay
* failure injection
* throughput simulation
* latency simulation
* retry simulation

---

## RUNTIME FEEL

The runtime should feel:

* alive
* cinematic
* distributed
* operational
* event-driven
* topology-aware

Execution should visually propagate similarly to:

* packet movement in Packet Tracer
* distributed systems propagation
* topology activity
* operational event systems

The graph must never feel static.

---

## RUNTIME STATES

Example runtime states:

* idle
* pending
* running
* success
* failed
* paused
* retrying

Runtime states should affect:

* node visuals
* edge visuals
* animations
* event streams
* runtime overlays

---

## PROPAGATION MODEL

Execution should visually move through the graph.

Edges should communicate:

* execution direction
* active runtime
* retries
* queue pressure
* latency
* failures
* transaction movement

Propagation should feel smooth and operational.

---

## RETRIES & FAILURES

Retries should be visually represented.

Failures should propagate visually through the topology.

The runtime should support:

* retry states
* failure states
* queue pressure
* operational degradation
* execution interruption

---

## TIMELINE SYSTEM

The platform should include:

* runtime event streams
* execution timelines
* operational traces
* transaction traces
* runtime logs

Examples:

* Flow Started
* Payment Authorized
* Fraud Check Passed
* Retry Triggered
* Settlement Completed

The timeline should feel:

* operational
* traceable
* event-driven
* live

---

## RUNTIME VISUALIZATION

The runtime visualization layer should support:

* active edges
* node glow states
* propagation animation
* execution pulse systems
* runtime overlays
* operational movement

The runtime layer is one of the core product innovations.

---

# SECTION: DOMAINS / FINTECH SEMANTICS

## PAYMENTS DOMAIN

Examples:

* authorization
* capture
* refunds
* retries
* routing
* settlement
* fee calculation
* transaction propagation

Payment nodes should visually communicate operational state.

---

## BANKING DOMAIN

Examples:

* ACH flows
* SWIFT flows
* transfers
* account validation
* payment rails
* bank routing

Banking topology should support institution-aware semantics.

---

## CRYPTO DOMAIN

Examples:

* wallet transfers
* blockchain confirmations
* mempool propagation
* gas systems
* bridge flows
* chain routing

Crypto propagation should visually communicate confirmation states.

---

## FRAUD & RISK DOMAIN

Examples:

* fraud scoring
* transaction reviews
* holds
* chargebacks
* compliance checks

Risk systems should visually communicate operational uncertainty.

---

## WEALTH MANAGEMENT DOMAIN

Examples:

* portfolio execution
* rebalancing
* allocation flows
* execution routing

The runtime should support portfolio-level propagation semantics.

---

# SECTION: UI / VISUAL LANGUAGE

## DESIGN LANGUAGE

The UI should feel inspired by:

* Figma
* Packet Tracer
* Miro
* topology systems
* orchestration platforms
* runtime observability tools

The platform should visually feel:

* clean
* intelligent
* cinematic
* operational
* modern
* enterprise-grade

---

## ORCHESTRATION FEEL

The graph should feel:

* operational
* topology-aware
* runtime-driven
* event-driven
* interactive

Avoid generic dashboard aesthetics.

Avoid CRUD-style UX patterns.

---

## VISUAL SEMANTICS

Example visual semantics:

* Circle = process
* Diamond = decision
* Blue glow = running
* Yellow pulse = retry
* Red pulse = failure
* Green edge = success

Visual semantics should remain consistent across the platform.

---

## EDGE RENDERING REQUIREMENTS

Edge quality is critically important.

The graph must avoid:

* edge chaos
* overlapping paths
* visual collisions
* unreadable layouts

Edges should:

* use smooth curves
* intelligently route
* maintain spacing
* support runtime animation
* visually communicate execution

Preferred edge styles:

* SmoothStepEdge
* BezierEdge

---

## GRAPH INTERACTION SYSTEMS

The graph should support:

* smooth zooming
* smooth panning
* node selection
* runtime inspection
* topology exploration

Interactions should feel fluid and cinematic.

---

## ANIMATION PHILOSOPHY

Animations should communicate:

* execution
* movement
* operational activity
* runtime propagation

Avoid excessive decorative animation.

Motion should feel purposeful and operational.

---

## LAYOUT PRINCIPLES

The graph should maintain:

* hierarchy
* spacing consistency
* topology readability
* visual cleanliness
* operational clarity

The graph should never feel visually chaotic.

---

# SECTION: ENGINEERING / DEVELOPMENT RULES

## ENGINEERING PRINCIPLES

Prioritize:

1. Clean architecture
2. Runtime feeling
3. Visual quality
4. Smooth UX
5. Simplicity
6. Extensibility
7. Performance

---

## ENGINEERING STYLE RULES

Prefer:

* composition over inheritance
* modular architecture
* explicit logic
* readable code
* deterministic behavior

Avoid:

* giant components
* deeply nested logic
* speculative abstractions
* architecture bloat
* unnecessary complexity

---

## PERFORMANCE GUIDELINES

The graph system should:

* render smoothly
* minimize rerenders
* avoid unnecessary recalculations
* keep animations responsive
* maintain fluid interactions

Performance is critically important for graph UX.

---

## AI ENGINEERING RULES

When generating code:

* Preserve existing architecture
* Do not rewrite unrelated systems
* Avoid unnecessary libraries
* Preserve runtime/rendering separation
* Maintain topology cleanliness
* Prioritize runtime feeling
* Prefer incremental changes
* Keep abstractions lightweight
* Maintain graph readability
* Preserve operational UX quality

If a simpler implementation exists, prefer the simpler implementation.

---

## ANTI-OVERENGINEERING RULES

DO NOT prematurely implement:

* plugin systems
* provider frameworks
* generic engines
* speculative backend systems
* distributed infrastructure
* microservice abstractions

Abstractions should emerge from actual architectural pressure.

---

## CONTEXT LOADING STRATEGY

AI agents should load ONLY the relevant context sections for each task.

Examples:

For rendering tasks:

* Rendering System
* Edge Rendering Requirements
* Graph Layout System
* Design Language

For runtime tasks:

* Runtime Feel
* Runtime Visualization
* Propagation Model
* Runtime States

For animation tasks:

* Animation Philosophy
* Runtime Visualization
* Propagation Model

Context precision is more important than context size.

---

# FINAL PRINCIPLE

FlowFin is NOT merely building diagrams.

It is building:

* a financial runtime visualization platform
* a topology-based orchestration experience
* a simulation environment
* a financial systems IDE
* a runtime observability layer
* a visual operating system for financial infrastructure

The frontend experience itself is part of the core innovation.
