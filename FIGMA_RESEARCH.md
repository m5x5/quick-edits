# Figma Integration Research

## MCP Server Tools Available

### Reading Designs
- **`get_design_context`** — Primary tool for design-to-code. Returns reference code (React+Tailwind), a screenshot, and contextual metadata for any node. Adapt output to target project's stack.
- **`get_variable_defs`** — Returns design token variables: colors, fonts, sizes, spacings (e.g. `{'icon/default/secondary': #949494}`). Requires `nodeId` and `fileKey`.
- **`get_metadata`** — Returns structural overview in XML: node IDs, layer types (TEXT, RECTANGLE, FRAME, GROUP, COMPONENT, etc.), names, positions, sizes. Useful for browsing file structure and identifying element types.
- **`get_screenshot`** — Visual snapshot of any node.
- **`get_figjam`** — For FigJam board files.

### Writing/Creating
- **`generate_figma_design`** — Write designs back into Figma.
- **`generate_diagram`** — Create FigJam diagrams.

### Code Connect
- **`get_code_connect_map`** / **`get_code_connect_suggestions`** — Read existing component mappings.
- **`add_code_connect_map`** / **`send_code_connect_mappings`** — Map Figma components to codebase components.
- **`create_design_system_rules`** — Generate custom design system rules.

### Utility
- **`whoami`** — Check authenticated user info, debug permission issues.

## URL Parsing

Extract `fileKey` and `nodeId` from Figma URLs:
- `figma.com/design/:fileKey/:fileName?node-id=:nodeId` → convert `-` to `:` in nodeId
- `figma.com/design/:fileKey/branch/:branchKey/:fileName` → use `branchKey` as fileKey
- `figma.com/make/:makeFileKey/:makeFileName` → use makeFileKey
- `figma.com/board/:fileKey/:fileName` → FigJam file, use `get_figjam`

## Figma REST API (Direct Access)

For more granular programmatic access beyond MCP tools:

### Key Endpoints
- `GET /v1/files/:fileKey` — Full file tree with all node properties
- `GET /v1/files/:fileKey/nodes?ids=...` — Specific nodes with full style data
- `GET /v1/files/:fileKey/styles` — All published styles
- `GET /v1/variables/local/:fileKey` — All local variables (colors, fonts, etc.)

### Authentication
- Generate a **Personal Access Token** in Figma: Settings > Sicherheit/Security > "Neues Token erzeugen"
- Set scopes per token (e.g. `file_content:read`)
- Tokens expire after max 90 days (non-expiring tokens no longer allowed)
- Token acts on behalf of the owning user

### Pricing
- **API is free** — no separate API fee, included with any Figma plan
- Rate limits vary by plan:
  - **Starter (free)** — most restrictive
  - **Professional (~$15/user/month annual)** — higher limits
  - **Organization/Enterprise ($45-90/user/month)** — highest limits
- Rate limits are **per-minute**, using a leaky bucket algorithm
- Limits apply based on **where the file resides**, not the token owner's plan
- Exceeding limits returns `429` with `Retry-After` header

## Limitations / Gaps

- **No text content search** — `get_metadata` returns layer names but not actual text content. To find text content, must use `get_design_context` on individual nodes.
- **No batch text search** — Can't query "find all nodes containing word X". Workaround: get metadata tree, filter by node names, then inspect candidates with `get_design_context`.
- **Write permissions** — May require a paid plan for write access via personal access tokens.
- **Rate limits on free tier** — Images API can hit limits after ~10 rapid requests; some users report multi-day cooldowns.

## Workflow: Extracting Design Tokens

1. Get file structure with `get_metadata` on root page (`0:1`)
2. Look for pages/frames named "Typography", "Foundations", "Design Tokens", etc.
3. Use `get_variable_defs` on relevant nodes to pull all variables
4. Adapt extracted tokens to project's token system (CSS variables, Tailwind config, etc.)

## Workflow: Design-to-Code

1. Call `get_design_context` with `nodeId` and `fileKey`
2. Response includes React+Tailwind reference code, screenshot, and hints
3. Check for Code Connect snippets, component docs, design annotations, CSS variables
4. Adapt to target project's stack, reuse existing components/tokens
