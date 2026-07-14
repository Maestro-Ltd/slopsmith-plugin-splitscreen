# Slopsmith Plugin: Split Screen

A plugin for [Slopsmith](https://github.com/carochacs/slopsmith) that shows 2–6 highway panels side-by-side during playback, each rendering a different arrangement of the same song. Practice lead and rhythm at once, watch bass against lead, or run a quad view of every arrangement a song has.

## Quick Start

1. Install and restart (see [Installation](#installation) below).
2. Open any song in the player.
3. Click the **Split** button in the player toolbar — the highway splits into panels.
4. Use each panel's dropdown to pick which arrangement it shows.
5. Click **Split** again to return to the normal view.

That's it. The full feature list and advanced options are below.

## Features

- **Seven layouts** — Top/Bottom (2P), Left/Right (2P), Triple horizontal (3P), Triple vertical (3P), Quad (4P, 2×2 grid), Five (5P, 3×2 grid), and Six (6P, 3×2 grid)
- **Per-panel arrangement selector** — each panel has its own dropdown; swap what it renders mid-playback without restarting the song
- **Per-panel visualization picker** — each panel can independently run any installed `slopsmithViz` plugin (e.g. the 3D highway) alongside the default 2D highway
- **Per-panel viz settings** — when a panel is running a viz renderer that exposes per-panel controls (e.g. 3D Highway's palette and camera settings), a **3D ⚙** button opens a popover with those controls scoped to just that panel; other panels are unaffected
- **Per-panel lyrics overlay** — click **Lyrics** on any panel to toggle a translucent karaoke band over the renderer (works in 2D highway, 3D highway, and other viz modes — anything that owns the canvas)
- **Per-panel tab view** — click **Tab** on any panel to overlay a scrolling guitar tab above the highway; pairs with the [Tab View plugin](https://github.com/carochacs/slopsmith/tree/main/plugins/tabview) (bundled in core)
- **Lyrics pane mode** — select "Lyrics" from a panel's arrangement dropdown to replace that panel with a full-size karaoke renderer (no highway underneath)
- **Jumping Tab pane mode** — select "Jumping Tab" from a panel's arrangement dropdown to replace that panel with the jumping tab renderer; pairs with the [Jumping Tab plugin](https://github.com/renanboni/slopsmith-plugin-jumpingtab)
- **Per-panel invert toggle** — flip individual panels between player and audience perspective independently
- **Per-panel lefty toggle** — switch individual panels to left-handed mode independently
- **Per-panel mastery** — adjust the difficulty/master fraction (0 = easy, 1 = full chart) per panel; lets you practice an easier version on one panel while watching the full chart on another
- **Per-panel note detection** — each panel can independently detect notes from a specific audio input channel; pairs with the [Note Detect](https://github.com/topkoa/slopsmith-plugin-notedetect) plugin for multi-guitar setups
- **Pop a panel into its own window** — click **⇱ Pop** on any panel to open it in a new browser window; drag it to a second monitor and resize it freely. The popup is muted and paused (it doesn't even decode the audio) and slaved to the main window's audio time, so there's still only one sound source. Click **⇲ Dock** to send the panel back to its splitscreen slot; just closing the popup window instead removes that panel.
- **Split a popped window internally** — every popup gets its own bottom toolbar with a layout picker (Single / Top-Bottom / Left-Right / Quad). A popped window can mirror the same layouts as the main splitter, so you can run e.g. a quad on a second monitor with all four arrangements while the main window stays single-panel.
- **Hide/show bottom controls bar** — click **▾ Bar** (next to Close) to collapse the global player controls and reclaim the vertical space; a floating **▴ Controls** pill restores them
- **Hide/show per-panel mini bar** — each panel has a **▾ Bar** button pinned to its bottom-right corner to collapse that panel's controls independently; click **▴ Bar** to restore
- **Smart defaults** — opens with lead → rhythm → bass auto-assigned across panels when those arrangements exist, wrapping to fill the rest
- **Single shared audio** — all panels slave to the core `<audio>` element, so there's only one sound source and no drift between views
- **Live layout switching** — change layout from the player toolbar without reloading the song; existing arrangement selections are preserved when panel counts match
- **Always Split** — opt into auto-entering split screen on every song load (Settings → Split Screen)
- **Persistent settings** — layout, per-panel arrangements, invert/lefty/mastery state, bar visibility, and controls bar visibility are all saved to `localStorage` and restored on the next visit

## Installation

**Docker (web version)**
```bash
cd /path/to/slopsmith/plugins
git clone https://github.com/topkoa/slopsmith-plugin-splitscreen.git splitscreen
docker compose restart
```

**Desktop app** — clone into the platform plugins directory and restart the app:

| Platform | Plugins directory |
|----------|-------------------|
| Windows  | `%APPDATA%\slopsmith-desktop\plugins\` |
| macOS    | `~/Library/Application Support/slopsmith-desktop/plugins/` |
| Linux    | `~/.config/slopsmith-desktop/plugins/` |

**Compatibility** — splitscreen runs on any Slopsmith core. On cores with the `highway:visibility` plugin API (~0.2.7.1+), a visualization plugin that mounts a sibling overlay — e.g. the 3D Highway's WebGL overlay — hides itself cleanly while splitscreen is active. On older cores that overlay may bleed through the panels; update the core (and the 3D Highway plugin) to fix it.

## Usage

1. Open any song in the player.
2. Click the **Split** button in the player toolbar to activate. The highway is replaced by your configured layout of panels.
3. Use each panel's dropdown to pick which arrangement (or mode) it shows:
   - Any numbered arrangement → 2D highway for that part
   - Any arrangement with a viz renderer suffix → runs that viz plugin (e.g. 3D highway)
   - **Lyrics** → full-size karaoke pane (no highway)
   - **Jumping Tab** → full-size jumping tab pane (requires the Jumping Tab plugin)
4. Use the per-panel buttons in the mini bar to adjust individual panels:
   - **Invert** — flip player ↔ audience perspective
   - **Lefty** — switch to left-handed mode
   - **Lyrics** — toggle a translucent karaoke overlay above the renderer
   - **Tab** — toggle a scrolling guitar tab overlay (requires the Tab View plugin)
   - **Mastery** — adjust the difficulty fraction (shown as a slider or numeric field)
5. Click **Split** again to return to the single-highway view.

Split screen works with both PSARC and `.sloppak` songs — any song with more than one arrangement benefits.

### Hiding controls for more screen space

- **Bottom controls bar** — when splitscreen is active, a **▾ Bar** button appears next to the Close button. Click it to hide the player controls bar; panels expand to fill the freed space. A floating **▴ Controls** pill appears at the bottom-right of the player to bring the bar back.
- **Per-panel mini bar** — each panel has a **▾ Bar** button pinned to its bottom-right corner. Click it to collapse that panel's mini controls (arrangement picker, Invert, Lyrics, Tab, etc.); the highway fills the full panel height. Click **▴ Bar** to restore.

Both states are saved to `localStorage` and restored automatically the next time you activate splitscreen.

### Popping a panel onto a second monitor

Each panel's mini bar has a **⇱ Pop** button. Clicking it opens that panel in its own browser window, which you can then drag to a second monitor and resize independently — handy for multi-monitor practice setups where you want the highway, lyrics, or jumping tab on a separate screen from the main player.

While popped:

- The panel disappears from the main splitscreen layout (the slot collapses; if only one panel was left in main, the main window goes back to its default highway).
- The popup is **muted and paused** — it doesn't even decode the audio. Sound plays only from the main window; there's one source, never doubled or out of sync.
- Time is broadcast from the main window via `BroadcastChannel`, so the popup's highway / lyrics / jumping tab follows the main song precisely — and it stays smooth even if you give the popup focus and the main window goes into the background (the popup interpolates between updates).
- If you load a different song in the main window, popped panels **auto-follow** in their current mode + arrangement (clamped to arrangement 0 if the new song has fewer arrangements); rapid song-skips in the main window are coalesced so the popup just lands on the final one.

To bring it back: click **⇲ Dock** in the popup. The panel returns to its original splitscreen slot in the main window, with any per-panel changes you made in the popup (mastery, palette, camera smoothing, …) preserved.

Just **closing** the popup window does *not* re-dock the panel — it stays removed (its slot already collapsed when you popped it out). If you want the panel back, use **⇲ Dock** rather than closing the window; once it's closed, pop a fresh one from the main layout.

#### Splitting a popped window further

Every popup has a small toolbar pinned to its bottom edge with a **Layout** picker. The same layouts available in main are available here: **Single**, **Top/Bottom**, **Left/Right**, **Quad**. Switching layouts inside a popup keeps the slots you already configured and fills any new ones (lead → rhythm → bass) using the same smart-defaults the main toggle uses. Each popup has its own layout independent of main and any other popups, so you can run e.g. a quad of all four arrangements on a second monitor while keeping main on a single 3D highway.

> Pop-out uses standard `window.open` and `BroadcastChannel`. The popup must be triggered by your click (a user gesture) so popup blockers should leave it alone — but if your browser does block it (or doesn't support `BroadcastChannel`), the panel stays put and you get a brief notice instead. If you close the main window while popups are open, each popup detects it and shows a "main window closed" notice so you know to close it (best-effort — if the browser doesn't deliver that last message the popup just freezes, same as before).

## Settings

Open **Settings → Split Screen** to configure:

- **Default layout** — Top/Bottom, Left/Right, Triple (horizontal or vertical), Quad, Five, or Six. Stored as `splitscreenLayout` and applied the next time you toggle split screen on.
- **Always Split** — when checked, split screen activates automatically every time you load a song (no need to click the Split button). Stored as `splitscreenAlwaysSplit`.

## Note Detection

Each panel can independently detect the notes you're playing and score your accuracy in real time. This requires the [Note Detect plugin](https://github.com/topkoa/slopsmith-plugin-notedetect) to be installed.

### Single input

Click **Detect** on any panel to enable note detection for that panel. The note detect HUD appears as an overlay and tracks your hits, misses, and streak independently from any other panels.

### Multiple inputs (e.g. Focusrite Scarlett)

If your audio interface has more than one input — for example a Scarlett 2i2 with two guitars — you can route each input to its own panel:

1. Plug guitar 1 into **input 1** (left channel) and guitar 2 into **input 2** (right channel).
2. In the first panel, click the channel button until it shows **L**.
3. In the second panel, click the channel button until it shows **R**.
4. Click **Detect** on both panels.

Each panel now listens to its own input and detects notes independently. Both players get their own accuracy HUD.

The channel button cycles through three modes:

| Label | Channel |
|-------|---------|
| **M** | Mono mix (both inputs combined) |
| **L** | Left channel only (input 1) |
| **R** | Right channel only (input 2) |

Your channel assignment is saved per panel and restored on the next visit. Detect is not re-enabled automatically on page load — you need to click it each session to trigger the microphone permission prompt.

> If note_detect is not installed the Detect and channel buttons are visible but disabled.

## How it works

Each panel is an independent highway instance:

1. Creates its own `<canvas>` and a fresh `Highway` via the core factory
2. Opens its own WebSocket to `/ws/highway/{filename}?arrangement={index}` so the server streams just that arrangement's notes/chords/beats
3. Overrides the highway's default `resize()` (which would size to the full window and clobber siblings) to size to its parent panel instead
4. Slaves its timeline to the shared core `<audio>` element — one sound source, N visualizers

Visualization panels (e.g. the 3D highway) use the core `setRenderer` contract: split screen calls `panel.hw.setRenderer(factory())` to install the renderer into the panel's existing highway instance. The highway manages the WebSocket and RAF loop; the renderer just draws.

On layout change, panels are torn down and rebuilt; arrangement selections are carried across when the new layout has at least as many panels as the old one. On player exit, `teardownPanels()` closes every WebSocket and removes the wrap div cleanly.

## Integrating Your Plugin With Split Screen

There are two integration paths depending on what your plugin does.

### Path 1: Visualization plugins (recommended)

If your plugin replaces the highway's draw function — a different way to render the same note data — use the core `slopsmithViz` contract (slopsmith#36). Declare `"type": "visualization"` in your `plugin.json` and export a renderer factory:

```js
window.slopsmithViz_my_viz = function () {
    return {
        init(canvas, bundle) {
            this.ctx = canvas.getContext('2d');
        },
        draw(bundle) {
            // bundle.currentTime, bundle.notes, bundle.chords, bundle.beats, etc.
        },
        resize(w, h) { /* optional */ },
        destroy()    { /* optional — release resources */ },
    };
};
```

Split screen automatically populates each panel's dropdown with this option and calls `panel.hw.setRenderer(factory())` when selected. **No changes to split screen's code are needed.** Each panel gets an independent renderer instance; the highway provides note data, timing, and the RAF loop.

See the [CLAUDE.md plugin guide](https://github.com/carochacs/slopsmith/blob/main/CLAUDE.md) for the full `setRenderer` lifecycle and bundle shape. The [3D Highway plugin](https://github.com/carochacs/slopsmith/tree/main/plugins/highway_3d) (bundled in core) is a reference implementation.

### Path 2: Pane plugins (own canvas + own WebSocket)

If your plugin needs a fundamentally different rendering approach — its own canvas, its own WebSocket connection, DOM elements that aren't a highway at all — use the pane factory contract. Lyrics and Jumping Tab use this path.

Your factory must accept `{ container }` and return `{ connect(), destroy(), resize() }`:

```js
window.createMyVisualization = function ({ container }) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    container.appendChild(canvas);

    let ws = null;
    let raf = null;
    let destroyed = false;

    function render() {
        if (destroyed) return;
        const now = document.getElementById('audio')?.currentTime ?? 0;
        // ... draw ...
        raf = requestAnimationFrame(render);
    }

    return {
        connect(filename, arrangementIndex) {
            // filename may be percent-encoded — decode it before building the URL:
            const decoded = decodeURIComponent(filename);
            const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
            const url = `${proto}//${location.host}/ws/highway/${decoded}?arrangement=${arrangementIndex}`;
            ws = new WebSocket(url);
            // ... handle messages, call render() when ready ...
        },
        destroy() {
            destroyed = true;
            if (raf) { cancelAnimationFrame(raf); raf = null; }
            if (ws) { ws.close(); ws = null; }
            if (canvas.parentNode) canvas.remove();
        },
        resize() {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = Math.floor(rect.width * dpr);
            canvas.height = Math.floor(rect.height * dpr);
        },
    };
};
```

#### Key rules for pane plugins

| Rule | Why |
|------|-----|
| **No shared mutable state** | Split screen may create 2–4 instances simultaneously. Each needs its own canvas, WebSocket, RAF handle, and state. If your plugin uses module-level variables, use a context-swap pattern (see Jumping Tab) or refactor to closures. |
| **Decode the filename** | `currentFilename` may be percent-encoded. Call `decodeURIComponent(filename)` before building the WebSocket URL to avoid double-encoding slashes. |
| **Sync to `<audio>` directly** | Read `document.getElementById('audio').currentTime` in your RAF loop. The `setTime()` call from split screen's time sync loop is for highway instances only. |
| **Clean up completely in `destroy()`** | Cancel RAF, close WebSocket, remove any DOM nodes you added inside the container. Split screen removes the container div itself. |
| **Handle `resize()` properly** | Called on layout changes and window resizes. Update your canvas backing store respecting `devicePixelRatio`. |
| **No arrangement assumptions** | `connect()` receives an arrangement index — honor it. |

#### Sentinel values — how the dropdown protocol works

Each panel mode (highway arrangement, lyrics pane, jumping tab, viz renderer) is identified by the `value` attribute of its `<option>` in the panel's `<select>`. Split screen uses a **sentinel prefix convention** to distinguish modes from plain arrangement indices.

**Built-in sentinels:**

| Select option value | Saved pref value | Mode |
|---|---|---|
| `"0"`, `"1"`, `"2"`, … | `arrName` string | Normal 2D highway for that arrangement |
| `"__lyrics__"` | `"__lyrics__"` | Full-size lyrics pane (no highway) |
| `"__jumping_tab__:0"`, etc. | `"__jumping_tab__:arrName"` | Jumping tab pane for that arrangement |
| `"__viz__:highway_3d:0"`, etc. | `"__viz__:highway_3d:arrName"` | Viz renderer (`highway_3d`, `piano`, etc.) for that arrangement |

Note that **select values use the arrangement index** (integer) while **saved preferences use the arrangement name** (string) — this is intentional so preferences survive arrangement reordering across songs.

The format rule is: `'__' + id + '__'` for simple panes (no per-arrangement state), or `'__' + id + '__:' + disambiguator` for arrangement-aware panes.

#### Registering a pane plugin with split screen

Pane plugins require a small integration in split screen's `screen.js` (unlike viz plugins, which are auto-discovered). The pattern:

**1.** Define a sentinel constant at the top of `screen.js`:
```js
const MY_VIZ_VALUE = '__my_viz__';
```

**2.** Add options to `populateSelect()`, gated on your factory:
```js
if (typeof window.createMyVisualization === 'function') {
    arrangements.forEach((a, i) => {
        const opt = document.createElement('option');
        opt.value = MY_VIZ_VALUE + ':' + i;
        opt.textContent = (a.name || `Arr ${i}`) + ' (MyViz)';
        panel.select.appendChild(opt);
    });
}
```

**3.** Add `enterMyVizMode(panel)` / `exitMyVizMode(panel, arrIndex)` functions following the lyrics or jumping tab pattern.

**4.** Wire into `select.onchange`, `initPanel()`, `teardownPanels()`, `savePanelPrefs()`, `captureCurrentPrefs()`, `sizeCanvases()`, and `startTimeSync()`.

**5.** Update `resolveArrIndex()` so that your sentinel prefix returns `-1` (signals "not a plain arrangement index"):
```js
if (pref.arrName && pref.arrName.startsWith(MY_VIZ_VALUE)) return -1;
```

#### Reference implementations

- **Lyrics pane** — `createLyricsPane()` in [screen.js](screen.js). DOM-based renderer, single WebSocket, RAF loop for karaoke highlighting.
- **Jumping Tab pane** — `window.createJumpingTabPane()` in the [Jumping Tab plugin](https://github.com/renanboni/slopsmith-plugin-jumpingtab). Canvas renderer with context-swapping to share draw functions across multiple pane instances.

### Testing Checklist

Before shipping, verify:

- [ ] Multiple panels can run your visualization simultaneously without interference
- [ ] Switching between your mode and highway/lyrics/jumping tab transitions cleanly
- [ ] `destroy()` (pane) or the `destroy()` renderer method (viz) leaves no orphaned RAF loops, WebSocket connections, or DOM nodes
- [ ] Preferences persist across songs (correct arrangement restores)
- [ ] Your dropdown options don't appear when your plugin is not installed
- [ ] Resizing the browser or switching layouts updates your canvas correctly

### WebSocket Data Reference

The highway WebSocket (`/ws/highway/{filename}?arrangement={index}`) streams these messages in order:

| Message | Shape | Description |
|---------|-------|-------------|
| `song_info` | `{ type, title, artist, arrangement, duration, tuning }` | Song metadata and tuning array (6 elements for guitar, 4 for bass) |
| `sections` | `{ type, data: [{ time, name }] }` | Named sections (Intro, Verse, Chorus, etc.) |
| `notes` | `{ type, data: [{ t, s, f, sus, ho, po, sl, bn }] }` | Single notes — `t`=time, `s`=string, `f`=fret, `sus`=sustain, technique flags |
| `chords` | `{ type, data: [{ t, notes: [{ s, f, sus, ho, po, sl, bn }] }] }` | Chord events — each has a time and an array of per-string notes |
| `beats` | `{ type, data: [{ time, measure }] }` | Beat timestamps with measure numbers |
| `lyrics` | `{ type, data: [{ w, t, d }] }` | Syllables — `w`=word, `t`=time, `d`=duration. `-` joins to previous word, `+` marks line break |
| `ready` | `{ type: 'ready' }` | All data has been sent — safe to finalize and start rendering |

Messages arrive in the order listed above. Do not start rendering until you receive `ready`.

## Requirements

- Slopsmith with the highway factory (`createHighway()`) and `setRenderer` support exposed on `window` — available in all recent builds (slopsmith#36)
- A song with ≥2 arrangements to see any benefit; 1-arrangement songs simply render the same view in every panel

### Optional plugin dependencies

| Feature | Plugin |
|---------|--------|
| Tab overlay / Tab pane | [Tab View](https://github.com/carochacs/slopsmith/tree/main/plugins/tabview) (bundled in core) |
| Jumping Tab pane | [Jumping Tab](https://github.com/renanboni/slopsmith-plugin-jumpingtab) |
| Note detection | [Note Detect](https://github.com/topkoa/slopsmith-plugin-notedetect) |
| 3D highway renderer | [3D Highway](https://github.com/carochacs/slopsmith/tree/main/plugins/highway_3d) (bundled in core) |

Each optional plugin is detected at runtime; its dropdown entries and buttons are hidden if the plugin isn't installed.

## Other Plugins

- [Stems](https://github.com/topkoa/slopsmith-plugin-stems) — live multi-stem mixer for `.sloppak` songs
- [Sloppak Converter](https://github.com/topkoa/slopsmith-plugin-sloppak-converter) — convert PSARCs into `.sloppak` files in-app

## License

[MIT](LICENSE.txt)
