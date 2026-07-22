# Known UI Issues — Split Screen

Findings from a frontend UI-bug audit of `screen.js` (2026-07-22, ~3526 lines). Cross-checked against this repo's own `CLAUDE.md`, which documents extensive invariants from prior bug-fix work — findings below are places the code doesn't actually follow its own documented contract, or gaps beyond what's documented. Ranked by severity/confidence. No code changes have been made — this is a catalog for follow-up work.

## 1. Invert state is threaded through pop-out/dock but never actually persisted or restored (High)

`panelToPrefs` (`screen.js:386-399`, the documented single source of truth for the pref shape) never reads `p.hw.getInverted()`, even though CLAUDE.md's "Panel pref object shape" explicitly lists `inverted: bool`. `initPanel()`'s prefs-restore block (`screen.js:1466-1472`) only applies `prefs.lefty` and `prefs.lyrics` — never `prefs.inverted`. Meanwhile `_captureFollowerConfig` (`screen.js:1859-1873`), the pop-out URL params (`screen.js:1935`), `_redockPanel`'s `newPrefs.inverted` (`screen.js:2423`), and `_followerCfgToPrefs` (`screen.js:3112-3126`) all faithfully carry `inverted` around — it's dropped only at the one place (`initPanel`) that would apply it.

**Failure scenario:** Split on, click "Invert" on any panel, then reload the page (or change layout so `rebuildLayout()` fires, or pop a panel out and Dock it back). Every other per-panel setting round-trips correctly (lefty, mastery, detectChannel, barHidden, lyrics-overlay) — Invert silently resets to off.

## 2. Lyrics overlay toggle button never hidden in Lyrics-pane / Jumping-Tab-pane mode — contradicts CLAUDE.md directly (High)

CLAUDE.md states for both modes: *"Invert / Lyrics / Tab buttons hidden while in this mode."* But `enterLyricsMode` (`screen.js:1202-1227`) and `enterJumpingTabMode` (`screen.js:1255-1291`) only hide `invertBtn`, `leftyBtn`, `tabBtn`, and mastery controls — `panel.lyricsBtn.style.display` is never touched anywhere in the file.

**Failure scenario:** In a panel, enable the per-panel lyrics overlay, then switch that panel's dropdown to the "Lyrics" sentinel to enter the full lyrics pane. `enterLyricsMode` never destroys `panel.lyricsOverlay`; the overlay div (`z-index:9`, `screen.js:504`) stacks visibly on top of the full pane, duplicating the lyric text. The same live button also spawns/destroys an overlay while in Jumping-Tab mode, layered above the JT container.

## 3. Per-panel note detector never torn down or rebuilt across mode/arrangement switches (High/Medium)

`toggleDetect` (`screen.js:1748-1764`) constructs `createNoteDetector({ highway: panel.hw, ... })`, capturing `panel.hw` by value. Every mode transition that swaps the highway instance via `recreatePanelHighway` (from `exitLyricsMode`, `exitJumpingTabMode`, `enterVizMode`, `exitVizMode`, `switchPanelArrangement`, the viz-to-viz `select.onchange` branch) replaces `panel.hw` with a fresh object — but none of those functions touch `panel.detector`. This is exactly the "resource type added later, not covered by teardown/transition" pattern CLAUDE.md's own "Adding a new panel mode" checklist (step 7) warns about. `detectBtn`/`channelBtn` display is also never toggled anywhere — the button stays live in modes where the canvas is hidden.

**Failure scenario:** Turn on Detect on a 2D panel, then switch that panel's arrangement (or to Lyrics/Viz) via its dropdown. Detect still shows "on" but is bound to a stopped, orphaned highway that never tracks the new chart; its audio-processing/overlay resources keep running until manually toggled off or the whole split session ends.

## 4. `popOutPanel()` lacks the `_starting` in-flight guard used elsewhere — breaks the documented single-flight invariant (Medium)

CLAUDE.md's "Single-flight" section explains `_pendingRebuild`/`_pendingRedocks` exist so a second async trigger doesn't tear down a `startSplitScreen()` that's still mid-build. `rebuildLayout()` (`screen.js:2019-2027`) and `_redockPanel()` (`screen.js:2400-2405`) both check `if (_starting) { queue; return; }`. `popOutPanel()` (`screen.js:1917-1995`) performs the identical `teardownPanels(); startSplitScreen(null, savedPrefs);` pattern with no `_starting` check at all.

**Failure scenario:** Trigger two pop-outs in quick succession (e.g. the very first pop-out of a session, while `fetchVizPlugins()` hasn't resolved and `startSplitScreen` is still awaiting it) — the second `popOutPanel()` call's `teardownPanels()` forcibly rips out the half-built layout from the first call's in-flight `startSplitScreen()`.

## 5. Docking a self-split popup only recovers one of its sub-panels (Medium)

The main window's `popups` Map tracks exactly one `originalConfig` per `popupId` (`screen.js:1949, 222`) — one slot per popup *window*, not per panel. But a popup can itself split into up to 4 panels via `rebuildFollowerLayout`/`buildFollowerLayout` (`screen.js:3096-3253`). `dockFollowerPanel(panel)` (`screen.js:2002-2016`) posts state for just the one `panel` argument and unconditionally `window.close()`s. The "Dock all" popup-side handler is hardcoded to `dockFollowerPanel(panels[0])` (`screen.js:3245-3247`), ignoring other sub-panels.

**Failure scenario:** Pop out a panel, switch that popup's own layout to "Quad," configure all 4 sub-panels differently, then Dock any one of them (or "Dock all"). Only that one panel's arrangement/mode returns to the main window; the other 3 sub-panels' state is silently discarded when the window closes.

## 6. `sizeCanvases()`'s section-map offset can go stale outside the documented trigger list (Low-Medium, plausible)

`sizeCanvases()` reads `#section-map`'s `offsetHeight` to set `wrap.style.top` (`screen.js:927-931`), but CLAUDE.md's "must be called after" list only names: splitscreen activation, controls-bar hide/show, window resize, layout change — not a change to the section-map bar's own visibility/height (a separate plugin) independent of a window resize.

**Failure scenario:** With split active, the section-map bar appears/disappears or changes height via its own UI — panels can render under/over the bar until the user resizes the window or changes layout.

## 7. `togglePanelTab`'s `getCurrentTime` callback has no null-check on `#audio` (Low)

`screen.js:1729`: `getCurrentTime: () => document.getElementById('audio').currentTime` — every other `#audio` access in the file guards with a ternary (e.g. `screen.js:598-599`, `2281-2283`).

**Failure scenario:** If `#audio` is ever absent when the external tabview plugin's sync loop later calls this getter, it throws uncaught inside that plugin.

---

*Verified compliant:* `hw.resize` override is set before `hw.init()` in every code path that creates a highway (`startSplitScreen`, `recreatePanelHighway`, `buildFollowerLayout`). Every `hw.connect()` call passes the mandatory empty `onSongInfo`. No arbitrary-value Tailwind classes are used (all styling is inline `cssText`; no `styles` manifest needed).
