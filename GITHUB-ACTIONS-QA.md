# GitHub Actions Q&A Notes

Questions asked while building this project, and the answers — kept as a reference.

---

### Q: What does `base: '/simple-qr-code-generator/'` in `vite.config.js` mean?

GitHub Pages serves this site at `https://sawla-1.github.io/simple-qr-code-generator/` — a **subfolder**, not the domain root.

By default, Vite builds `index.html` to load files like `/assets/index.js` (from the root). But our files actually live one folder deeper. Without `base` set, the browser looks in the wrong place → 404 errors → blank page.

`base` tells Vite: "our site lives one folder deeper — adjust every file path to include that folder." It must exactly match the repo name.

**Analogy:** it's like giving directions "Room 5" vs "Building A, Room 5." Skip "Building A" and people search the wrong building.

---

### Q: I don't see a file called `assets/index.js` in the build output.

Correct — Vite renames it with random letters, e.g. `assets/index-DYAtaJtQ.js`. This is called a **hash**.

Why: if you update your code, the hash changes too. Browsers cache old files by filename — a new filename forces a fresh download instead of showing stale/broken code.

---

### Q: Does the GitHub Actions VM use Vite too, same as us?

Yes. The VM runs the exact same commands as your computer: `npm install` then `npm run build` (which runs Vite). Same tool, same version, same `base` setting, same output. It's not a different build process — it's literally your project, built the same way, just on GitHub's computer instead of yours.

---

### Q: Is `base` needed for the VM, or for our side?

Neither, really — it's needed because of **where the site will be hosted**, not who builds it. Even if you built it yourself and manually uploaded the `dist` folder, you'd still need `base` set the same way.

---

### Q: So if we run locally, we don't need `base`?

Correct. `npm run dev` works fine with or without it. The only difference: with `base` set, local dev opens at `http://localhost:5173/simple-qr-code-generator/` instead of `http://localhost:5173/`. Either way, the app runs the same.

`base` only matters once deployed to a subfolder-style host, like GitHub Pages project sites.

---

### Q: What about Cloudflare — do we need `base` there?

No. Cloudflare Pages (same for Netlify, Vercel, custom domains) serves your site at the **root** of its own address, e.g. `simple-qr-code-generator.pages.dev` — no subfolder involved. `base: '/'` (Vite's default) is correct there.

**Rule:** root of its own domain → no `base` needed. Subfolder (like GitHub Pages project sites) → `base` must match that subfolder name.

---

### Q: What does the `permissions:` block do?

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

GitHub Actions jobs get **zero permissions by default** — you must explicitly grant what's needed:
- `contents: read` — allowed to download your code
- `pages: write` — allowed to publish to GitHub Pages
- `id-token: write` — allowed to request a short-lived security token (OIDC) proving this run is authorized to deploy

**Analogy:** like a visitor badge — each permission is a specific door the badge unlocks. No badge, no entry.

---

### Q: Is this `permissions` block for the VM?

Yes. It applies to the VM (the temporary computer GitHub spins up per run). The VM starts with zero access; this block grants it exactly what it needs. Once the job ends, the VM and its permissions are thrown away — the next run starts from zero again.

---

### Q: Where do we get the `id-token` from?

We don't create it — **GitHub creates it automatically**. `id-token: write` just gives permission to *ask* for one. When the `deploy-pages` step runs, it silently requests a token from GitHub, which checks the run is genuine and hands back a signed, short-lived token. Nobody types or sees it manually (it shows as `"oidc_token": "***"` in logs, hidden on purpose).

**Analogy:** like a hall pass — you don't write your own, you ask the teacher (GitHub), who writes and signs it for you.

---

### Q: Let's say I am the VM. Do I create the `id-token` myself?

Not quite — you *request* it, GitHub *creates and signs* it. You (the VM) send a request during the `deploy-pages` step; GitHub verifies who you are (repo, workflow, run number) and returns a signed token. You never write your own — that would be forgeable.

---

### Q: We have 2 `permissions` blocks — why?

They work at different levels:
- **Top of file** (workflow-level) — the *default* for every job
- **Inside the `deploy` job** (job-level) — *replaces* the default, just for that job

A job-level `permissions:` block **replaces**, not adds to, the top-level one — so it must list everything that job needs itself.

---

### Q: So could the top-level block just be `contents: read`, without `pages`/`id-token`?

Yes. The `build` job only checks out code, installs, and builds — it never touches Pages. Only `deploy` needs `pages: write` and `id-token: write`, and it already declares those itself. **Least privilege** = give each job only what it actually uses.

(This was confirmed via web search on GitHub Actions security best practices, and applied to `deploy.yml`.)

---

### Q: What's the difference between `upload-pages-artifact` and `deploy-pages`?

| | `upload-pages-artifact` | `deploy-pages` |
|---|---|---|
| Runs in | `build` job | `deploy` job |
| Job | **Packages** the `dist` folder into a format GitHub Pages understands | **Publishes** that package live to the site |
| When | Right after `npm run build` | After `build` finishes (`needs: build`) |

**Analogy:** `upload-pages-artifact` = packing and sealing a box. `deploy-pages` = the delivery truck that drops it off. You need the box packed before the truck can deliver it.

---

### Q: Are actions like `actions/checkout` "built-in" to GitHub?

Not built-in — official, but separate. Each one is its own small program, stored in its own repo (e.g. `github.com/actions/checkout`). The VM downloads the specific version fresh every run. `actions/` in the name means it's published and maintained by GitHub themselves — trusted by default, unlike a random user's action.

**Analogy:** a VM is a new phone with no apps. `uses: actions/checkout@v4` = download and run that specific app version, published by GitHub's own official account.

---

### Q: What's this warning: "Node.js 20 is deprecated... forced to run on Node.js 24"?

Not an error — both jobs still passed. The actions we use internally run on Node 20, which GitHub is phasing out; GitHub is automatically running them on Node 24 instead so nothing breaks, just a heads-up.

(Different from our own `node-version: 20` line, which sets the Node version used to *build the app* — not the actions' own runtime.)

---

### Q: Can we use `actions/checkout@v5` (or newer)?

Checked latest versions via web search:

| Action | We used | Latest |
|---|---|---|
| `actions/checkout` | `@v4` | `@v6` |
| `actions/setup-node` | `@v4` | `@v7` |
| `actions/upload-pages-artifact` | `@v3` | `@v4` |
| `actions/deploy-pages` | `@v4` | `@v4` (already latest) |

Updated `deploy.yml` to use `checkout@v6`, `setup-node@v7`, `upload-pages-artifact@v4`.

---

### Q: I still see the Node 20 warning after updating — why?

`upload-pages-artifact@v4` and `deploy-pages@v4` are the **newest versions that exist** — both still run internally on Node 20. There's an open GitHub issue (`actions/deploy-pages` #410, "Support Node.js 24") still unresolved. This can't be fixed from our side — we're already on the latest release. The warning is harmless; GitHub auto-forces Node 24 behind the scenes regardless.

---

### Q: What does the `environment:` block do?

```yaml
environment:
  name: github-pages
  url: ${{ steps.deployment.outputs.page_url }}
```

- `name: github-pages` — marks this job as deploying to an environment GitHub tracks (shows deployment history under Settings → Environments, and a "View deployment" button on the repo homepage)
- `url: ...` — grabs the live URL output from the step named `id: deployment` and shows it as a clickable link on the workflow run summary

**Analogy:** like a delivery worker texting back "delivered to [address]" — this block displays that text on your dashboard.

---

### Q: If I don't include the `environment` block, can I still find my live site URL?

Yes, just less conveniently. It's always available at repo → **Settings → Pages**, or by remembering the pattern `https://username.github.io/repo-name/`. Without this block you just lose the clickable link on the Actions summary page and the "View deployment" button.

---

### Q: Is `steps.deployment` referring to `- id: deployment`? If I rename the `id`, do I need to update the reference too?

Yes to both. `steps.deployment` looks up the step where `id: deployment` is set. Rename it to `id: something`, and you must also change the reference to `steps.something.outputs.page_url` — otherwise the link silently breaks (empty, no error).

**Analogy:** `id: deployment` is like naming a variable; every place that reads it must use the same name.

---

### Q: You showed `steps` before `environment` in an explanation, but in the file `environment` comes first — does order matter?

No. YAML files are a set of labeled settings (key-value pairs), not a sequence read top to bottom. GitHub reads the whole job as a structure first, then resolves references like `steps.deployment` regardless of which comes first on the page.

**Analogy:** like a form with "Emergency Contact" and "Your Name" fields — field order on the page doesn't matter.

---

### Q: Why does `- id: deployment` use a `-`?

Because `steps:` holds a **list** of steps. In YAML, every list item starts with `-`. Everything indented under one `-` (until the next `-`) belongs to that same step.

```yaml
steps:
  - id: deployment          # step 1
    uses: actions/deploy-pages@v4
  - run: echo "done"        # step 2
```

**Analogy:** `-` is a bullet point in a checklist — each bullet is one task, and details under it belong only to that task. Forgetting the `-` would break the YAML parsing.

---

### Q: What is `pages: write` for?

It's the permission that lets the workflow actually publish to GitHub Pages. Without it, the `deploy-pages` step fails — it tries to publish the site but GitHub blocks it, since the workflow never asked for that permission.

Only used in the `deploy` job (not `build`), since only `deploy` touches GitHub Pages.

**Analogy:** `contents: read` lets you look at the code; `pages: write` lets you press the publish button.
