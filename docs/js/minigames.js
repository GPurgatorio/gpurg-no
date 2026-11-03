/* ==========================================================================
   NO.GPURG.COM - INTERACTIVE SCENARIO WIDGETS (minigames.js)
   ========================================================================== */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderForYesterdayWidget(container, sfx, startWithStagingSkipped) {
  let forceDeployed = false;

  const factors = [
    {
      id: "req",
      label: "Translate the vague two-liner into actual requirements",
      mins: 30,
      on: true
    },
    {
      id: "iam",
      label: "Check blast radius, IAM least privilege & PR review",
      mins: 45,
      on: true
    },
    {
      id: "stg",
      label: "Deploy & validate in non-prod + run automated tests",
      mins: 30,
      on: !startWithStagingSkipped,
      isStaging: true
    },
    {
      id: "cicd",
      label: "CI/CD pipeline, Terraform plan/apply & rollback check",
      mins: 25,
      on: true
    }
  ];

  const readout = el("div", "readout-box");
  readout.style.marginTop = "0";
  const rTitle = el("div", "readout-title", '"5-minute" estimate vs reality:');
  const bigEta = el("div", "counter-big", "");
  const subEta = el("div", "readout-value", "");
  const yoloActionWrap = el("div", "yolo-action-wrap");
  readout.append(rTitle, bigEta, subEta, yoloActionWrap);

  const list = el("div", "multiplier-list");

  function formatDuration(mins) {
    if (mins < 60) return mins + "m";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? h + "h " + m + "m" : h + "h";
  }

  function renderEta() {
    list.textContent = "";
    yoloActionWrap.textContent = "";
    let extraMins = 0;
    let skippedStaging = false;

    factors.forEach((f) => {
      if (f.on) extraMins += f.mins;
      if (f.isStaging && !f.on) skippedStaging = true;

      const row = el(
        "button",
        "friction-row" + (f.on ? " active" : "") + (f.isStaging && !f.on ? " yolo-danger" : "")
      );
      row.type = "button";
      row.setAttribute("aria-pressed", String(f.on));
      const txt = el("span", "", (f.on ? "✓ " : "✕ ") + f.label);
      const delta = el("span", "friction-delta", "+" + f.mins + "m");
      row.append(txt, delta);

      row.addEventListener("click", () => {
        f.on = !f.on;
        if (f.isStaging && f.on) {
          forceDeployed = false;
        }
        if (f.isStaging && !f.on) {
          sfx.buzz();
        } else {
          sfx.click(f.on ? 540 : 320, 25);
        }
        renderEta();
      });

      list.appendChild(row);
    });

    if (skippedStaging) {
      bigEta.textContent = "🚨 YOLO PROD MODE";
      bigEta.style.color = "var(--tone-danger)";
      subEta.textContent =
        "Non-prod and automated tests disabled. If a regression slips into production now, there is no safety net to catch it before users do.";

      const forceBtn = el(
        "button",
        "tactile-btn btn-accent",
        "Force deploy anyway (Friday 17:30)"
      );
      forceBtn.type = "button";
      forceBtn.style.marginTop = "0.75rem";

      forceBtn.addEventListener("click", () => {
        sfx.buzz();
        forceDeployed = true;
        renderEta();
      });

      yoloActionWrap.appendChild(forceBtn);

      if (forceDeployed) {
        const crashUl = el("ul", "cmp-list");
        crashUl.style.marginTop = "0.75rem";
        const crashItems = [
          '17:31 - "5-minute" fix merged straight to prod.',
          "17:34 - Terraform state locked, IAM broken, HTTP 502.",
          '17:42 - In chat: "Wait, why didn\'t the tests catch this?!"',
          "21:45 - Still on a call rolling back by hand while everyone else logged off."
        ];
        crashItems.forEach((item) => {
          crashUl.appendChild(el("li", "", item));
        });
        yoloActionWrap.appendChild(crashUl);
      }
    } else {
      bigEta.style.color = "var(--tone-warn)";
      const totalMins = 5 + extraMins;
      if (extraMins === 0) {
        bigEta.textContent = "5 minutes (on localhost)";
        subEta.textContent = "Zero context check, zero review, zero tests, zero pipelines.";
      } else {
        const mult = Math.round(totalMins / 5);
        bigEta.textContent = "~" + formatDuration(totalMins) + " realistic (" + mult + "× estimate)";
        subEta.textContent =
          "5 minutes to write the line + " + formatDuration(extraMins) + " of real engineering.";
      }
    }
  }

  container.append(readout, list);
  renderEta();
}

const WIDGET_REGISTRY = {
  /* ------------------------------------------------------------------------
     1. #pick2 - FAST / GOOD / CHEAP MECHANICAL SWITCHES + ACCEPT 2 OF 3
     ------------------------------------------------------------------------ */
  "widget-pick2": function mountPick2(container, sfx) {
    const state = {
      active: ["FAST", "GOOD"]
    };

    const consequences = {
      "FAST+GOOD": "Fast + Good -> [Cheap] snaps off: top priority now, other backlog tasks get paused.",
      "FAST+CHEAP": "Fast + Cheap -> [Good] snaps off: quick tactical workaround (technical debt to clean up later).",
      "GOOD+CHEAP": "Good + Cheap -> [Fast] snaps off: engineered properly during normal capacity.",
      one: "1 of 2 selected.",
      zero: "Pick up to 2 constraints."
    };

    const specs = [
      { id: "FAST", sub: "Immediate" },
      { id: "GOOD", sub: "Done right" },
      { id: "CHEAP", sub: "Zero cost" }
    ];

    const rack = el("div", "pick2-rack");
    const switchEls = {};

    const readout = el("div", "readout-box");
    const rTitle = el("div", "readout-title", "Active constraints:");
    const rVal = el("div", "readout-value", "");
    const actionWrap = el("div", "");
    actionWrap.style.marginTop = "0.85rem";
    readout.append(rTitle, rVal, actionWrap);

    function computeKey(arr) {
      const set = new Set(arr);
      if (set.has("FAST") && set.has("GOOD")) return "FAST+GOOD";
      if (set.has("FAST") && set.has("CHEAP")) return "FAST+CHEAP";
      if (set.has("GOOD") && set.has("CHEAP")) return "GOOD+CHEAP";
      return "";
    }

    function renderSwitches() {
      specs.forEach((s) => {
        const isOn = state.active.includes(s.id);
        const unit = switchEls[s.id];
        unit.classList.toggle("is-on", isOn);
        unit.setAttribute("aria-pressed", String(isOn));
        unit.querySelector(".switch-state-text").textContent = isOn ? "ON" : "OFF";
      });

      actionWrap.textContent = "";

      if (state.active.length === 2) {
        const key = computeKey(state.active);
        rVal.textContent = consequences[key] || "";

        const pairLabel = key.replace("+", " + ");
        const acceptBtn = el(
          "button",
          "tactile-btn btn-accent",
          "Accept " + pairLabel + " -> Proceed"
        );
        acceptBtn.type = "button";
        acceptBtn.addEventListener("click", () => {
          sfx.beepSuccess();
          window.dispatchEvent(
            new CustomEvent("no:approve", { detail: { pick2: pairLabel } })
          );
        });
        actionWrap.appendChild(acceptBtn);
      } else if (state.active.length === 1) {
        rVal.textContent = consequences.one;
      } else {
        rVal.textContent = consequences.zero;
      }
    }

    function toggleSwitch(id) {
      const idx = state.active.indexOf(id);
      if (idx !== -1) {
        state.active.splice(idx, 1);
        sfx.click(320, 25);
      } else {
        if (state.active.length >= 2) {
          state.active.shift();
          sfx.clack();
        } else {
          sfx.click(540, 25);
        }
        state.active.push(id);
      }
      renderSwitches();
    }

    specs.forEach((s) => {
      const unit = el("button", "mech-switch-unit");
      unit.type = "button";

      const title = el("span", "mech-switch-title", s.id);
      const sub = el("div", "mech-switch-sub", s.sub);
      const well = el("div", "switch-well");
      const actuator = el("div", "switch-actuator");
      well.appendChild(actuator);
      const stateTxt = el("div", "switch-state-text", "OFF");

      unit.append(title, sub, well, stateTxt);
      unit.addEventListener("click", () => toggleSwitch(s.id));
      switchEls[s.id] = unit;
      rack.appendChild(unit);
    });

    container.append(rack, readout);
    renderSwitches();
  },

  /* ------------------------------------------------------------------------
     2. #missing-infos - DIAGNOSTIC CHECKLIST INTERLOCK
     ------------------------------------------------------------------------ */
  "widget-missing-infos": function mountMissingInfos(container, sfx) {
    const checks = [
      { id: "err", label: "Error & related traces", on: false },
      { id: "env", label: "Environment & service", on: false },
      { id: "chg", label: "Other info (reproducible, timeframe, ...)", on: false }
    ];

    const strip = el("div", "interlock-strip");
    const pillsWrap = el("div", "interlock-leds");
    const pingBtn = el("button", "tactile-btn btn-accent", "Send message");
    pingBtn.type = "button";

    const readout = el("div", "readout-box");
    const rTitle = el("div", "readout-title", "Diagnostic checklist:");
    const rVal = el(
      "div",
      "readout-value",
      "Check the 3 minimum details above before sending."
    );
    readout.append(rTitle, rVal);

    function renderPills() {
      pillsWrap.textContent = "";
      let allOn = true;
      checks.forEach((c) => {
        if (!c.on) allOn = false;
        const pill = el("button", "check-pill" + (c.on ? " is-checked" : ""));
        pill.type = "button";
        const icon = el("span", "", c.on ? "✓" : "✕");
        const txt = el("span", "", c.label);
        pill.append(icon, txt);
        pill.addEventListener("click", () => {
          c.on = !c.on;
          sfx.click(c.on ? 620 : 300, 25);
          renderPills();
        });
        pillsWrap.appendChild(pill);
      });

      if (allOn) {
        rVal.textContent =
          "All 3 ready. (80% of the time, gathering #3 makes you spot the bug yourself.)";
      }
    }

    pingBtn.addEventListener("click", () => {
      const missing = checks.filter((c) => !c.on);
      if (missing.length > 0) {
        sfx.buzz();
        rVal.textContent =
          "Blocked: missing " + missing.length + " key details (45m of back-and-forth guaranteed).";
      } else {
        sfx.beepSuccess();
        rVal.textContent = "Approved! Average fix time with these details: ~3 minutes.";
      }
    });

    strip.append(pillsWrap, pingBtn);
    container.append(strip, readout);
    renderPills();
  },

  /* ------------------------------------------------------------------------
     3. #no-agenda - LIVE CONTEXT-SWITCH TAXIMETER
     ------------------------------------------------------------------------ */
  "widget-no-agenda": function mountNoAgenda(container, sfx) {
    let attendees = 4;
    let secondsOnPage = 0;

    const grid = el("div", "taximeter-panel");

    const leftBox = el("div", "readout-box");
    leftBox.style.marginTop = "0";
    const tTitle = el("div", "readout-title", "Real cost of a quick call:");
    const bigCounter = el("div", "counter-big", "");
    const subReadout = el("div", "readout-value", "");

    const stepper = el("div", "stepper-row");
    const btnMinus = el("button", "tactile-btn btn-sm", "-");
    btnMinus.type = "button";
    const countLabel = el("span", "", "");
    const btnPlus = el("button", "tactile-btn btn-sm", "+");
    btnPlus.type = "button";
    stepper.append(btnMinus, countLabel, btnPlus);

    leftBox.append(tTitle, bigCounter, subReadout, stepper);

    const rightBox = el("div", "chat-sim-panel");
    const rHeader = el("div", "readout-title", "Actual timeline:");
    const l1 = el("div", "chat-line", '00-04m: "Can you hear me? Can you see my screen?"');
    const l2 = el("div", "chat-line", "04-15m: Background that fits in 3 written lines");
    const l3 = el(
      "div",
      "chat-line",
      '15-20m: "Okay, send me the link in chat and I\'ll check"'
    );
    const liveLine = el("div", "verdict-quote", "");
    liveLine.style.marginTop = "0.5rem";

    rightBox.append(rHeader, l1, l2, l3, liveLine);
    grid.append(leftBox, rightBox);
    container.appendChild(grid);

    function renderTaximeter() {
      const totalMins = attendees * (20 + 23);
      const hrs = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      bigCounter.textContent = hrs + "h " + String(mins).padStart(2, "0") + "m burned";
      countLabel.textContent = "People: " + attendees;
      subReadout.textContent = attendees + " × (20m call + 23m focus recovery)";
    }

    function renderTimer() {
      liveLine.textContent =
        "Time on page: " + secondsOnPage + "s (enough to type it in chat).";
    }

    btnMinus.addEventListener("click", () => {
      if (attendees > 2) {
        attendees--;
        sfx.click(400, 20);
        renderTaximeter();
      }
    });

    btnPlus.addEventListener("click", () => {
      if (attendees < 16) {
        attendees++;
        sfx.click(580, 20);
        renderTaximeter();
      }
    });

    renderTaximeter();
    renderTimer();

    const interval = setInterval(() => {
      secondsOnPage++;
      renderTimer();
    }, 1000);

    return function cleanup() {
      clearInterval(interval);
    };
  },

  /* ------------------------------------------------------------------------
     4. #for-yesterday & #prod-on-friday - MERGED 5-MIN & SKIP-NONPROD WIDGET
     ------------------------------------------------------------------------ */
  "widget-for-yesterday": function mountForYesterday(container, sfx) {
    renderForYesterdayWidget(container, sfx, false);
  },

  "widget-prod-on-friday": function mountProdOnFriday(container, sfx) {
    renderForYesterdayWidget(container, sfx, true);
  },

  /* ------------------------------------------------------------------------
     5. #rtfm - INTERACTIVE SEARCH VS CHAT SIMULATOR
     ------------------------------------------------------------------------ */
  "widget-rtfm": function mountRtfm(container, sfx) {
    const modes = [
      {
        title: "💬 Ask & wait",
        badge: "~40 min",
        step1Label: "10:00 - Your message",
        step1Text: '"How does X work / why does it give this error?"',
        step2Label: "10:01 -> 10:39 - Waiting",
        step2Text:
          "** You wait until I'm free. When I'm finally there, I see that pasting the sanitized question or error into the docs, Google, or an AI gives the answer right away. **",
        step3Label: "10:40 - Result",
        step3Text: "You waited 40 minutes for something you could have unblocked in 10 seconds.",
        isGood: false
      },
      {
        title: "⚡ Search on your own",
        badge: "~10 sec",
        step1Label: "10:00:00 - Self-search",
        step1Text: "Paste the question or sanitized error into official docs, Google, or AI.",
        step2Label: "10:00:10 - Test",
        step2Text: "Solved in 10 seconds without waiting on anyone.",
        step3Label: "Still failing anyway?",
        step3Text:
          "Then you've already read the docs, tried on your own, and have concrete errors to share.",
        isGood: true
      }
    ];

    const tabsWrap = el("div", "case-tabs");
    const stackWrap = el("div", "xy-cards-stack");
    const tabBtns = [];

    function renderMode(idx) {
      tabBtns.forEach((b, i) => b.classList.toggle("is-active", i === idx));
      stackWrap.textContent = "";

      const m = modes[idx];

      const c1 = el("div", "xy-step-card " + (m.isGood ? "xy-good" : "xy-bad"));
      c1.append(el("div", "xy-step-label", m.step1Label), el("div", "xy-step-text", m.step1Text));

      const c2 = el("div", "xy-step-card " + (m.isGood ? "xy-good" : "xy-bad"));
      c2.append(el("div", "xy-step-label", m.step2Label), el("div", "xy-step-text", m.step2Text));

      const c3 = el("div", "xy-step-card xy-fallout");
      c3.append(el("div", "xy-step-label", m.step3Label), el("div", "xy-step-text", m.step3Text));

      if (m.isGood) {
        const proceedBtn = el(
          "button",
          "tactile-btn btn-accent",
          "Yes, help me please!"
        );
        proceedBtn.type = "button";
        proceedBtn.style.marginTop = "0.5rem";
        proceedBtn.style.alignSelf = "center";
        proceedBtn.addEventListener("click", () => {
          sfx.beepSuccess();
          window.dispatchEvent(new CustomEvent("no:approve"));
        });
        c3.appendChild(proceedBtn);
      }

      stackWrap.append(c1, c2, c3);
    }

    modes.forEach((m, idx) => {
      const btn = el("button", "case-tab-btn" + (idx === 0 ? " is-active" : ""));
      btn.type = "button";
      const lbl = el("span", "", m.title);
      const bdg = el("span", "case-tab-badge", m.badge);
      btn.append(lbl, bdg);
      btn.addEventListener("click", () => {
        sfx.click(idx === 1 ? 580 : 380, 22);
        renderMode(idx);
      });
      tabBtns.push(btn);
      tabsWrap.appendChild(btn);
    });

    container.append(tabsWrap, stackWrap);
    renderMode(0);
  },

  /* ------------------------------------------------------------------------
     6. #xy-problem - PROMINENT REAL-WORLD CASE TABS
     ------------------------------------------------------------------------ */
  "widget-xy-problem": function mountXyProblem(container, sfx) {
    const cases = [
      {
        title: "🗄️ Case 1: Custom cluster vs managed queue",
        badge: "1 / 2",
        xAsk: '"Can you deploy a self-hosted Kafka cluster on EC2 by tomorrow?"',
        yDesign:
          '"We need to decouple 200 background events/min between two services: is SQS/EventBridge enough or do we need a broker?"',
        fallout:
          "Weeks spent patching brokers and managing disks for a workload that a serverless queue handles for $1/month."
      },
      {
        title: "🔓 Case 2: Security rule vs root cause",
        badge: "2 / 2",
        xAsk: '"Can you open 0.0.0.0/0 (or grant AdministratorAccess) so our job works?"',
        yDesign:
          '"Our worker gets a timeout or AccessDenied calling service B: which specific route or IAM permission is missing?"',
        fallout:
          "Security guardrails bypassed in production instead of allowing the single route or IAM action actually needed."
      }
    ];

    const tabsWrap = el("div", "case-tabs");
    const stackWrap = el("div", "xy-cards-stack");
    const tabBtns = [];

    function renderCase(idx) {
      tabBtns.forEach((b, i) => b.classList.toggle("is-active", i === idx));
      stackWrap.textContent = "";

      const c = cases[idx];

      const cardBad = el("div", "xy-step-card xy-bad");
      cardBad.append(
        el("div", "xy-step-label", "❌ Execution requested (X)"),
        el("div", "xy-step-text", c.xAsk)
      );

      const cardGood = el("div", "xy-step-card xy-good");
      cardGood.append(
        el("div", "xy-step-label", "✅ Design question (Y)"),
        el("div", "xy-step-text", c.yDesign)
      );

      const cardFallout = el("div", "xy-step-card xy-fallout");
      cardFallout.append(
        el("div", "xy-step-label", "💥 Fallout without design"),
        el("div", "xy-step-text", c.fallout)
      );

      stackWrap.append(cardBad, cardGood, cardFallout);
    }

    cases.forEach((c, idx) => {
      const btn = el("button", "case-tab-btn" + (idx === 0 ? " is-active" : ""));
      btn.type = "button";
      const lbl = el("span", "", c.title);
      const bdg = el("span", "case-tab-badge", c.badge);
      btn.append(lbl, bdg);
      btn.addEventListener("click", () => {
        sfx.click(520, 20);
        renderCase(idx);
      });
      tabBtns.push(btn);
      tabsWrap.appendChild(btn);
    });

    container.append(tabsWrap, stackWrap);
    renderCase(0);
  },

  /* ------------------------------------------------------------------------
     7. #wheel - HYPOTHESIS WHEEL VS DIAGNOSTIC CHECKS
     ------------------------------------------------------------------------ */
  "widget-wheel": function mountWheel(container, sfx) {
    const excuses = [
      {
        label: "It's DNS",
        check: "Run dig +trace or check Route53 logs."
      },
      {
        label: "Console ClickOps",
        check: "Check CloudTrail for manual console changes."
      },
      {
        label: "Missing IAM",
        check: "Search CloudTrail for AccessDenied."
      },
      {
        label: "Expired TLS cert",
        check: "Check ACM / ALB certificate expiration."
      },
      {
        label: "Works on my machine",
        check: "Compare env vars and image digest with non-prod."
      },
      {
        label: "Quota limit",
        check: "Check ThrottledRequests and Service Quotas."
      },
      {
        label: "Wrong region",
        check: "Verify AWS_REGION (eu-west-1 vs us-east-1)."
      },
      {
        label: "Firewall / SG",
        check: "Check VPC Flow Logs for REJECT records."
      }
    ];

    let activeIndex = 0;
    let spinning = false;
    let spinTimer = null;

    const consoleGrid = el("div", "wheel-console");
    const slotsGrid = el("div", "wheel-slots");
    const slotEls = [];

    excuses.forEach((ex, i) => {
      const s = el("div", "wheel-slot" + (i === 0 ? " active-slot" : ""), ex.label);
      slotEls.push(s);
      slotsGrid.appendChild(s);
    });

    const rightPanel = el("div", "readout-box");
    rightPanel.style.marginTop = "0";
    const rTitle = el("div", "readout-title", "Random excuse vs actual check:");
    const rVal = el("div", "readout-value", excuses[0].check);
    const spinBtn = el("button", "tactile-btn btn-accent", "Spin the wheel");
    spinBtn.type = "button";
    spinBtn.style.marginTop = "0.85rem";
    rightPanel.append(rTitle, rVal, spinBtn);

    function highlightSlot(idx) {
      slotEls.forEach((node, i) => {
        node.classList.toggle("active-slot", i === idx);
      });
      rVal.textContent = excuses[idx].label + " -> " + excuses[idx].check;
    }

    spinBtn.addEventListener("click", () => {
      if (spinning) return;
      spinning = true;
      let stepsRemaining = 14 + Math.floor(Math.random() * 8);
      let delay = 55;

      function step() {
        activeIndex = (activeIndex + 1) % excuses.length;
        highlightSlot(activeIndex);
        sfx.click(420 + (activeIndex % 4) * 60, 14);
        stepsRemaining--;
        if (stepsRemaining > 0) {
          delay += 14;
          spinTimer = setTimeout(step, delay);
        } else {
          spinning = false;
        }
      }
      step();
    });

    consoleGrid.append(slotsGrid, rightPanel);
    container.appendChild(consoleGrid);

    return function cleanup() {
      if (spinTimer) clearTimeout(spinTimer);
    };
  },

  /* ------------------------------------------------------------------------
     8. #approved - READY-TO-PASTE REQUEST TEMPLATE
     ------------------------------------------------------------------------ */
  "widget-approved": function mountApproved(container, sfx, extraContext) {
    sfx.beepSuccess();

    const box = el("div", "readout-box");
    box.style.marginTop = "0";

    const title = el("div", "readout-title", "Ready-to-paste template:");

    const chosenPriority =
      extraContext && extraContext.pick2
        ? extraContext.pick2
        : "<max 2 of 3 between Fast, Good, Cheap>";

    const bulletItems = [
      "Root problem (Y): <1 sentence>",
      "Environment & service: <non-prod / prod>",
      "Analysis & logs: <what was tried + error>",
      "Priority: " + chosenPriority
    ];

    const ul = el("ul", "cmp-list");
    bulletItems.forEach((item) => ul.appendChild(el("li", "", item)));

    const templateText = bulletItems.map((item) => "- " + item).join("\n");

    const actions = el("div", "chip-row");
    actions.style.marginTop = "0.85rem";

    const copyBtn = el("button", "tactile-btn btn-accent", "Copy template");
    copyBtn.type = "button";
    copyBtn.addEventListener("click", () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(templateText).then(() => {
          copyBtn.textContent = "Copied ✓";
          setTimeout(() => {
            copyBtn.textContent = "Copy template";
          }, 1800);
        });
      }
      sfx.click(680, 25);
    });

    actions.append(copyBtn);
    box.append(title, ul, actions);
    container.appendChild(box);
  }
};

Object.freeze(WIDGET_REGISTRY);
