# Core Architecture Layers

The platform is conceptually divided into independent layers:

1. **Graph Layer** — nodes, edges, topology, visual rendering, runtime indicators (visualization only)
2. **Flow Definition Language (FDL)** — renderer-independent flow semantics
3. **Runtime / Simulation** — propagation, events, execution feel (separate from rendering)
4. **Rendering** — React Flow as presentation layer consuming FDL
5. **UI** — orchestration UX, visual language, interactions

See dedicated files in this folder and in `runtime/` for each layer.
