/* ==========================================================================
   NO.GPURG.COM - DECISION TREE & SCENARIO REGISTRY (tree.js)
   ========================================================================== */

const TREE_NODES = {
  /* ------------------------------------------------------------------------
     STEP 1: INITIAL BRANCHING
     ------------------------------------------------------------------------ */
  "gate-01": {
    id: "gate-01",
    prompt: "Why are you writing to me?",
    subtext: "Before you take this link personally: it's a friendly shortcut for the most common request traps in engineering. Pick your scenario to see what's missing (and how to get a fast Yes).",
    options: [
      {
        id: "opt-broken",
        tone: "danger",
        label: "Something is broken / Urgent",
        quote: "I got an error (or need an urgent fix right now)!",
        nextGate: "gate-02-incident"
      },
      {
        id: "opt-question",
        tone: "info",
        label: "Do you have 5 minutes?",
        quote: "Quick question or quick call",
        nextGate: "gate-02-question"
      },
      {
        id: "opt-task",
        tone: "warn",
        label: "New task, change, or release",
        quote: "Can you build or change this for me?",
        nextGate: "gate-02-scope"
      }
    ]
  },

  /* ------------------------------------------------------------------------
     BRANCH 1: INCIDENT, BUGS & URGENT HOTFIXES
     ------------------------------------------------------------------------ */
  "gate-02-incident": {
    id: "gate-02-incident",
    prompt: "What context do we have so far?",
    subtext: "Real production outages have an incident channel—not this link. For everything else (like a random 5xx in non-prod or an urgent request), I need a minimum of context to help you.",
    options: [
      {
        id: "opt-no-logs",
        tone: "danger",
        label: "Two vague lines / screenshot (maybe cropped)",
        quote: "It doesn't work!",
        verdictSlug: "missing-infos"
      },
      {
        id: "opt-blame",
        tone: "warn",
        label: "I don't know, can you check?",
        quote: "We haven't checked the logs yet, we're hoping you can look for us",
        verdictSlug: "wheel"
      },
      {
        id: "opt-inc-yolo",
        tone: "danger",
        label: "It's a 5-minute urgent change: patch production right now",
        quote: "We need it for yesterday - skip non-prod and automated tests",
        verdictSlug: "for-yesterday"
      },
      {
        id: "opt-inc-complete",
        tone: "success",
        label: "I did my part of the analysis and have logs + context ready",
        quote: "Target environment, recent changes, and what I already tried",
        verdictSlug: "approved"
      }
    ]
  },

  /* ------------------------------------------------------------------------
     BRANCH 2: DO YOU HAVE 5 MINUTES? (QUESTIONS & VOICE CALLS)
     ------------------------------------------------------------------------ */
  "gate-02-question": {
    id: "gate-02-question",
    prompt: "What are these 5 minutes for?",
    subtext: "I'm probably heads-down in another task right now—let's find the fastest way to unblock you.",
    options: [
      {
        id: "opt-no-docs",
        tone: "warn",
        label: "How does X work?",
        quote: "Asking in chat before checking the docs, Google, or an AI",
        verdictSlug: "rtfm"
      },
      {
        id: "opt-quick-call",
        tone: "danger",
        label: "I'll explain on a voice call",
        quote: "Unscheduled call or the when-are-you-free chat dance",
        verdictSlug: "no-agenda"
      },
      {
        id: "opt-async-ready",
        tone: "success",
        label: "Checked docs/AI, tried on my own, and wrote everything down",
        quote: "Clear written message (or calendar slot booked with an agenda)",
        verdictSlug: "approved"
      }
    ]
  },

  /* ------------------------------------------------------------------------
     BRANCH 3: NEW TASK, CHANGE, OR RELEASE (DESIGN -> ENGAGEMENT RULES)
     ------------------------------------------------------------------------ */
  "gate-02-scope": {
    id: "gate-02-scope",
    prompt: "Do I have all the info to handle this request?",
    subtext: "Shipping != designing. If the root problem isn't clear, I might build something that doesn't solve what you actually need. You're welcome to drive the design, or if you're in doubt, let's design it together upfront!",
    options: [
      {
        id: "opt-xy-task",
        tone: "warn",
        label: "Can you deliver X...",
        quote: "... to solve a root problem Y (that we haven't discussed yet)",
        verdictSlug: "xy-problem"
      },
      {
        id: "opt-scope-ready",
        tone: "success",
        label: "The root problem (Y) and design ownership are clear",
        quote: "We know what problem we're solving and who owns the design",
        nextGate: "gate-03-engagement"
      }
    ]
  },

  "gate-03-engagement": {
    id: "gate-03-engagement",
    prompt: "Does it match our rules of engagement?",
    subtext: "Agreed channel, realistic timelines, and sustainable priorities.",
    options: [
      {
        id: "opt-unrealistic",
        tone: "danger",
        label: "Outside the agreed channel, or we need it Fast + Good + Cheap",
        quote: "Random chat ping, or demanding top speed, top quality, and zero trade-offs",
        verdictSlug: "pick2"
      },
      {
        id: "opt-engagement-ok",
        tone: "success",
        label: "Sent via the agreed channel with realistic timelines",
        quote: "Tracked properly with realistic trade-offs",
        verdictSlug: "approved"
      }
    ]
  }
};

/* ==========================================================================
   PLUG-AND-PLAY SCENARIOS REGISTRY (#slug -> Replay Path + Interactive Gag)
   ========================================================================== */

const SCENARIOS = {
  "missing-infos": {
    slug: "missing-infos",
    verdictWord: "NO.",
    isApproved: false,
    title: "Reporting != dumping",
    quote: "A bug report can't be vague lines or a (cropped?) screenshot",
    summary: "Saving 30 seconds by omitting logs, environment, and recent changes turns a 3-minute fix into a 45-minute interrogation. If you're reporting something (and you're not a carrier pigeon), you have more context than I do: pass it along!",
    replayPath: [
      { gateId: "gate-01", optionId: "opt-broken" },
      { gateId: "gate-02-incident", optionId: "opt-no-logs" }
    ],
    widgetId: "widget-missing-infos",
    comparison: {
      badTitle: "❌ Interrogation mode (45m lost)",
      badList: [
        'You: "Hi, the staging deploy is failing—is AWS broken?"',
        'Giulio: "Which service and pipeline step failed?"',
        'You: "Payments API in staging (here\'s a cropped screenshot of the red badge)."',
        'Giulio: "What does the Terraform/CloudWatch log say? Did a recent PR change IAM, networking, or secrets?"'
      ],
      goodTitle: "✅ Actionable engineering context (3m fix)",
      goodList: [
        'Context: "Payments API (staging) fails at the ECS deploy step after PR #142."',
        'Evidence: "Task log shows AccessDenied on kms:Decrypt for the new secrets key."',
        'Ask: "Should we add the KMS grant to the task role module, or enable self-service for our team on staging so you\'re not our bottleneck?"'
      ]
    }
  },

  "wheel": {
    slug: "wheel",
    verdictWord: "NO.",
    isApproved: false,
    title: "Guessing != debugging",
    quote: "Is it DNS? Is AWS down? Did someone touch the firewall?",
    summary: "Unless production is genuinely on fire, jumping in without a single log means starting from pure guesswork. If you're not sure where to look, let's check the logs together once so you're autonomous next time. Otherwise... spin the wheel!",
    replayPath: [
      { gateId: "gate-01", optionId: "opt-broken" },
      { gateId: "gate-02-incident", optionId: "opt-blame" }
    ],
    widgetId: "widget-wheel",
    comparison: {
      badTitle: "❌ War-room guessing",
      badList: [
        "Blaming AWS, DNS, or networking with zero logs",
        "Dragging 10 people into a call to speculate",
        'Asking "did someone touch something?" instead of checking history'
      ],
      goodTitle: "✅ Data-first debugging",
      goodList: [
        "Check ALB / CloudWatch logs for the real error",
        "Check CloudTrail or pipeline history for recent changes",
        "Bring the failing evidence to the right owner"
      ]
    }
  },

  "for-yesterday": {
    slug: "for-yesterday",
    verdictWord: "NO.",
    isApproved: false,
    title: "Urgency != skipping engineering",
    quote: "Not every 5xx or late request is a real production outage",
    summary: "Real emergencies exist, but treating every late request like one means bypassing non-prod, reviews, and tests. When an untested '5-minute fix' breaks, whoever shipped it blind is left fixing the fallout without context.",
    replayPath: [
      { gateId: "gate-01", optionId: "opt-broken" },
      { gateId: "gate-02-incident", optionId: "opt-inc-yolo" }
    ],
    widgetId: "widget-for-yesterday",
    comparison: {
      badTitle: "❌ False-alarm urgency",
      badList: [
        'Assuming an infrastructure change takes "just 5 minutes"',
        "Bypassing non-prod validation to save half an hour",
        'Skipping tests today and asking "why didn\'t tests catch this?" tomorrow',
        "Pushing straight to production on Friday at 17:30"
      ],
      goodTitle: "✅ Safe, fast release",
      goodList: [
        "Account for IAM, CI/CD, and review time",
        "Validate in non-prod before touching production",
        "Ensure automated tests exist and pass",
        "Ship during normal working hours with a rollback plan"
      ]
    }
  },

  "prod-on-friday": {
    slug: "prod-on-friday",
    verdictWord: "NO.",
    isApproved: false,
    title: "Urgency != skipping non-prod on Friday",
    quote: "Bypassing staging right before the weekend",
    summary: "Real emergencies exist, but treating every late request like one means bypassing non-prod, reviews, and tests. When an untested '5-minute fix' breaks on Friday evening, whoever shipped it blind is left fixing the fallout alone.",
    replayPath: [
      { gateId: "gate-01", optionId: "opt-broken" },
      { gateId: "gate-02-incident", optionId: "opt-inc-yolo" }
    ],
    widgetId: "widget-prod-on-friday",
    comparison: {
      badTitle: "❌ Skipping non-prod",
      badList: [
        "Bypassing non-prod validation to save a few minutes",
        'Wondering afterwards why automated tests didn\'t catch the bug',
        "Deploying right before the weekend without a rollback check"
      ],
      goodTitle: "✅ Using non-prod",
      goodList: [
        "Verify the change in non-prod first",
        "Add the missing test case so regressions are caught",
        "Release during normal hours with a rollback plan"
      ]
    }
  },

  "rtfm": {
    slug: "rtfm",
    verdictWord: "NO.",
    isApproved: false,
    title: "Asking != skipping a 10-second search",
    quote: "How does X work? (Before checking docs, Google, or AI)",
    summary: "For basic syntax or doc questions, checking Google, an AI, or the official docs gives you an answer in 10 seconds instead of waiting 40 minutes on me. If you already searched and you're still stuck, show me what you tried and we'll solve it together!",
    replayPath: [
      { gateId: "gate-01", optionId: "opt-question" },
      { gateId: "gate-02-question", optionId: "opt-no-docs" }
    ],
    widgetId: "widget-rtfm",
    comparison: {
      badTitle: "❌ Ask & wait (40m)",
      badList: [
        'Asking "How does X work?" before running a quick search',
        "Waiting 40m for an answer sitting in paragraph #1 of the docs",
        "Sharing raw errors without checking what they mean first"
      ],
      goodTitle: "✅ Search, try, then ask",
      goodList: [
        "Search Google / AI / official docs with sanitized text (~10s)",
        "Try the documented solution on your own",
        "If it fails, share what you read, what you tried, and the error"
      ]
    }
  },

  "no-agenda": {
    slug: "no-agenda",
    verdictWord: "NO.",
    isApproved: false,
    title: "Improvising on a call != being faster",
    quote: "It's faster if I explain on a quick voice call",
    summary: "I'm happy to jump on a call when needed, but an unscheduled call while I'm deep in another task forces a context switch with zero preparation. Drop 3 lines in chat first (or book a calendar slot with an agenda) so I can actually help you faster.",
    replayPath: [
      { gateId: "gate-01", optionId: "opt-question" },
      { gateId: "gate-02-question", optionId: "opt-quick-call" }
    ],
    widgetId: "widget-no-agenda",
    comparison: {
      badTitle: "❌ Context-switch ambush",
      badList: [
        'Pinging "Are you free right now?" with zero context',
        'The "When are you free? Tuesday? No, Thursday?" chat dance',
        "Burning 20m of call + 23m of focus recovery for 3 lines of text"
      ],
      goodTitle: "✅ Written or scheduled",
      goodList: [
        "Quick: write context, doubt, and proposal in 3 lines",
        "Complex: book a calendar slot directly with a written agenda",
        'Urgent issue: pick "Something is broken / Urgent" at step 1'
      ]
    }
  },

  "xy-problem": {
    slug: "xy-problem",
    verdictWord: "NO.",
    isApproved: false,
    title: "Shipping != designing (the XY problem)",
    quote: "Can you deliver X... to solve a root problem Y (that we haven't discussed yet)",
    summary: "Architecture starts from the root problem (Y). If you share the real goal upfront, we can pick the cleanest solution together; if we only execute X blindly, we risk spending days building something that still doesn't solve what you actually need.",
    replayPath: [
      { gateId: "gate-01", optionId: "opt-task" },
      { gateId: "gate-02-scope", optionId: "opt-xy-task" }
    ],
    widgetId: "widget-xy-problem",
    comparison: {
      badTitle: "❌ Blind execution (X)",
      badList: [
        "Asking for a specific tool or parameter without stating the goal",
        "Skipping upfront design to jump straight to implementation",
        "Discovering after deployment that X doesn't solve the real problem"
      ],
      goodTitle: "✅ Upfront design (Y)",
      goodList: [
        "State the actual requirement and current limitation",
        "Propose X as an option, not a pre-decided mandate",
        "Design together upfront so ownership is clear"
      ]
    }
  },

  "pick2": {
    slug: "pick2",
    verdictWord: "NO.",
    isApproved: false,
    title: "Priority != wanting everything",
    quote: "Fast, Good, Cheap: pick a maximum of two",
    summary: "Even when the design is clear, dropping tasks in random chats or expecting everything to be urgent, bulletproof, and zero-cost breaks the workflow. Use the agreed channel and pick up to two priorities below so we can meet halfway.",
    replayPath: [
      { gateId: "gate-01", optionId: "opt-task" },
      { gateId: "gate-02-scope", optionId: "opt-scope-ready" },
      { gateId: "gate-03-engagement", optionId: "opt-unrealistic" }
    ],
    widgetId: "widget-pick2",
    comparison: {
      badTitle: "❌ Demanding all three",
      badList: [
        "Production-grade architecture by tomorrow morning",
        "Refusing to pause any other backlog task",
        "Zero technical debt and zero trade-offs"
      ],
      goodTitle: "✅ Realistic trade-offs",
      goodList: [
        "Fast + Good: top priority now, other tasks paused",
        "Fast + Cheap: quick tactical patch, rewritten later",
        "Good + Cheap: engineered properly in normal timelines"
      ]
    }
  },

  "approved": {
    slug: "approved",
    verdictWord: "YES!",
    isApproved: true,
    title: "Help me help you: unlocked",
    quote: "Docs checked, context ready, realistic trade-offs accepted",
    summary: "Your request has everything needed to solve the problem fast without wasting time for either of us.",
    replayPath: [],
    widgetId: "widget-approved",
    comparison: {
      badTitle: "Checklist passed",
      badList: [
        "Searched docs / AI and ran basic checks first",
        "Included full context, logs, and environment",
        "Started from the root problem (Y) with realistic timing"
      ],
      goodTitle: "Next step",
      goodList: [
        "Async: send your complete written message right away",
        "Sync: book a slot directly on the calendar with a written agenda"
      ]
    }
  }
};

Object.freeze(TREE_NODES);
Object.freeze(SCENARIOS);
