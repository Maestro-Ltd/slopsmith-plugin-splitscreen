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

## 5. Docking a self-split popup only recovers one of its sub-panels (Medium) — Fixed

The main window's `popups` Map tracks exactly one `originalConfig` per `popupId` — one slot per popup *window*, not per panel. But a popup can itself split into up to 4 panels via `rebuildFollowerLayout`/`buildFollowerLayout`. `dockFollowerPanel(panel)` posted state for just the one `panel` argument and unconditionally `window.close()`d; the "Dock all" popup-side handler was hardcoded to `dockFollowerPanel(panels[0])`, ignoring other sub-panels. Fixed by having `dockFollowerPanel` always capture every currently-live sub-panel via the existing `_captureAllFollowerConfigs()` helper (previously only used for song-change rebuilds) and post them as an array in `finalState`; `_redockPanel` now builds one restored panel per array entry (each merged against the same `originalConfig` fallback, since that's the only "before" state the main window ever had for that popup) instead of just one. The legacy single-object `finalState` shape is still tolerated defensively.

## 6. `sizeCanvases()`'s section-map offset can go stale outside the documented trigger list (Low-Medium, plausible) — Fixed

`sizeCanvases()` reads `#section-map`'s `offsetHeight` to set `wrap.style.top`, but CLAUDE.md's "must be called after" list only named: splitscreen activation, controls-bar hide/show, window resize, layout change — not a change to the section-map bar's own visibility/height (a separate plugin) independent of a window resize. Fixed by adding a `ResizeObserver` on `#section-map` (`_observeSectionMap()`, guarded by `typeof ResizeObserver === 'function'`), connected in `startSplitScreen` alongside the existing `sizeCanvases()` call and disconnected in `teardownPanels` next to `wrap`'s own teardown. Main-window only — follower/popup mode force-hides `#section-map` and is unaffected. If `#section-map` isn't present yet when the observer connects, a `MutationObserver` on `#player` picks up its later insertion and connects the `ResizeObserver` at that point, rather than waiting for an unrelated resize/layout-change trigger.

## 7. `togglePanelTab`'s `getCurrentTime` callback has no null-check on `#audio` (Low) — Fixed

`getCurrentTime: () => document.getElementById('audio').currentTime` — every other `#audio` access in the file guards with a ternary. Fixed with `document.getElementById('audio')?.currentTime ?? 0`.

---

*Verified compliant:* `hw.resize` override is set before `hw.init()` in every code path that creates a highway (`startSplitScreen`, `recreatePanelHighway`, `buildFollowerLayout`). Every `hw.connect()` call passes the mandatory empty `onSongInfo`. No arbitrary-value Tailwind classes are used (all styling is inline `cssText`; no `styles` manifest needed).
