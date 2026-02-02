# Diagnostic Audit — Initial Repository Review

## 1. Project identity

- **What it is:** A Vite + React TypeScript single-page app (SPA) game, with client-only logic and no server runtime. Evidence: Vite scripts in [`package.json`](package.json:1), React entry in [`index.tsx`](index.tsx:1), and Vite config in [`vite.config.ts`](vite.config.ts:1).
- **How it is expected to run locally:** `npm install` then `npm run dev` to start the Vite dev server (see [`package.json`](package.json:1) and [`README.md`](README.md:1)).
- **Build step:** Yes. Static assets are produced with `vite build` into `dist/` (see [`package.json`](package.json:1) and [`vite.config.ts`](vite.config.ts:1)). The `index.html` is not prebuilt; it is the Vite entry template (see [`index.html`](index.html:1)).
- **Workflow target (desktop/laptop/tablet):** The UI is designed for mouse/keyboard (WASD movement, click to attack, keyboard shortcuts for skills), which assumes desktop/laptop input. Touch support is not clearly handled. Evidence: keyboard listeners and UI hints in [`App.tsx`](App.tsx:161).

**Implication:** This is a browser-based SPA with a required build step for static deployment. It’s desktop-first in controls. Tablet usage will be limited unless touch controls are added.

**Severity:** Should be a teaching moment (input modality assumptions for tablet use).

## 2. Runtime assumptions

### Environment variables

- **README mentions** `GEMINI_API_KEY` in `.env.local` (see [`README.md`](README.md:1)).
- **Actual code path** does not read `process.env` or `import.meta.env`. API key is entered in the UI and stored in `localStorage` (see [`App.tsx`](App.tsx:61) and [`components/ApiKeyModal.tsx`](components/ApiKeyModal.tsx:1)).

**Implication:** Documentation and runtime behavior diverge. Students will look for `.env.local` but the app actually expects an in-browser key entry.

**Severity:** Should be fixed now (documentation mismatch causes setup friction).

### Server-side execution

- No server-side code or API routes. All logic executes in the browser. The AI calls are performed client-side using `@google/genai` (see [`services/geminiService.ts`](services/geminiService.ts:1)).

**Implication:** This is a pure client SPA. Works on static hosting, but client-side API keys are exposed to the browser environment.

**Severity:** Should be a teaching moment (client-side API calls and key exposure).

### Paid cloud services / OAuth / project selection

- Uses Google Gemini models via `@google/genai` and expects a user-supplied API key (see [`services/geminiService.ts`](services/geminiService.ts:1) and [`components/ApiKeyModal.tsx`](components/ApiKeyModal.tsx:1)).
- The modal links to Google AI Studio API key creation, which typically requires a Google account and may require enabling billing depending on quotas (see [`components/ApiKeyModal.tsx`](components/ApiKeyModal.tsx:55)).

**Implication:** There is a paid/quotas/Google account assumption not captured in the README. This will block some students.

**Severity:** Should be fixed now (clear disclosure for onboarding).

### IDE-only tooling

- No evidence of IDE-only tooling or extensions. Standard Node + Vite workflow.

**Implication:** Safe for most environments with Node access.

**Severity:** Safe to ignore.

### Platform breakpoints (GitHub Pages, Codespaces, iPad, no admin rights)

- **GitHub Pages:** Static deployment should work because Vite build is configured with `base: './'` (see [`vite.config.ts`](vite.config.ts:1)). However, the app relies on runtime API calls to Gemini from the client; GitHub Pages will not provide any server-side secret handling.
- **Codespaces:** Should run as long as Node is available. No extra services. Some ports or CSP might block external CDNs and `esm.sh` if restricted.
- **iPad/tablet:** Gameplay is keyboard/mouse dependent (WASD, Q/E, click). Touch-only devices will struggle. See controls in [`App.tsx`](App.tsx:1516).
- **No admin rights:** Installing Node dependencies may be blocked. Without Node, students can’t run locally, and the repo does not include a prebuilt `dist/` bundle.

**Implication:** The static site can deploy, but runtime API calls and control scheme mean “runs anywhere” is not fully true for tablets or locked-down machines.

**Severity:** Teaching moment (device constraints) + should be fixed now (explicit setup expectations).

## 3. AI / API integrations

### Provider(s) and models

- **Provider:** Google Gemini via `@google/genai`. Models used: `gemini-3-flash-preview` for riddles, verification, and item generation (see [`services/geminiService.ts`](services/geminiService.ts:31)).

### API key sourcing

- **BYOK entry:** UI modal stores the key in `localStorage` and passes it directly to the client SDK (see [`App.tsx`](App.tsx:61) and [`components/ApiKeyModal.tsx`](components/ApiKeyModal.tsx:1)).
- **No environment variable usage** despite README instructions (see [`README.md`](README.md:1)).

### BYOK enforcement

- **Enforced:** The app checks for a key before puzzle actions and blocks or returns fallback messages without it (see [`App.tsx`](App.tsx:1037) and [`services/geminiService.ts`](services/geminiService.ts:31)).
- **No silent bypass:** There is no fallback to a shared key or proxy. Missing key yields errors or a low-power “Keyless Blade” item (see [`services/geminiService.ts`](services/geminiService.ts:90)).

**Classification:** Clean BYOK, but key is client-stored.

### Hidden costs / forced setup

- **Google AI Studio key creation** is linked and likely requires Google account and potential billing (see [`components/ApiKeyModal.tsx`](components/ApiKeyModal.tsx:55)).

**Implication:** Students may be blocked by account/billing or quota limits. No warning is provided in the README.

**Severity:** Should be fixed now (explicit caveat in docs, even for PoC).

## 4. Deployment readiness

- **Static deployment:** Yes, this can be deployed as a static site after running `vite build`. The `base: './'` setting in Vite config supports GitHub Pages pathing (see [`vite.config.ts`](vite.config.ts:1)).
- **Potential blockers:**
  - The app uses client-side API calls to Gemini. Static hosting is fine, but users must supply their own API key in the browser. This will fail in environments where network access to Google’s API is blocked or where students cannot create keys.
  - The `index.html` contains two `script` tags referencing `index.tsx` and includes an `importmap` with CDN dependencies (see [`index.html`](index.html:89)). This is unusual for a Vite build and could lead to confusion or duplicated loading in some contexts.

**Implication:** Build output should work, but there is a risk of confusion or runtime inconsistencies due to mixed Vite bundling and CDN importmaps.

**Severity:** Should be fixed now (remove conflicting runtime paths or document why both exist).

## 5. Security and leakage

- **Client-side API key storage:** The Gemini API key is stored in `localStorage` and used from the browser (see [`App.tsx`](App.tsx:61)). This means the key is exposed to anyone using the app and to browser extensions or shared device profiles.
- **No server proxy:** There is no backend, so no way to protect the key from client exposure.

**Risk level:** Medium. Acceptable for a classroom PoC, but students should be explicitly warned that keys are exposed and should not be reused for production.

**Severity:** Teaching moment (client-side keys and data exposure).

## 6. Code health (high level)

- **Single-file monolith:** `App.tsx` is very large and contains UI, state, game loop, AI calls, and rendering logic in one file (see [`App.tsx`](App.tsx:1)). This makes debugging and learning harder.
- **Mixed rendering models:** Uses React for UI while also doing direct canvas rendering and a custom game loop. This is valid but adds complexity and state synchronization risks (see [`App.tsx`](App.tsx:632)).
- **Redundant or confusing entry paths:** `index.html` loads `index.tsx` twice and includes an importmap that suggests CDN-based runtime instead of bundled Vite assets (see [`index.html`](index.html:89)). This is likely AI-generated glue or leftover template code.

**Implication:** Debugging will be harder for students. The presence of mixed build/runtime patterns is a red flag and a learning hazard.

**Severity:** Should be a teaching moment (spotting AI-generated boilerplate conflicts) and should be fixed now for clarity.

## 7. Teaching implications

- **Confusion likely:** README says `.env.local` is required, but the app expects a key via a modal. Students will waste time looking for `.env.local` and think the app is broken (see [`README.md`](README.md:1) and [`App.tsx`](App.tsx:61)).
  - **Why it matters:** Setup friction derails learning.
  - **Action:** Fix docs now.

- **Tablet use frustration:** The control scheme requires keyboard and mouse (WASD + click + Q/E). On tablets, this will be difficult or impossible.
  - **Why it matters:** The stated target includes tablets.
  - **Action:** Teaching moment about input design and device constraints; consider adding touch controls later.

- **AI key exposure:** Storing keys in `localStorage` is convenient but unsafe for shared devices.
  - **Why it matters:** Students may reuse personal keys or share devices.
  - **Action:** Teaching moment on client-side key risks.

- **AI usage costs and account setup:** The Gemini key link implies account and quota/billing requirements.
  - **Why it matters:** Some students cannot create keys.
  - **Action:** Fix docs now with explicit expectations and a no-AI fallback explanation.

- **Mixed build/runtime assets:** Importmap and direct TSX script in `index.html` are atypical for Vite and can confuse deployment debugging.
  - **Why it matters:** Students won’t know which asset path is authoritative.
  - **Action:** Teaching moment about build pipelines; should be cleaned up for clarity.

---

### Summary of key issues and priority

1. **Docs mismatch on API key setup** (should fix now). Evidence: [`README.md`](README.md:1), [`App.tsx`](App.tsx:61).
2. **Tablet usability gap due to keyboard/mouse-only controls** (teaching moment). Evidence: [`App.tsx`](App.tsx:1516).
3. **Client-side Gemini key exposure** (teaching moment). Evidence: [`App.tsx`](App.tsx:61), [`services/geminiService.ts`](services/geminiService.ts:1).
4. **Importmap and duplicate TSX loading in `index.html`** (should fix now). Evidence: [`index.html`](index.html:89).
5. **Implicit paid/Google account assumptions for AI** (should fix now). Evidence: [`components/ApiKeyModal.tsx`](components/ApiKeyModal.tsx:55).
