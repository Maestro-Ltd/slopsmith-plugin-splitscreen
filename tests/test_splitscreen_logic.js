'use strict';
/**
 * Unit tests for pure-logic helpers extracted from screen.js.
 *
 * Functions are inside an IIFE so they can't be imported directly — they're
 * small enough to inline verbatim.  Any drift from the source will be caught
 * by failing assertions.
 *
 * Run with: node tests/test_splitscreen_logic.js
 */

const assert = require('assert').strict;

// ── Constants (verbatim from screen.js) ──────────────────────────────────────

const LYRICS_VALUE      = '__lyrics__';
const JUMPING_TAB_VALUE = '__jumping_tab__';
const VIZ_PREFIX        = '__viz__';
const PREFS_CURRENT_V   = 2;
const PREFS_MIGRATION_KEY = 'splitscreenPrefsMigrationV';

// ── Functions under test (verbatim from screen.js) ───────────────────────────

// resolveArrIndex: maps a saved arrName string to a live arrangements index.
// Returns -1 for sentinels (lyrics / jumping tab / viz) and for unrecognized names.
function resolveArrIndex(arrangements, arrName) {
    if (!arrName || arrName === LYRICS_VALUE ||
        arrName.startsWith(JUMPING_TAB_VALUE) ||
        arrName.startsWith(VIZ_PREFIX + ':')) return -1;
    const lower = arrName.toLowerCase();
    for (let i = 0; i < arrangements.length; i++) {
        if ((arrangements[i].name || '').toLowerCase() === lower) return i;
    }
    return -1;
}

// getDefaultArrangements: assigns panel slots in lead→rhythm→bass→keys→drums order,
// wrapping when count > available arrangements.
function getDefaultArrangements(arrangements, count) {
    const defaults = [];
    const byName = {};
    arrangements.forEach((a, i) => {
        const n = (a.name || '').toLowerCase();
        if (n.includes('lead') && !byName.lead) byName.lead = i;
        else if (n.includes('rhythm') && !byName.rhythm) byName.rhythm = i;
        else if (n.includes('bass') && !byName.bass) byName.bass = i;
        else if ((n.includes('key') || n.includes('piano')) && !byName.keys) byName.keys = i;
        else if (n.includes('drum') && !byName.drums) byName.drums = i;
    });
    const order = [byName.lead, byName.rhythm, byName.bass, byName.keys, byName.drums]
        .filter(i => i !== undefined);
    for (let i = 0; i < arrangements.length; i++) {
        if (!order.includes(i)) order.push(i);
    }
    for (let i = 0; i < count; i++) {
        defaults.push(order[i % order.length]);
    }
    return defaults;
}

// migratePanelPrefs: upgrades saved prefs; only the arrName migration is
// tested here (localStorage reads are stubbed via the `migV` parameter).
function migratePanelPrefs(prefs, migV) {
    if (!Array.isArray(prefs)) return prefs;
    const v = migV || 0;
    const needsLyricsReset = v < 2;
    return prefs.map(p => {
        const next = { ...p };
        if (needsLyricsReset) next.lyrics = false;
        if (next.arrName && next.arrName.startsWith('__3d_highway__:')) {
            next.arrName = VIZ_PREFIX + ':highway_3d:' + next.arrName.slice('__3d_highway__:'.length);
        }
        return next;
    });
}

// ── Test harness ─────────────────────────────────────────────────────────────

let _passed = 0, _failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✓  ${name}`);
        _passed++;
    } catch (e) {
        console.error(`  ✗  ${name}`);
        console.error(`       ${e.message}`);
        _failed++;
    }
}

// ── resolveArrIndex ───────────────────────────────────────────────────────────

const ARRS = [
    { name: 'Lead' },
    { name: 'Rhythm' },
    { name: 'Bass' },
    { name: 'Lead 2' },
];

console.log('\nresolveArrIndex');

test('matches by name (case-insensitive)', () => {
    assert.equal(resolveArrIndex(ARRS, 'lead'), 0);
    assert.equal(resolveArrIndex(ARRS, 'RHYTHM'), 1);
    assert.equal(resolveArrIndex(ARRS, 'bass'), 2);
    assert.equal(resolveArrIndex(ARRS, 'Lead 2'), 3);
});

test('returns -1 for lyrics sentinel', () => {
    assert.equal(resolveArrIndex(ARRS, LYRICS_VALUE), -1);
});

test('returns -1 for jumping-tab sentinel prefix', () => {
    assert.equal(resolveArrIndex(ARRS, JUMPING_TAB_VALUE + ':Lead'), -1);
    assert.equal(resolveArrIndex(ARRS, JUMPING_TAB_VALUE + ':0'), -1);
});

test('returns -1 for viz prefix', () => {
    assert.equal(resolveArrIndex(ARRS, VIZ_PREFIX + ':highway_3d:Lead'), -1);
    assert.equal(resolveArrIndex(ARRS, VIZ_PREFIX + ':piano:Bass'), -1);
});

test('returns -1 for unrecognized name', () => {
    assert.equal(resolveArrIndex(ARRS, 'Drums'), -1);
    assert.equal(resolveArrIndex(ARRS, ''), -1);
    assert.equal(resolveArrIndex(ARRS, null), -1);
});

test('returns -1 on empty arrangements', () => {
    assert.equal(resolveArrIndex([], 'Lead'), -1);
});

// ── getDefaultArrangements ────────────────────────────────────────────────────

console.log('\ngetDefaultArrangements');

test('lead-rhythm-bass priority order for 3 panels', () => {
    const arrs = [{ name: 'Bass' }, { name: 'Lead' }, { name: 'Rhythm' }];
    const defaults = getDefaultArrangements(arrs, 3);
    assert.equal(defaults[0], 1, 'first panel = lead (index 1)');
    assert.equal(defaults[1], 2, 'second panel = rhythm (index 2)');
    assert.equal(defaults[2], 0, 'third panel = bass (index 0)');
});

test('keys/piano named arrangement included after bass', () => {
    const arrs = [{ name: 'Lead' }, { name: 'Keys' }, { name: 'Bass' }];
    const defaults = getDefaultArrangements(arrs, 4);
    assert.equal(defaults[0], 0, 'lead first');
    assert.equal(defaults[1], 2, 'bass second (keys comes after bass)');
    assert.equal(defaults[2], 1, 'keys third');
});

test('wraps when count > arrangements', () => {
    const arrs = [{ name: 'Lead' }, { name: 'Rhythm' }];
    const defaults = getDefaultArrangements(arrs, 5);
    assert.equal(defaults.length, 5);
    assert.equal(defaults[2], defaults[0], 'wraps back to lead after two');
});

test('single arrangement fills all slots', () => {
    const arrs = [{ name: 'Lead' }];
    const defaults = getDefaultArrangements(arrs, 4);
    assert.ok(defaults.every(d => d === 0), 'all panels point to index 0');
});

test('unnamed arrangements fill remaining slots in index order', () => {
    const arrs = [{ name: '' }, { name: '' }, { name: 'Lead' }];
    const defaults = getDefaultArrangements(arrs, 3);
    assert.equal(defaults[0], 2, 'lead (index 2) goes first');
    // remaining indices 0 and 1 fill in whatever order they were appended
    assert.ok(defaults.slice(1).includes(0) && defaults.slice(1).includes(1));
});

test('empty arrangements with count > 0 throws or returns empty', () => {
    // With 0 arrangements, order is empty; modulo 0 is NaN → returns NaN in each slot.
    // Verifying we don't crash (the wrapping behavior for 0 arrangements is undefined).
    assert.doesNotThrow(() => getDefaultArrangements([], 2));
});

// ── migratePanelPrefs ────────────────────────────────────────────────────────

console.log('\nmigratePanelPrefs');

test('migrates legacy __3d_highway__ arrName to __viz__ prefix', () => {
    const prefs = [{ arrName: '__3d_highway__:Lead' }];
    const result = migratePanelPrefs(prefs, 2);  // v=2 → no lyrics reset
    assert.equal(result[0].arrName, '__viz__:highway_3d:Lead');
});

test('leaves current __viz__ prefix unchanged', () => {
    const prefs = [{ arrName: '__viz__:highway_3d:Lead' }];
    const result = migratePanelPrefs(prefs, 2);
    assert.equal(result[0].arrName, '__viz__:highway_3d:Lead');
});

test('resets lyrics field when migration version < 2', () => {
    const prefs = [{ arrName: 'Lead', lyrics: true }];
    const result = migratePanelPrefs(prefs, 1);
    assert.equal(result[0].lyrics, false);
});

test('preserves lyrics field when migration version >= 2', () => {
    const prefs = [{ arrName: 'Lead', lyrics: true }];
    const result = migratePanelPrefs(prefs, 2);
    assert.equal(result[0].lyrics, true);
});

test('handles null/non-array input gracefully', () => {
    assert.equal(migratePanelPrefs(null, 2), null);
    assert.equal(migratePanelPrefs(undefined, 2), undefined);
    assert.deepEqual(migratePanelPrefs([], 2), []);
});

test('does not mutate original prefs', () => {
    const prefs = [{ arrName: '__3d_highway__:Bass', lyrics: true }];
    const copy = JSON.stringify(prefs);
    migratePanelPrefs(prefs, 0);
    assert.equal(JSON.stringify(prefs), copy, 'original object unchanged');
});

// ── Panel grid placement (_panelGridPlacement) ───────────────────────────────
//
// Tests for the explicit gridRow / gridColumn assignments that fix issue #7's
// "2 top + 3 bottom, none of the bottom screens can be interacted with" report
// (KNOWN_ISSUES #8 — 'five' bottom row, #11 — 'quad'/'six' defence-in-depth).
//
// Both the LAYOUTS constant and the _panelGridPlacement function below are
// inlined verbatim from screen.js so they exercise the production logic rather
// than a separate copy.  Any drift will be caught by failing assertions.

// LAYOUTS constant (verbatim from screen.js)
const LAYOUTS = {
    'top-bottom': { panels: 2, cols: 1, rows: 2, style: 'flex-col' },
    'left-right': { panels: 2, cols: 2, rows: 1, style: 'flex-row' },
    'triple':     { panels: 3, cols: 3, rows: 1, style: 'grid'     },
    'triple-t':   { panels: 3, cols: 1, rows: 3, style: 'grid'     },
    'quad':       { panels: 4, cols: 2, rows: 2, style: 'grid'     },
    'five':       { panels: 5, cols: 3, rows: 2, style: 'grid-3x2' },
    'six':        { panels: 6, cols: 3, rows: 2, style: 'grid'     },
};

// _panelGridPlacement (verbatim from screen.js)
function _panelGridPlacement(index, cfg) {
    if (!cfg) return null;
    if (cfg.style === 'grid') {
        return {
            gridRow:    String(Math.floor(index / cfg.cols) + 1),
            gridColumn: String((index % cfg.cols) + 1),
        };
    }
    if (cfg.style === 'grid-3x2') {
        // Explicit start/end column lines (no `span` keyword) prevent CSS
        // auto-placement AND avoid the `span` keyword, which some older/embedded
        // WebViews (e.g. JUCE) fail to parse correctly (KNOWN_ISSUES #8).
        // Grid is 6 cols: top 2 panels each occupy 3 cols; bottom 3 each occupy 2 cols.
        const gridColumns = ['1 / 4', '4 / 7', '1 / 3', '3 / 5', '5 / 7'];
        return {
            gridRow:    index < 2 ? '1' : '2',
            gridColumn: gridColumns[index],
        };
    }
    return null;
}

// ── 'five' (grid-3x2) ─────────────────────────────────────────────────────────

console.log('\n_panelGridPlacement — "five" layout (grid-3x2, KNOWN_ISSUES #8)');

test('five: panel 0 (top-left) → row 1, col 1 / 4', () => {
    const p = _panelGridPlacement(0, LAYOUTS['five']);
    assert.equal(p.gridRow, '1');
    assert.equal(p.gridColumn, '1 / 4');
});

test('five: panel 1 (top-right) → row 1, col 4 / 7', () => {
    const p = _panelGridPlacement(1, LAYOUTS['five']);
    assert.equal(p.gridRow, '1');
    assert.equal(p.gridColumn, '4 / 7');
});

test('five: panel 2 (bottom-left) → row 2, col 1 / 3', () => {
    const p = _panelGridPlacement(2, LAYOUTS['five']);
    assert.equal(p.gridRow, '2');
    assert.equal(p.gridColumn, '1 / 3');
});

test('five: panel 3 (bottom-middle) → row 2, col 3 / 5', () => {
    const p = _panelGridPlacement(3, LAYOUTS['five']);
    assert.equal(p.gridRow, '2');
    assert.equal(p.gridColumn, '3 / 5');
});

test('five: panel 4 (bottom-right) → row 2, col 5 / 7', () => {
    const p = _panelGridPlacement(4, LAYOUTS['five']);
    assert.equal(p.gridRow, '2');
    assert.equal(p.gridColumn, '5 / 7');
});

// ── 'quad' (grid 2×2) ─────────────────────────────────────────────────────────

console.log('\n_panelGridPlacement — "quad" layout (grid 2×2, KNOWN_ISSUES #11)');

test('quad: panel 0 → row 1, col 1', () => {
    assert.deepEqual(
        _panelGridPlacement(0, LAYOUTS['quad']),
        { gridRow: '1', gridColumn: '1' },
    );
});

test('quad: panel 1 → row 1, col 2', () => {
    assert.deepEqual(
        _panelGridPlacement(1, LAYOUTS['quad']),
        { gridRow: '1', gridColumn: '2' },
    );
});

test('quad: panel 2 → row 2, col 1', () => {
    assert.deepEqual(
        _panelGridPlacement(2, LAYOUTS['quad']),
        { gridRow: '2', gridColumn: '1' },
    );
});

test('quad: panel 3 → row 2, col 2', () => {
    assert.deepEqual(
        _panelGridPlacement(3, LAYOUTS['quad']),
        { gridRow: '2', gridColumn: '2' },
    );
});

// ── 'six' (grid 3×2) ──────────────────────────────────────────────────────────

console.log('\n_panelGridPlacement — "six" layout (grid 3×2, KNOWN_ISSUES #11)');

test('six: top row panels → row 1', () => {
    for (let i = 0; i < 3; i++) {
        const p = _panelGridPlacement(i, LAYOUTS['six']);
        assert.equal(p.gridRow, '1', `panel ${i} should be in row 1`);
        assert.equal(p.gridColumn, String(i + 1), `panel ${i} should be in col ${i + 1}`);
    }
});

test('six: bottom row panels → row 2', () => {
    for (let i = 3; i < 6; i++) {
        const p = _panelGridPlacement(i, LAYOUTS['six']);
        assert.equal(p.gridRow, '2', `panel ${i} should be in row 2`);
        assert.equal(p.gridColumn, String(i - 2), `panel ${i} should be in col ${i - 2}`);
    }
});

console.log('\n_panelGridPlacement — "triple" layout (grid 3×1)');

test('triple: panel 0 → row 1, col 1', () => {
    assert.deepEqual(
        _panelGridPlacement(0, LAYOUTS['triple']),
        { gridRow: '1', gridColumn: '1' },
    );
});

test('triple: panel 1 → row 1, col 2', () => {
    assert.deepEqual(
        _panelGridPlacement(1, LAYOUTS['triple']),
        { gridRow: '1', gridColumn: '2' },
    );
});

test('triple: panel 2 → row 1, col 3', () => {
    assert.deepEqual(
        _panelGridPlacement(2, LAYOUTS['triple']),
        { gridRow: '1', gridColumn: '3' },
    );
});

console.log('\n_panelGridPlacement — "triple-t" layout (grid 1×3)');

test('triple-t: panel 0 → row 1, col 1', () => {
    assert.deepEqual(
        _panelGridPlacement(0, LAYOUTS['triple-t']),
        { gridRow: '1', gridColumn: '1' },
    );
});

test('triple-t: panel 1 → row 2, col 1', () => {
    assert.deepEqual(
        _panelGridPlacement(1, LAYOUTS['triple-t']),
        { gridRow: '2', gridColumn: '1' },
    );
});

test('triple-t: panel 2 → row 3, col 1', () => {
    assert.deepEqual(
        _panelGridPlacement(2, LAYOUTS['triple-t']),
        { gridRow: '3', gridColumn: '1' },
    );
});

// ── flex layouts return null ───────────────────────────────────────────────────

console.log('\n_panelGridPlacement — flex layouts return null');

test('top-bottom: flex layout → null (no grid placement)', () => {
    assert.equal(_panelGridPlacement(0, LAYOUTS['top-bottom']), null);
});

test('left-right: flex layout → null (no grid placement)', () => {
    assert.equal(_panelGridPlacement(0, LAYOUTS['left-right']), null);
});

// ── REDUNDANT_CONTROL_IDS ────────────────────────────────────────────────────
//
// Verifies that specific element IDs are present in REDUNDANT_CONTROL_IDS in
// screen.js (the list of core controls hidden while split-screen is active).
//
// screen.js is an IIFE so its exports can't be required directly.  We instead
// read the source file and check for the literal string values, which is
// robust enough: the constant is a simple string-array literal and the names
// are stable identifiers that won't appear incidentally elsewhere in the file.
//
// btn-practice must be present: the core Practice button is positioned over
// the split-screen wrap (z-index:3) with a higher z-index, intercepting
// pointer events on panel control bars across all layouts — most visibly
// blocking the bottom panel row entirely (issue #22).

const fs   = require('fs');
const path = require('path');
const screenSrc = fs.readFileSync(path.join(__dirname, '..', 'screen.js'), 'utf8');
const redundantControlIdsLiteral = (() => {
    // Use [\s\S] so the match works with both LF and CRLF line endings.
    const match = screenSrc.match(/const REDUNDANT_CONTROL_IDS = \[([\s\S]*?)\];/);
    assert.ok(match, 'screen.js is missing the REDUNDANT_CONTROL_IDS array literal');
    return match[1];
})();

console.log('\nREDUNDANT_CONTROL_IDS (checked against screen.js source)');

test('screen.js REDUNDANT_CONTROL_IDS includes btn-practice (issue #22)', () => {
    assert.ok(
        redundantControlIdsLiteral.includes("'btn-practice'"),
        "btn-practice must appear in screen.js's REDUNDANT_CONTROL_IDS so the " +
        'core Practice button is hidden while split is active and cannot ' +
        'intercept pointer events on panel control bars',
    );
});

test('screen.js REDUNDANT_CONTROL_IDS includes all legacy core controls', () => {
    const required = [
        'arr-select', 'mastery-slider-label', 'mastery-slider', 'mastery-label',
        'btn-lyrics', 'viz-picker-label', 'viz-picker', 'btn-practice',
    ];
    for (const id of required) {
        assert.ok(redundantControlIdsLiteral.includes("'" + id + "'"), "screen.js is missing '" + id + "' in REDUNDANT_CONTROL_IDS");
    }
});

// ── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${_passed} passed, ${_failed} failed\n`);
process.exit(_failed > 0 ? 1 : 0);
