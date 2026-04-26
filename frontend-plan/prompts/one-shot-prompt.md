# One-Shot Implementation Prompt

I need you to implement a complete web application based on detailed UI designs and product specifications I'm providing.

## Instructions

Please carefully read and analyze the following files:

1. **@product-plan/product-overview.md** — Product summary with sections and entity overview
2. **@product-plan/instructions/one-shot-instructions.md** — Complete implementation instructions for all milestones

After reading these, also review:

- **@product-plan/design-system.md** — Brand voice, personality, and UI style preferences
- **@product-plan/design-system/** — Color and typography tokens
- **@product-plan/data-shapes/** — UI data contracts
- **@product-plan/shell/** — Application shell components
- **@product-plan/sections/** — All section components, types, sample data, and test specs

## Before You Begin

Review all the provided files, then ask me clarifying questions about:

1. **My tech stack** — What framework, language, and tools I'm using (React framework? Routing library? State management? Backend language? Database?)
2. **Authentication & users** — Cratekeeper is a single-operator local-first tool. Do I want any auth at all, or just a bearer-token API guard?
3. **Backend integrations** — How should we structure the Spotify OAuth flow, Tidal OAuth flow, Anthropic SDK calls, and the Postgres NAS index?
4. **Job runner** — How should pipeline jobs (heavy / light) be executed, persisted, and streamed (SSE / WebSocket)?
5. **File system access** — How will the app read/write the local NAS, the Master Library directory, and per-event output folders?
6. **Anything in the specs or user flows that needs clarification.**

Lastly, ask me if I have any additional notes for this implementation.

Once I answer your questions, create a comprehensive implementation plan before coding.

## Notes (add yours here)

> Replace this section with anything else you want the agent to know.
