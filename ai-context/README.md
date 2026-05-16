# FlowFin AI Context

Modular context for AI agents. Load only the files relevant to the task.

## Structure

| Folder | Focus |
|--------|--------|
| [core/](core/) | Product vision, identity, terminology |
| [phases/](phases/) | Current phase, constraints, implementation order |
| [architecture/](architecture/) | System design, FDL, graph, rendering |
| [runtime/](runtime/) | Simulation, propagation, timeline |
| [domains/](domains/) | Fintech domain semantics |
| [ui/](ui/) | Visual language, edges, animation |
| [engineering/](engineering/) | Dev rules, performance, context loading |

## Quick load guide

| Task type | Load |
|-----------|------|
| Rendering | `architecture/rendering.md`, `ui/edge-rendering.md`, `architecture/graph-layout.md`, `ui/design-language.md` |
| Runtime | `runtime/runtime-feel.md`, `runtime/runtime-visualization.md`, `runtime/propagation.md`, `runtime/runtime-states.md` |
| Animation | `ui/animation.md`, `runtime/runtime-visualization.md`, `runtime/propagation.md` |
| New feature (general) | `core/product-vision.md`, `phases/phase-1.md`, `engineering/ai-rules.md` |

See [engineering/context-loading.md](engineering/context-loading.md) for full guidance.
