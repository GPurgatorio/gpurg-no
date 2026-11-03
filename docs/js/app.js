/* ==========================================================================
   NO.GPURG.COM - CORE STATE MACHINE, ROUTER & AUTO-REPLAY ENGINE (app.js)
   100% Vanilla ES6+ | Volatile RAM State | English-Only | Dark/Light Toggle
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     1. NATIVE HARDWARE BEEP SYNTHESIZER (C-Style Beep(freq, ms) via WebAudio)
     ------------------------------------------------------------------------ */
  const sfx = (function createBeepEngine() {
    let ctx = null;
    let enabled = true;

    function getCtx() {
      if (!enabled) return null;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!ctx) {
        try {
          ctx = new AudioCtx();
        } catch (_) {
          return null;
        }
      }
      return ctx;
    }

    function playOsc(audio, freq, durationMs, type, gainVal) {
      try {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        const now = audio.currentTime;
        osc.type = type || "square";
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(gainVal || 0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start(now);
        osc.stop(now + durationMs / 1000);
      } catch (_) {}
    }

    function beep(freq, durationMs, type, gainVal) {
      const audio = getCtx();
      if (!audio) return;
      if (audio.state === "running") {
        playOsc(audio, freq, durationMs, type, gainVal);
        return;
      }
      const reqTime = performance.now();
      audio
        .resume()
        .then(() => {
          if (performance.now() - reqTime < 180) {
            playOsc(audio, freq, durationMs, type, gainVal);
          }
        })
        .catch(() => {});
    }

    function unlockOnGesture() {
      const audio = getCtx();
      if (audio && audio.state === "suspended") {
        audio.resume().catch(() => {});
      }
    }

    ["pointerdown", "keydown", "touchstart"].forEach((evt) => {
      window.addEventListener(evt, unlockOnGesture, { capture: true, passive: true });
    });

    return {
      isEnabled: () => enabled,
      toggle: () => {
        enabled = !enabled;
        if (enabled) beep(580, 20, "square", 0.03);
        return enabled;
      },
      click: (freq = 480, ms = 18) => beep(freq, ms, "square", 0.025),
      clack: () => {
        beep(240, 26, "sawtooth", 0.04);
        setTimeout(() => beep(160, 32, "square", 0.035), 24);
      },
      buzz: () => {
        beep(140, 80, "sawtooth", 0.04);
        setTimeout(() => beep(115, 95, "sawtooth", 0.04), 85);
      },
      beepSuccess: () => {
        beep(523, 50, "triangle", 0.035);
        setTimeout(() => beep(659, 50, "triangle", 0.035), 55);
        setTimeout(() => beep(784, 80, "triangle", 0.04), 110);
      }
    };
  })();

  /* ------------------------------------------------------------------------
     2. VOLATILE RAM APPLICATION STATE
     ------------------------------------------------------------------------ */
  const state = {
    theme: "dark",
    currentGateId: "gate-01",
    trace: [], // Array of { gateId, optionId, tone }
    verdictSlug: null,
    verdictContext: null,
    isReplaying: false,
    replayTimers: [],
    activeWidgetCleanup: null,
    suppressesHashChange: false
  };

  /* ------------------------------------------------------------------------
     3. DOM REFERENCES
     ------------------------------------------------------------------------ */
  const dom = {
    btnResetTree: document.getElementById("btn-reset-tree"),
    btnSfxToggle: document.getElementById("btn-sfx-toggle"),
    sfxStateLabel: document.getElementById("sfx-state-label"),
    btnThemeToggle: document.getElementById("btn-theme-toggle"),
    themeStateLabel: document.getElementById("theme-state-label"),
    lightModeQuip: document.getElementById("light-mode-quip"),
    replayBanner: document.getElementById("replay-banner"),
    btnSkipReplay: document.getElementById("btn-skip-replay"),
    cheatBanner: document.getElementById("cheat-banner"),
    btnDismissCheat: document.getElementById("btn-dismiss-cheat"),
    traceSection: document.getElementById("trace-section"),
    traceList: document.getElementById("trace-list"),
    gateSection: document.getElementById("gate-section"),
    verdictSection: document.getElementById("verdict-section"),
    virtualCursor: document.getElementById("virtual-cursor"),
    privacyModal: document.getElementById("privacy-modal"),
    btnOpenPrivacy: document.getElementById("btn-open-privacy"),
    btnClosePrivacy: document.getElementById("btn-close-privacy")
  };

  /* ------------------------------------------------------------------------
     4. RENDER HELPERS
     ------------------------------------------------------------------------ */
  function clearActiveWidget() {
    if (typeof state.activeWidgetCleanup === "function") {
      state.activeWidgetCleanup();
      state.activeWidgetCleanup = null;
    }
  }

  function cancelReplayTimers() {
    state.replayTimers.forEach((id) => clearTimeout(id));
    state.replayTimers = [];
    state.isReplaying = false;
    dom.replayBanner.classList.add("hidden");
    dom.virtualCursor.classList.add("hidden");
    dom.virtualCursor.classList.remove("clicking");
  }

  function updateHashSilently(newHash) {
    const target = newHash ? "#" + newHash : window.location.pathname;
    if (window.location.hash === (newHash ? "#" + newHash : "")) return;
    state.suppressesHashChange = true;
    history.replaceState(null, "", target);
    setTimeout(() => {
      state.suppressesHashChange = false;
    }, 20);
  }

  function renderTrace() {
    dom.traceList.textContent = "";

    if (state.trace.length === 0) {
      dom.traceSection.classList.add("hidden");
      return;
    }

    dom.traceSection.classList.remove("hidden");

    state.trace.forEach((step, idx) => {
      const node = TREE_NODES[step.gateId];
      if (!node) return;
      const opt = node.options.find((o) => o.id === step.optionId);
      if (!opt) return;

      const row = el("div", "trace-row tone-" + (opt.tone || "info"));
      const left = el("div", "trace-row-left");
      const q = el("span", "trace-question", node.prompt);
      const arr = el("span", "trace-arrow", "→");
      const ans = el("span", "trace-answer", opt.label);
      left.append(q, arr, ans);

      const rewindBtn = el("button", "trace-rewind-btn", "Change");
      rewindBtn.type = "button";
      rewindBtn.addEventListener("click", () => {
        if (state.isReplaying) cancelReplayTimers();
        sfx.click(360, 20);
        rewindToStep(idx);
      });

      row.append(left, rewindBtn);
      dom.traceList.appendChild(row);
    });
  }

  function renderActiveGate() {
    dom.gateSection.textContent = "";
    if (state.verdictSlug || !state.currentGateId) {
      dom.gateSection.classList.add("hidden");
      return;
    }

    const node = TREE_NODES[state.currentGateId];
    if (!node) return;

    dom.gateSection.classList.remove("hidden");

    const lastStep = state.trace[state.trace.length - 1];
    const inheritedTone = lastStep && lastStep.tone ? " gate-tone-" + lastStep.tone : "";

    const module = el("div", "gate-module" + inheritedTone);
    const prompt = el("h2", "gate-prompt", node.prompt);
    const sub = el("p", "gate-subtext", node.subtext);
    const rack = el("div", "options-rack");

    node.options.forEach((opt) => {
      const toneClass = opt.tone ? " tone-" + opt.tone : " tone-info";
      const btn = el("button", "option-key" + toneClass);
      btn.type = "button";
      btn.setAttribute("data-option-id", opt.id);

      const content = el("div", "option-content");
      const lbl = el("span", "option-label", opt.label);
      const qt = el("span", "option-quote", opt.quote);
      content.append(lbl, qt);

      const dot = el("span", "option-dot");
      dot.setAttribute("aria-hidden", "true");

      btn.append(content, dot);
      btn.addEventListener("click", () => {
        if (state.isReplaying) return;
        sfx.click(500, 20);
        selectOption(node.id, opt.id, true);
      });

      rack.appendChild(btn);
    });

    module.append(prompt, sub, rack);
    dom.gateSection.appendChild(module);
  }

  function renderVerdict() {
    clearActiveWidget();
    dom.verdictSection.textContent = "";

    if (!state.verdictSlug) {
      dom.verdictSection.classList.add("hidden");
      return;
    }

    const scenario = SCENARIOS[state.verdictSlug];
    if (!scenario) return;

    dom.verdictSection.classList.remove("hidden");

    const card = el(
      "div",
      "verdict-card " + (scenario.isApproved ? "verdict-yes" : "verdict-no")
    );

    const top = el("div", "verdict-top");
    const headline = el("div", "verdict-headline");
    const giantWord = el("span", "verdict-giant-word", scenario.verdictWord);
    const title = el("h2", "verdict-title", scenario.title);
    headline.append(giantWord, title);

    const quote = el("div", "verdict-quote", scenario.quote);
    const summary = el("p", "verdict-summary", scenario.summary);

    top.append(headline, quote, summary);

    const gagBay = el("div", "gag-bay");
    const widgetMount = el("div", "widget-mount");
    const mountFn = WIDGET_REGISTRY[scenario.widgetId];
    if (typeof mountFn === "function") {
      const cleanup = mountFn(widgetMount, sfx, state.verdictContext);
      if (typeof cleanup === "function") {
        state.activeWidgetCleanup = cleanup;
      }
    }

    const cmpData = scenario.comparison;
    const cmpGrid = el("div", "comparison-grid");

    const badBox = el("div", "cmp-box cmp-bad");
    badBox.appendChild(el("div", "cmp-header", cmpData.badTitle));
    if (Array.isArray(cmpData.badList)) {
      const badUl = el("ul", "cmp-list");
      cmpData.badList.forEach((item) => badUl.appendChild(el("li", "", item)));
      badBox.appendChild(badUl);
    }

    const goodBox = el("div", "cmp-box cmp-good");
    goodBox.appendChild(el("div", "cmp-header", cmpData.goodTitle));
    if (Array.isArray(cmpData.goodList)) {
      const goodUl = el("ul", "cmp-list");
      cmpData.goodList.forEach((item) => goodUl.appendChild(el("li", "", item)));
      goodBox.appendChild(goodUl);
    }

    cmpGrid.append(badBox, goodBox);

    gagBay.append(widgetMount, cmpGrid);
    card.append(top, gagBay);
    dom.verdictSection.appendChild(card);
  }

  /* ------------------------------------------------------------------------
     5. TREE NAVIGATION & STEP EXECUTION
     ------------------------------------------------------------------------ */
  function selectOption(gateId, optionId, updateUrl, targetSlugOverride) {
    const node = TREE_NODES[gateId];
    if (!node) return;
    const opt = node.options.find((o) => o.id === optionId);
    if (!opt) return;

    state.trace.push({
      gateId: node.id,
      optionId: opt.id,
      tone: opt.tone || "info"
    });

    state.verdictContext = null;

    const resolvedSlug = targetSlugOverride || opt.verdictSlug;
    if (resolvedSlug) {
      state.currentGateId = null;
      state.verdictSlug = resolvedSlug;
      const sc = SCENARIOS[resolvedSlug];
      if (sc && sc.isApproved) {
        if (updateUrl) updateHashSilently("");
      } else {
        if (updateUrl) updateHashSilently(resolvedSlug);
      }
      sfx.clack();
    } else if (opt.nextGate) {
      state.currentGateId = opt.nextGate;
      state.verdictSlug = null;
    }

    renderTrace();
    renderActiveGate();
    renderVerdict();
  }

  function rewindToStep(stepIndex) {
    const targetStep = state.trace[stepIndex];
    if (!targetStep) return;
    state.trace = state.trace.slice(0, stepIndex);
    state.currentGateId = targetStep.gateId;
    state.verdictSlug = null;
    state.verdictContext = null;
    updateHashSilently("");
    renderTrace();
    renderActiveGate();
    renderVerdict();
  }

  function resetRack(clearHash) {
    cancelReplayTimers();
    clearActiveWidget();
    dom.cheatBanner.classList.add("hidden");
    state.currentGateId = "gate-01";
    state.trace = [];
    state.verdictSlug = null;
    state.verdictContext = null;
    if (clearHash) updateHashSilently("");
    renderTrace();
    renderActiveGate();
    renderVerdict();
  }

  /* ------------------------------------------------------------------------
     6. VIRTUAL CURSOR AUTO-REPLAY ENGINE (#slug)
     ------------------------------------------------------------------------ */
  function jumpDirectlyToScenario(slug) {
    cancelReplayTimers();
    const scenario = SCENARIOS[slug];
    if (!scenario) return;

    state.trace = [];
    scenario.replayPath.forEach((step) => {
      const node = TREE_NODES[step.gateId];
      if (!node) return;
      const opt = node.options.find((o) => o.id === step.optionId);
      if (!opt) return;
      state.trace.push({
        gateId: node.id,
        optionId: opt.id,
        tone: opt.tone || "info"
      });
    });

    state.currentGateId = null;
    state.verdictSlug = slug;
    renderTrace();
    renderActiveGate();
    renderVerdict();
  }

  function startAutoReplay(slug) {
    const scenario = SCENARIOS[slug];
    if (!scenario || !scenario.replayPath || scenario.replayPath.length === 0) return;

    const prefersReducedMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      jumpDirectlyToScenario(slug);
      return;
    }

    resetRack(false);
    state.isReplaying = true;
    dom.replayBanner.classList.remove("hidden");

    const startX = Math.round(window.innerWidth * 0.5);
    const startY = Math.round(Math.min(window.innerHeight * 0.25, 180));
    dom.virtualCursor.style.transform = "translate3d(" + startX + "px, " + startY + "px, 0)";
    dom.virtualCursor.classList.remove("hidden");

    const steps = scenario.replayPath;
    let delayAccumulator = 240;

    steps.forEach((step, idx) => {
      const tMove = setTimeout(() => {
        const targetBtn = dom.gateSection.querySelector(
          '[data-option-id="' + step.optionId + '"]'
        );
        if (targetBtn) {
          targetBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
          const rect = targetBtn.getBoundingClientRect();
          const targetX = Math.round(rect.left + Math.min(rect.width * 0.35, 180));
          const targetY = Math.round(rect.top + rect.height * 0.5);
          dom.virtualCursor.style.transform =
            "translate3d(" + targetX + "px, " + targetY + "px, 0)";
        }
      }, delayAccumulator);
      state.replayTimers.push(tMove);

      delayAccumulator += 520;

      const tPress = setTimeout(() => {
        const targetBtn = dom.gateSection.querySelector(
          '[data-option-id="' + step.optionId + '"]'
        );
        if (targetBtn) {
          targetBtn.classList.add("cursor-pressed");
        }
        dom.virtualCursor.classList.add("clicking");
        sfx.click(520 + idx * 60, 20);
      }, delayAccumulator);
      state.replayTimers.push(tPress);

      delayAccumulator += 210;

      const tCommit = setTimeout(() => {
        dom.virtualCursor.classList.remove("clicking");
        const isLast = idx === steps.length - 1;
        selectOption(step.gateId, step.optionId, false, isLast ? slug : null);
        if (isLast) {
          cancelReplayTimers();
          dom.verdictSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, delayAccumulator);
      state.replayTimers.push(tCommit);

      delayAccumulator += 230;
    });
  }

  /* ------------------------------------------------------------------------
     7. STRICT HASH ROUTER & ANTI-CHEAT INTERCEPTOR
     ------------------------------------------------------------------------ */
  function getHashSlug() {
    return (window.location.hash || "").replace(/^#+/, "").trim().toLowerCase();
  }

  function handleLocationHash() {
    if (state.suppressesHashChange) return;

    const slug = getHashSlug();
    if (!slug) {
      resetRack(false);
      return;
    }

    if (slug === "modal-privacy" || slug === "privacy") {
      openPrivacyModal();
      return;
    }

    const cheatSlugs = ["yes", "approved", "golden-ticket", "ok"];
    if (cheatSlugs.includes(slug)) {
      resetRack(true);
      sfx.buzz();
      dom.cheatBanner.classList.remove("hidden");
      return;
    }

    if (Object.prototype.hasOwnProperty.call(SCENARIOS, slug) && slug !== "approved") {
      dom.cheatBanner.classList.add("hidden");
      startAutoReplay(slug);
    } else {
      resetRack(true);
    }
  }

  /* ------------------------------------------------------------------------
     8. TOP-BAR CONTROLS & PRIVACY MODAL
     ------------------------------------------------------------------------ */
  function openPrivacyModal() {
    dom.privacyModal.classList.remove("hidden");
  }

  function closePrivacyModal() {
    dom.privacyModal.classList.add("hidden");
    if (window.location.hash === "#modal-privacy" || window.location.hash === "#privacy") {
      updateHashSilently(state.verdictSlug || "");
    }
  }

  function bindEvents() {
    dom.btnResetTree.addEventListener("click", () => {
      sfx.click(360, 22);
      resetRack(true);
    });

    dom.btnSfxToggle.addEventListener("click", () => {
      const isOn = sfx.toggle();
      dom.btnSfxToggle.setAttribute("aria-pressed", String(isOn));
      dom.sfxStateLabel.textContent = isOn ? "SFX: ON" : "SFX: OFF";
    });

    dom.btnThemeToggle.addEventListener("click", () => {
      state.theme = state.theme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", state.theme);
      const isLight = state.theme === "light";
      dom.btnThemeToggle.setAttribute("aria-pressed", String(isLight));
      dom.lightModeQuip.classList.toggle("hidden", !isLight);
      dom.themeStateLabel.textContent = isLight ? "LIGHT" : "DARK";
      sfx.click(440, 20);
    });

    dom.btnSkipReplay.addEventListener("click", () => {
      const slug = getHashSlug();
      sfx.click(520, 18);
      if (SCENARIOS[slug]) {
        jumpDirectlyToScenario(slug);
      } else {
        cancelReplayTimers();
      }
    });

    dom.btnDismissCheat.addEventListener("click", () => {
      sfx.click(420, 18);
      dom.cheatBanner.classList.add("hidden");
    });

    dom.btnOpenPrivacy.addEventListener("click", () => {
      sfx.click(460, 18);
      openPrivacyModal();
    });

    dom.btnClosePrivacy.addEventListener("click", () => {
      sfx.click(380, 18);
      closePrivacyModal();
    });

    dom.privacyModal.addEventListener("click", (e) => {
      if (e.target === dom.privacyModal) closePrivacyModal();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !dom.privacyModal.classList.contains("hidden")) {
        closePrivacyModal();
      }
    });

    window.addEventListener("hashchange", handleLocationHash);

    window.addEventListener("no:approve", (e) => {
      state.currentGateId = null;
      state.verdictSlug = "approved";
      state.verdictContext = (e && e.detail) || null;
      updateHashSilently("");
      renderTrace();
      renderActiveGate();
      renderVerdict();
      dom.verdictSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  /* ------------------------------------------------------------------------
     9. BOOT SEQUENCE
     ------------------------------------------------------------------------ */
  bindEvents();
  handleLocationHash();
})();
