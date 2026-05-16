# Rendering System

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
