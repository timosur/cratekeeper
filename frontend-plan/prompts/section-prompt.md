# Section Implementation Prompt — Template

> Use this template for milestone-by-milestone (incremental) implementation. Copy it, replace `SECTION_NAME`, `SECTION_ID`, and `NN`, fill in the Notes section, then paste into your coding agent.

---

I need you to implement the **`SECTION_NAME`** section of Cratekeeper based on detailed UI designs and a product specification I'm providing.

## Instructions

Please carefully read and analyze the following files:

1. **@product-plan/product-overview.md** — Product summary so you understand the broader context
2. **@product-plan/instructions/incremental/NN-SECTION_ID.md** — Implementation instructions for this specific section
3. **@product-plan/sections/SECTION_ID/README.md** — Section overview, user flows, and design decisions
4. **@product-plan/sections/SECTION_ID/types.ts** — TypeScript interfaces describing the data the components expect
5. **@product-plan/sections/SECTION_ID/components/** — The React components to integrate
6. **@product-plan/sections/SECTION_ID/sample-data.json** — Sample data for testing before real APIs are built
7. **@product-plan/sections/SECTION_ID/tests.md** — UI behavior test specs

Additional context (review as needed):

- **@product-plan/design-system.md** — Brand voice, personality, and UI style preferences
- **@product-plan/design-system/** — Color and typography tokens
- **@product-plan/data-shapes/** — UI data contracts shared across sections

## Before You Begin

Review the files, then ask me clarifying questions about:

1. **What's already in place** — Do we have the application shell? Routing? Design tokens? Other sections?
2. **Tech stack** — If not previously established, what framework / language / tools am I using?
3. **Backend wiring** — Which APIs / job runners / external services this section depends on, and how they should integrate.
4. **Data sourcing** — Should we use the sample-data.json fixture initially, or wire to real endpoints from the start?
5. **Anything in the spec or user flows that needs clarification.**

Once I answer your questions, create a focused implementation plan for this section, then code.

## Notes (add yours here)

> Replace this section with anything else you want the agent to know.
