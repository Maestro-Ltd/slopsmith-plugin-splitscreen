# Known UI Issues — Split Screen

Findings from a frontend UI-bug audit of `screen.js` (2026-07-22, ~3526 lines). Cross-checked against this repo's own `CLAUDE.md`, which documents extensive invariants from prior bug-fix work — findings below are places the code doesn't actually follow its own documented contract, or gaps beyond what's documented. Ranked by severity/confidence.

## 1. Invert state is threaded through pop-out/dock but never actually persisted or restored (High) — Fixed

`panelToPrefs` never read `p.hw.getInverted()`, even though CLAUDE.md's "Panel pref object shape" explicitly lists `inverted: bool`. `initPanel()`'s prefs-restore block only applied `prefs.lefty` and `prefs.lyrics` — never `prefs.inverted`. Fixed by adding `inverted` to `panelToPrefs` and applying `prefs.inverted` via `hw.setInverted()` in `initPanel()`'s restore block.

## 2. Lyrics overlay toggle button never hidden in Lyrics-pane / Jumping-Tab-pane mode — contradicts CLAUDE.md directly (High) — Fixed

CLAUDE.md states for both modes: *"Invert / Lyrics / Tab buttons hidden while in this mode."* But `enterLyricsMode`/`enterJumpingTabMode` only hid `invertBtn`, `leftyBtn`, `tabBtn`, and mastery controls — `panel.lyricsBtn.style.display` was never touched. Fixed by hiding/restoring `lyricsBtn` in both enter/exit pairs and tearing down `panel.lyricsOverlay` on entry (recreated on exit if `lyricsOverlayOn` is still set), so the overlay no longer duplicates the full lyrics pane's text or stacks above the jumping-tab container.

## 3. Per-panel note detector never torn down or rebuilt across mode/arrangement switches (High/Medium) — Fixed

`toggleDetect` constructs `createNoteDetector({ highway: panel.hw, ... })`, capturing `panel.hw` by value. Every mode transition that swaps the highway instance via `recreatePanelHighway` replaced `panel.hw` with a fresh object without touching `panel.detector`, leaving Detect bound to a stopped, orphaned highway. Fixed by tearing down `panel.detector` at the top of `recreatePanelHighway` (the single choke point all such transitions pass through) and hiding/destroying it when entering Lyrics-pane/Jumping-Tab-pane mode (where the canvas itself is hidden), restoring `detectBtn`/`channelBtn` visibility on exit.

## 4. `popOutPanel()` lacks the `_starting` in-flight guard used elsewhere — breaks the documented single-flight invariant (Medium) — Fixed

CLAUDE.md's "Single-flight" section explains `_pendingRebuild`/`_pendingRedocks` exist so a second async trigger doesn't tear down a `startSplitScreen()` that's still mid-build. `rebuildLayout()` and `_redockPanel()` both checked `if (_starting) { queue; return; }`; `popOutPanel()` performed the identical `teardownPanels(); startSplitScreen(null, savedPrefs);` pattern with no such check. Fixed by adding the same guard, queuing into a new `_pendingPopOuts` array drained in `startSplitScreen`'s `finally` (same slot as `_pendingRedocks`).

## 5. Docking a self-split popup only recovers one of its sub-panels (Medium)

The main window's `popups` Map tracks exactly one `originalConfig` per `popupId` (`screen.js:1949, 222`) — one slot per popup *window*, not per panel. But a popup can itself split into up to 4 panels via `rebuildFollowerLayout`/`buildFollowerLayout` (`screen.js:3096-3253`). `dockFollowerPanel(panel)` (`screen.js:2002-2016`) posts state for just the one `panel` argument and unconditionally `window.close()`s. The "Dock all" popup-side handler is hardcoded to `dockFollowerPanel(panels[0])` (`screen.js:3245-3247`), ignoring other sub-panels.

**Failure scenario:** Pop out a panel, switch that popup's own layout to "Quad," configure all 4 sub-panels differently, then Dock any one of them (or "Dock all"). Only that one panel's arrangement/mode returns to the main window; the other 3 sub-panels' state is silently discarded when the window closes.

**Status:** Not yet fixed — recovering all sub-panels requires the popup to `dockFollowerPanel` (or an equivalent multi-panel post) for each of its own panels, and the main window's `popups` entry to track multiple `originalConfig`s per `popupId`; a larger change than the others in this list, left for follow-up.

## 6. `sizeCanvases()`'s section-map offset can go stale outside the documented trigger list (Low-Medium, plausible)

`sizeCanvases()` reads `#section-map`'s `offsetHeight` to set `wrap.style.top` (`screen.js:927-931`), but CLAUDE.md's "must be called after" list only names: splitscreen activation, controls-bar hide/show, window resize, layout change — not a change to the section-map bar's own visibility/height (a separate plugin) independent of a window resize.

**Failure scenario:** With split active, the section-map bar appears/disappears or changes height via its own UI — panels can render under/over the bar until the user resizes the window or changes layout.

**Status:** Not yet fixed — would need a `ResizeObserver` on `#section-map` (a separate plugin's element) or that plugin to emit an event splitscreen can listen for; left for follow-up.

## 7. `togglePanelTab`'s `getCurrentTime` callback has no null-check on `#audio` (Low) — Fixed

`getCurrentTime: () => document.getElementById('audio').currentTime` — every other `#audio` access in the file guards with a ternary. Fixed with `document.getElementById('audio')?.currentTime ?? 0`.

---

*Verified compliant:* `hw.resize` override is set before `hw.init()` in every code path that creates a highway (`startSplitScreen`, `recreatePanelHighway`, `buildFollowerLayout`). Every `hw.connect()` call passes the mandatory empty `onSongInfo`. No arbitrary-value Tailwind classes are used (all styling is inline `cssText`; no `styles` manifest needed).
