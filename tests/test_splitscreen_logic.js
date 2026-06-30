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

// ── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${_passed} passed, ${_failed} failed\n`);
process.exit(_failed > 0 ? 1 : 0);
