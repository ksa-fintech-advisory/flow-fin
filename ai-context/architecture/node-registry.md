# Node Registry System

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
