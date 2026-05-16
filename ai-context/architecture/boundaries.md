# Architecture Boundaries

The following separations MUST be preserved:

* FDL must remain renderer-independent
* runtime must remain separated from rendering
* rendering must remain separated from execution systems
* domain semantics must remain modular
* UI must remain decoupled from simulation logic

Avoid tightly coupled systems.
