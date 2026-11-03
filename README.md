# No (`no.gpurg.com`) - Interactive Engineering Request Triage

> **Interactive decision tree, automated click-replay engine, and 3-second interactive widgets showing why an incomplete, urgent, or out-of-scope request is a "No".**  
> 100% static client-side web application (`docs/`), zero external dependencies, zero cookies/storage, GitHub Pages ready.

---

## 1. Quick-Copy Link Cheatsheet (External Link Generator)

To keep the visitor UI clean and centered, use the table below to send links directly in chat:

| Scenario | Auto-Replay Link (Virtual Cursor Clicks the Path) |
| :--- | :--- |
| **Missing infos** (*Reporting != dumping - "It doesn't work!" is not a bug report*) | `https://no.gpurg.com/#missing-infos` |
| **Guessing wheel** (*Guessing != debugging - speculating with zero logs*) | `https://no.gpurg.com/#wheel` |
| **For yesterday & Skip non-prod** (*Urgency != skipping engineering / "5-minute change"*) | `https://no.gpurg.com/#for-yesterday` |
| **Skip non-prod / Friday deploy** (*Opens directly in `🚨 YOLO PROD MODE`*) | `https://no.gpurg.com/#prod-on-friday` |
| **RTFM / Docs / AI** (*Asking != skipping a 10-second search - "How does X work?"*) | `https://no.gpurg.com/#rtfm` |
| **No agenda = No call** (*Improvising on a call != being faster*) | `https://no.gpurg.com/#no-agenda` |
| **XY problem** (*Shipping != designing - "Create X because I want Y"*) | `https://no.gpurg.com/#xy-problem` |
| **Pick 2: Fast, Good, Cheap** (*Priority != wanting everything*) | `https://no.gpurg.com/#pick2` |
| **Anti-cheat trap** (*Tries to force a YES via URL*) | `https://no.gpurg.com/#yes` or `https://no.gpurg.com/#approved` |

---

## 2. 1:1 Non-Redundant Decision Tree

Each of the 3 top-level doors maps to its own distinct failure modes and interactive widgets without cross-branch duplication:

1. **`Something is broken / Urgent` (`danger`):**
   - `Two vague lines / screenshot (maybe cropped)` -> **`#missing-infos`** (Checklist interlock + 45m interrogation vs 3m complete report).
   - `I don't know, can you check?` -> **`#wheel`** (Hypothesis wheel vs real diagnostic check).
   - `It's a 5-minute urgent change: patch production right now` -> **`#for-yesterday`** (`5-minute` multiplier + `🚨 YOLO PROD MODE` + Friday 17:30 crash timeline).
   - `I did my part of the analysis and have logs + context ready` -> **`YES!` (`approved`)**.
2. **`Do you have 5 minutes?` (`info`):**
   - `How does X work?` -> **`#rtfm`** (40m chat wait vs 10s docs/AI search simulator + `Yes, help me please!` escape hatch).
   - `I'll explain on a voice call` -> **`#no-agenda`** (Live context-switch taximeter + on-page timer).
   - `Checked docs/AI, tried on my own, and wrote everything down` -> **`YES!` (`approved`)**.
3. **`New task, change, or release` (`warn`):**
   - `Can you deliver X...` -> **`#xy-problem`** (Interactive real-world cases: custom cluster vs managed queue, security rule vs root cause).
   - `The root problem (Y) and design ownership are clear` -> **`Does it match our rules of engagement?`**:
     - `Outside the agreed channel, or we need it Fast + Good + Cheap` -> **`#pick2`** (Mechanical `FAST` / `GOOD` / `CHEAP` switches -> `Accept 2 of 3 -> Proceed` -> **`YES!` (`approved`)**).
     - `Sent via the agreed channel with realistic timelines` -> **`YES!` (`approved`)**.

---

## 3. Repository Structure (`docs/`)

```
no/
├── README.md                     # Architecture, quick-copy URL table & legal credits
├── GEMINI.md                     # Local editorial, humor & security rules (git-ignored)
├── .gitignore                    # Ignores OS artifacts, .env, and local GEMINI.md
└── docs/                         # GitHub Pages deployable root (no.gpurg.com)
    ├── index.html                # Centered app shell, strict CSP & 5-Pillar Legal Modal
    ├── 404.html                  # Hardened 404 page
    ├── CNAME                     # no.gpurg.com
    ├── .nojekyll                 # Bypass Jekyll processing
    ├── robots.txt                # User-agent: * / Disallow: /
    ├── .well-known/
    │   └── security.txt          # RFC 9116 security contact
    ├── css/
    │   └── styles.css            # Tactile UI, Dark/Light themes & severity color palette
    └── js/
        ├── app.js                # State machine, Dark/Light toggle, #slug replay
        ├── tree.js               # TREE_NODES & SCENARIOS registry
        └── minigames.js          # 3-second interactive widgets
```

---

## 4. Security, Privacy & Legal Governance

- **Zero External Requests & Strict CSP:** Enforces `default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'` and `referrer="no-referrer"`. Uses native system font stacks (`system-ui`, `ui-monospace`), inline SVG, and WebAudio API synthesis.
- **Zero Cookies & Zero Client Storage (ePrivacy Art. 5(3) Exempt):** Zero HTTP cookies, zero `localStorage`, zero `sessionStorage`, zero `IndexedDB`. All state lives in volatile RAM and client-side URL hash fragments (`#slug`).
- **Non-Affiliation, Nominative Fair Use & Credits:** Independent personal initiative by **Giulio Purgatorio** (`gpurg.com`), not affiliated with or endorsed by any employer, client, academic institution, or technology vendor. Referenced trademarks (AWS, Amazon Web Services, CloudWatch, CloudTrail, Route53, S3, SQS, EventBridge, EC2, IAM, HashiCorp Terraform, Apache Kafka, Google) belong to their respective owners and are used strictly under Nominative Fair Use. Editorial inspiration credits: [nohello.net](https://nohello.net), [dontasktoask.com](https://dontasktoask.com), and [xyproblem.info](https://xyproblem.info).
- **License:** Self-developed HTML5, CSS3, and Vanilla ES6+ JavaScript released under the **MIT License**, provided strictly `"AS IS"` without warranty of any kind.
