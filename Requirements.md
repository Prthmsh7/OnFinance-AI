{
   "prompt": """
I am working on a compliance monitoring solution which will pull in the latest circulars from SEBI and parse them. Once it is parsed into a table to clauses, you will need to extract the following information:
1. The new compliance requirements proposed by the regulator
2. Gap analysis with my existing compliance setup
3. The impact of these new compliance requirements on my organization at an IT and operational level
""",
   "diagram_types": ["sequential", "component", ...]
}
 
1. New user, sending you this request, you give an output
2. Existing user, sending you request with an updated prompt, you need to give the updated output
3. Existing user, is giving you feedback, this has to be passed onto the ART plugin of langchain to improve the model for future iterations.
 
# UML in One Class: All Diagram Types
 
## Learning outcomes
 
* Know the 14 UML 2.x diagram types and when to use each.
* Recognize core notations and common pitfalls.
* Pick a minimal set for typical software specs.
 
## Big picture
 
* **Structure diagrams (7):** what the system *is*.
* **Behavior diagrams (7):** what the system *does*.
 
  * Interaction diagrams (4) are a subset of behavior.
 
---
 
## Structure diagrams
 
**Class** — Domain/API design. Shows classes, attributes, operations, associations, inheritance, composition/aggregation, interfaces. Use for schemas and OO design.
 
**Object** — Snapshot of *instances* at runtime. Great for examples, test fixtures, and clarifying multiplicities.
 
**Component** — High-level building blocks and provided/required interfaces (ports/lollipops). Use for service/module boundaries.
 
**Composite Structure** — Internal wiring of a class/component: parts, ports, connectors. Use when internals matter.
 
**Deployment** — Runtime topology: nodes (devices/VMs/containers), execution environments, artifacts. Use for ops/DevOps views.
 
**Package** — Namespaces and dependencies. Use for layering and modularization.
 
**Profile** — Customizing UML (stereotypes, tagged values, constraints). Use to encode domain rules (e.g., «microservice», PII).
 
---
 
## Behavior diagrams
 
**Use Case** — Actors and goals; system scope. Use for stakeholder alignment and feature slicing.
 
**Activity** — Workflow/algorithms: actions, decisions, forks/joins, swimlanes, object flows. Use for business processes and pipelines.
 
**State Machine** — Lifecycles: states, events, guards, entry/exit actions. Use for protocols, UI widgets, order/payment states.
 
### Interaction (behavior subset)
 
**Sequence** — Time-ordered messages, sync/async, alt/loop fragments. Use for API calls and request lifecycles.
 
**Communication** — Same interaction as sequence but emphasizes links between participants; compact network view.
 
**Interaction Overview** — “Storyboard” that stitches other interactions with control flow.
 
**Timing** — State/value over time along lifelines; use for real-time, hardware, SLA/timeout analysis.
 
 
1. How to generate/render the UML on UI?
2. How to control/verify snytax issues in the output?
3. How are we minimizing latency?
4. How to collect and store feedback for the RL trainer?