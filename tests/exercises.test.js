/**
 * @jest-environment jsdom
 *
 * Unit tests for the MiniASM exercise system (exercises.js).
 * Depends on config, lang, and interpreter being attached to window.
 */
const path = require('path');

beforeAll(() => {
  require(path.join(__dirname, '../js/config.js'));
  require(path.join(__dirname, '../js/lang.js'));
  require(path.join(__dirname, '../js/interpreter.js'));
  require(path.join(__dirname, '../js/exercises.js'));
});

function getExercisesAPI() {
  return window.MiniASMExercises;
}

describe('MiniASM Exercise System', () => {
  let EXERCISES, PRIMITIVES, loadProgress, saveProgress, isCompleted, markCompleted,
    isAvailable, getUnlockedInstructions, effectiveAvailable, validateOpcodes, runAllTests, formatIO;

  beforeEach(() => {
    localStorage.clear();
    const api = getExercisesAPI();
    EXERCISES = api.EXERCISES;
    PRIMITIVES = api.PRIMITIVES;
    loadProgress = api.loadProgress;
    saveProgress = api.saveProgress;
    isCompleted = api.isCompleted;
    markCompleted = api.markCompleted;
    isAvailable = api.isAvailable;
    getUnlockedInstructions = api.getUnlockedInstructions;
    effectiveAvailable = api.effectiveAvailable;
    validateOpcodes = api.validateOpcodes;
    runAllTests = api.runAllTests;
    formatIO = api.formatIO;
  });

  describe('EXERCISES, CATEGORIES, and PRIMITIVES', () => {
    it('PRIMITIVES lists base opcodes', () => {
      expect(PRIMITIVES).toContain('SET');
      expect(PRIMITIVES).toContain('INC');
      expect(PRIMITIVES).toContain('DEC');
      expect(PRIMITIVES).toContain('ISZ');
      expect(PRIMITIVES).toContain('ISN');
      expect(PRIMITIVES).toContain('STP');
      expect(PRIMITIVES).toContain('JMP');
      expect(PRIMITIVES).toHaveLength(7);
    });
    it('CATEGORIES has at least one category', () => {
      const CATEGORIES = getExercisesAPI().CATEGORIES;
      expect(CATEGORIES.length).toBeGreaterThanOrEqual(1);
      CATEGORIES.forEach((cat) => {
        expect(cat).toHaveProperty('id');
        expect(cat).toHaveProperty('name');
      });
    });
    it('EXERCISES has at least 14 entries (6 tutorials + 8 challenges)', () => {
      expect(EXERCISES.length).toBeGreaterThanOrEqual(14);
    });
    it('each exercise has id, category, type, requires, available, tests, unlocks', () => {
      const CATEGORIES = getExercisesAPI().CATEGORIES;
      const catIds = CATEGORIES.map((c) => c.id);
      EXERCISES.forEach((ex) => {
        expect(ex).toHaveProperty('id');
        expect(ex).toHaveProperty('category');
        expect(catIds).toContain(ex.category);
        expect(ex).toHaveProperty('type');
        expect(['tutorial', 'challenge']).toContain(ex.type);
        expect(ex).toHaveProperty('requires');
        expect(Array.isArray(ex.requires)).toBe(true);
        expect(ex).toHaveProperty('available');
        expect(Array.isArray(ex.available)).toBe(true);
        expect(ex).toHaveProperty('tests');
        expect(Array.isArray(ex.tests)).toBe(true);
        expect(ex.tests.length).toBeGreaterThan(0);
        ex.tests.forEach((t) => {
          expect(t).toHaveProperty('inputs');
          expect(t).toHaveProperty('expected');
        });
      });
    });
    it('CATEGORIES includes comparisons', () => {
      const CATEGORIES = getExercisesAPI().CATEGORIES;
      const catIds = CATEGORIES.map((c) => c.id);
      expect(catIds).toContain('arithmetic');
      expect(catIds).toContain('comparisons');
    });
  });

  describe('progress (localStorage)', () => {
    it('loadProgress returns { completed: [] } when empty', () => {
      expect(loadProgress()).toEqual({ completed: [] });
    });
    it('saveProgress and loadProgress round-trip', () => {
      saveProgress({ completed: [4, 5] });
      expect(loadProgress()).toEqual({ completed: [4, 5] });
    });
    it('isCompleted returns false when not completed', () => {
      expect(isCompleted(4)).toBe(false);
    });
    it('markCompleted and isCompleted', () => {
      markCompleted(4);
      expect(isCompleted(4)).toBe(true);
      expect(loadProgress().completed).toContain(4);
    });
    it('markCompleted is idempotent', () => {
      markCompleted(4);
      markCompleted(4);
      expect(loadProgress().completed).toEqual([4]);
    });
  });

  describe('isAvailable', () => {
    it('first exercise (tutorial 0) is always available', () => {
      expect(isAvailable(EXERCISES[0])).toBe(true);
    });
    it('tutorial 1 requires tutorial 0 completed', () => {
      const t1 = EXERCISES.find((e) => e.id === 1);
      if (!t1) return;
      expect(isAvailable(t1)).toBe(false);
      markCompleted(0);
      expect(isAvailable(t1)).toBe(true);
    });
    it('ADD exercise (id=4) requires all tutorials (0-3) completed', () => {
      const add = EXERCISES.find((e) => e.id === 4);
      if (!add) return;
      expect(isAvailable(add)).toBe(false);
      markCompleted(0);
      markCompleted(1);
      markCompleted(2);
      expect(isAvailable(add)).toBe(false);
      markCompleted(3);
      expect(isAvailable(add)).toBe(true);
    });
    it('MUL exercise (id=5) requires all earlier exercises completed', () => {
      const mul = EXERCISES.find((e) => e.id === 5);
      if (!mul) return;
      expect(isAvailable(mul)).toBe(false);
      for (var i = 0; i <= 4; i++) markCompleted(i);
      expect(isAvailable(mul)).toBe(true);
    });
    it('POW exercise (id=6) requires all earlier exercises completed', () => {
      const pow = EXERCISES.find((e) => e.id === 6);
      if (!pow) return;
      expect(isAvailable(pow)).toBe(false);
      for (var i = 0; i <= 4; i++) markCompleted(i);
      expect(isAvailable(pow)).toBe(false);
      markCompleted(5);
      expect(isAvailable(pow)).toBe(true);
    });
    it('Comparisons tutorial (id=7) requires all Arithmetic completed', () => {
      const t7 = EXERCISES.find((e) => e.id === 7);
      if (!t7) return;
      expect(isAvailable(t7)).toBe(false);
      for (var i = 0; i <= 5; i++) markCompleted(i);
      expect(isAvailable(t7)).toBe(false);
      markCompleted(6);
      expect(isAvailable(t7)).toBe(true);
    });
    it('SUB challenge (id=9) requires tutorials 7-8 completed', () => {
      const sub = EXERCISES.find((e) => e.id === 9);
      if (!sub) return;
      expect(isAvailable(sub)).toBe(false);
      for (var i = 0; i <= 7; i++) markCompleted(i);
      expect(isAvailable(sub)).toBe(false);
      markCompleted(8);
      expect(isAvailable(sub)).toBe(true);
    });
  });

  describe('getUnlockedInstructions', () => {
    it('returns empty when no exercise completed', () => {
      expect(getUnlockedInstructions()).toEqual([]);
    });
    it('returns empty after completing only tutorials (no unlocks)', () => {
      markCompleted(0);
      markCompleted(1);
      markCompleted(2);
      markCompleted(3);
      expect(getUnlockedInstructions()).toEqual([]);
    });
    it('returns ADD after exercise 4', () => {
      markCompleted(4);
      expect(getUnlockedInstructions()).toContain('ADD');
    });
    it('returns ADD and MUL after exercises 4 and 5', () => {
      markCompleted(4);
      markCompleted(5);
      const u = getUnlockedInstructions();
      expect(u).toContain('ADD');
      expect(u).toContain('MUL');
    });
    it('returns ADD, MUL, POW after exercises 4, 5 and 6', () => {
      markCompleted(4);
      markCompleted(5);
      markCompleted(6);
      const u = getUnlockedInstructions();
      expect(u).toContain('ADD');
      expect(u).toContain('MUL');
      expect(u).toContain('POW');
    });
    it('returns SUB after exercise 9', () => {
      markCompleted(9);
      expect(getUnlockedInstructions()).toContain('SUB');
    });
    it('returns ADD, MUL, POW, SUB after all arithmetic + SUB challenge', () => {
      for (var i = 4; i <= 9; i++) markCompleted(i);
      const u = getUnlockedInstructions();
      expect(u).toContain('ADD');
      expect(u).toContain('MUL');
      expect(u).toContain('POW');
      expect(u).toContain('SUB');
    });
  });

  describe('effectiveAvailable', () => {
    it('for ADD exercise (id=4) is just primitives', () => {
      const ex = EXERCISES.find((e) => e.id === 4);
      expect(effectiveAvailable(ex)).toEqual(expect.arrayContaining(PRIMITIVES));
      expect(effectiveAvailable(ex).length).toBe(PRIMITIVES.length);
    });
    it('for MUL exercise (id=5) includes ADD when exercise 4 completed', () => {
      markCompleted(4);
      const ex = EXERCISES.find((e) => e.id === 5);
      expect(effectiveAvailable(ex)).toContain('ADD');
    });
    it('for loop tutorial (id=3) does NOT include SET', () => {
      const ex = EXERCISES.find((e) => e.id === 3);
      expect(effectiveAvailable(ex)).not.toContain('SET');
    });
    it('for ABS challenge (id=10) includes SUB when exercise 9 completed', () => {
      markCompleted(9);
      const ex = EXERCISES.find((e) => e.id === 10);
      expect(effectiveAvailable(ex)).toContain('SUB');
    });
  });

  describe('validateOpcodes', () => {
    it('returns empty for source using only allowed opcodes', () => {
      const allowed = ['SET', 'INC', 'DEC', 'ISZ', 'STP', 'JMP'];
      const errors = validateOpcodes('SET r0 #0\nINC r0\nSTP', allowed);
      expect(errors).toEqual([]);
    });
    it('reports forbidden opcode and line number', () => {
      const allowed = PRIMITIVES;
      const errors = validateOpcodes('SET r0 #0\nADD r0 r1\nSTP', allowed);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({ line: 2, opcode: 'ADD' });
    });
    it('ignores comment lines in line numbering', () => {
      const allowed = PRIMITIVES;
      const errors = validateOpcodes('; comment\nADD r0 r1\nSTP', allowed);
      expect(errors[0].line).toBe(2);
    });
    it('ignores empty lines', () => {
      const errors = validateOpcodes('\n\nSET r0 #0\nSTP', PRIMITIVES);
      expect(errors).toEqual([]);
    });
    it('returns multiple errors for multiple forbidden opcodes', () => {
      const allowed = ['SET', 'STP'];
      const errors = validateOpcodes('INC r0\nMUL r0 r1\nSTP', allowed);
      expect(errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('formatIO', () => {
    it('formats register inputs', () => {
      expect(formatIO({ r0: 5, r1: 3 })).toMatch(/r0=5/);
      expect(formatIO({ r2: 10 })).toMatch(/r2=10/);
    });
    it('formats memory inputs', () => {
      const s = formatIO({ '@0': 7 });
      expect(s).toMatch(/mem\[0\]=7/);
    });
  });

  // ─── Tutorial tests ──────────────────────────────────────────────

  describe('runAllTests (tutorial 0: Hello Machine)', () => {
    let ex;
    beforeEach(() => { ex = getExercisesAPI().EXERCISES.find((e) => e.id === 0); });

    it('passes with correct solution', () => {
      const result = runAllTests(ex, 'SET r0 #42\nSTP');
      expect(result.allPassed).toBe(true);
    });
    it('fails with wrong value', () => {
      const result = runAllTests(ex, 'SET r0 #10\nSTP');
      expect(result.allPassed).toBe(false);
    });
  });

  describe('runAllTests (tutorial 1: Copy Cat)', () => {
    let ex;
    beforeEach(() => { ex = getExercisesAPI().EXERCISES.find((e) => e.id === 1); });

    it('passes with correct solution', () => {
      const result = runAllTests(ex, 'SET r0 r2\nSTP');
      expect(result.allPassed).toBe(true);
    });
    it('fails with hardcoded value', () => {
      const result = runAllTests(ex, 'SET r0 #7\nSTP');
      expect(result.allPassed).toBe(false);
    });
  });

  describe('runAllTests (tutorial 2: Step by Step)', () => {
    let ex;
    beforeEach(() => { ex = getExercisesAPI().EXERCISES.find((e) => e.id === 2); });

    it('passes with correct solution', () => {
      const result = runAllTests(ex, 'SET r0 r2\nINC r0\nINC r0\nINC r0\nSTP');
      expect(result.allPassed).toBe(true);
    });
    it('fails when only copying without incrementing', () => {
      const result = runAllTests(ex, 'SET r0 r2\nSTP');
      expect(result.allPassed).toBe(false);
    });
  });

  describe('runAllTests (tutorial 3: The Loop)', () => {
    let ex;
    beforeEach(() => { ex = getExercisesAPI().EXERCISES.find((e) => e.id === 3); });

    const loopSolution = [
      'ISZ r2',
      'JMP i4',
      'STP',
      'DEC r2',
      'INC r0',
      'JMP i1',
    ].join('\n');

    it('passes with correct loop solution', () => {
      const result = runAllTests(ex, loopSolution);
      expect(result.allPassed).toBe(true);
    });
    it('forbids SET in loop tutorial', () => {
      const result = runAllTests(ex, 'SET r0 r2\nSTP');
      expect(result.forbidden).toBeDefined();
      expect(result.forbidden.length).toBeGreaterThan(0);
      expect(result.forbidden[0].opcode).toBe('SET');
    });
  });

  // ─── Exercise tests ──────────────────────────────────────────────

  describe('runAllTests (exercise 4: addition)', () => {
    let ex;
    beforeEach(() => { ex = getExercisesAPI().EXERCISES.find((e) => e.id === 4); });
    const passingSource = [
      'SET r0 r2',
      'ISZ r3',
      'JMP i5',
      'STP',
      'INC r0',
      'DEC r3',
      'JMP i1',
    ].join('\n');

    it('returns forbidden when using disallowed opcode', () => {
      const result = runAllTests(ex, 'ADD r0 r1\nSET r0 r2\nSTP');
      expect(result.forbidden).toHaveLength(1);
      expect(result.forbidden[0].opcode).toBe('ADD');
      expect(result.allPassed).toBe(false);
    });
    it('returns results and no forbidden for valid addition solution', () => {
      const result = runAllTests(ex, passingSource);
      expect(result.forbidden).toBeUndefined();
      expect(result.results.length).toBe(ex.tests.length);
      expect(result.results.every((r) => r.hasOwnProperty('passed'))).toBe(true);
      expect(result.allPassed).toBeDefined();
    });
    it('returns allPassed false when one test fails', () => {
      const wrongSource = 'SET r0 #0\nSTP'; // always 0
      const result = runAllTests(ex, wrongSource);
      expect(result.allPassed).toBe(false);
      expect(result.results.some((r) => !r.passed)).toBe(true);
    });
    it('returns error in result when program has parse error (allowed opcodes)', () => {
      const result = runAllTests(ex, 'SET r0\nSTP'); // SET with one arg is invalid
      expect(result.forbidden).toBeUndefined();
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].error).toBeDefined();
      expect(result.allPassed).toBe(false);
    });
  });

  describe('runAllTests (exercise 5: multiplication)', () => {
    let ex;
    beforeEach(() => { ex = getExercisesAPI().EXERCISES.find((e) => e.id === 5); });
    const passingSource = [
      'SET r0 #0',
      'SET r1 r2',
      'ISZ r3',
      'JMP i7',
      'STP',
      'ADD r0 r1',
      'DEC r3',
      'JMP i2',
    ].join('\n');

    it('runs all tests and returns valid structure for MUL solution', () => {
      const result = runAllTests(ex, passingSource);
      expect(result.forbidden).toBeUndefined();
      expect(result.results.length).toBe(ex.tests.length);
      expect(typeof result.allPassed).toBe('boolean');
    });
  });

  describe('runAllTests (exercise 6: exponentiation)', () => {
    let ex;
    beforeEach(() => { ex = getExercisesAPI().EXERCISES.find((e) => e.id === 6); });
    const passingSource = [
      'SET r0 #1',
      'SET r1 r2',
      'ISZ r3',
      'JMP i7',
      'STP',
      'MUL r0 r1',
      'DEC r3',
      'JMP i2',
    ].join('\n');

    it('runs all tests and returns valid structure for POW solution', () => {
      const result = runAllTests(ex, passingSource);
      expect(result.forbidden).toBeUndefined();
      expect(result.results.length).toBe(ex.tests.length);
      expect(typeof result.allPassed).toBe('boolean');
    });
  });

  // ─── Comparisons & Logic tutorials ────────────────────────────

  describe('runAllTests (tutorial 7: Going Down)', () => {
    let ex;
    beforeEach(() => { ex = getExercisesAPI().EXERCISES.find((e) => e.id === 7); });

    it('passes with correct solution', () => {
      const result = runAllTests(ex, 'SET r0 r2\nDEC r0\nDEC r0\nDEC r0\nDEC r0\nDEC r0\nSTP');
      expect(result.allPassed).toBe(true);
    });
    it('fails without enough DECs', () => {
      const result = runAllTests(ex, 'SET r0 r2\nDEC r0\nDEC r0\nSTP');
      expect(result.allPassed).toBe(false);
    });
  });

  describe('runAllTests (tutorial 8: Which Way?)', () => {
    let ex;
    beforeEach(() => { ex = getExercisesAPI().EXERCISES.find((e) => e.id === 8); });

    it('passes with correct solution', () => {
      const result = runAllTests(ex, 'SET r0 #0\nISN r2\nJMP i5\nSET r0 #1\nSTP');
      expect(result.allPassed).toBe(true);
    });
    it('fails when always returning 1', () => {
      const result = runAllTests(ex, 'SET r0 #1\nSTP');
      expect(result.allPassed).toBe(false);
    });
    it('fails when always returning 0', () => {
      const result = runAllTests(ex, 'SET r0 #0\nSTP');
      expect(result.allPassed).toBe(false);
    });
  });

  // ─── Comparisons & Logic challenges ───────────────────────────

  describe('runAllTests (challenge 9: SUB)', () => {
    let ex;
    beforeEach(() => { ex = getExercisesAPI().EXERCISES.find((e) => e.id === 9); });

    const passingSource = [
      'SET r0 r2',
      'ISZ r3',
      'JMP i5',
      'STP',
      'DEC r0',
      'DEC r3',
      'JMP i2',
    ].join('\n');

    it('passes with correct DEC-loop solution', () => {
      const result = runAllTests(ex, passingSource);
      expect(result.allPassed).toBe(true);
    });
    it('fails with addition solution', () => {
      const result = runAllTests(ex, 'SET r0 r2\nISZ r3\nJMP i5\nSTP\nINC r0\nDEC r3\nJMP i2');
      expect(result.allPassed).toBe(false);
    });
    it('forbids SUB instruction (it is the unlock)', () => {
      const result = runAllTests(ex, 'SET r0 r2\nSUB r0 r3\nSTP');
      expect(result.forbidden).toBeDefined();
      expect(result.forbidden.length).toBeGreaterThan(0);
    });
  });

  describe('runAllTests (challenge 10: ABS)', () => {
    let ex;
    beforeEach(() => {
      ex = getExercisesAPI().EXERCISES.find((e) => e.id === 10);
      // Unlock SUB so it becomes available via effectiveAvailable
      markCompleted(9);
    });

    const passingSource = [
      'SET r0 r2',
      'ISN r0',
      'JMP i7',
      'SET r1 #0',
      'SUB r1 r0',
      'SET r0 r1',
      'STP',
    ].join('\n');

    it('passes with correct solution', () => {
      const result = runAllTests(ex, passingSource);
      expect(result.allPassed).toBe(true);
    });
    it('fails when just copying r2 (negative inputs fail)', () => {
      const result = runAllTests(ex, 'SET r0 r2\nSTP');
      expect(result.allPassed).toBe(false);
    });
  });

  describe('runAllTests (challenge 11: SGN)', () => {
    let ex;
    beforeEach(() => {
      ex = getExercisesAPI().EXERCISES.find((e) => e.id === 11);
      markCompleted(9);
    });

    const passingSource = [
      'ISZ r2',
      'JMP i5',
      'SET r0 #0',
      'STP',
      'ISN r2',
      'JMP i10',
      'SET r0 #0',
      'DEC r0',
      'STP',
      'SET r0 #1',
      'STP',
    ].join('\n');

    it('passes with correct three-branch solution', () => {
      const result = runAllTests(ex, passingSource);
      expect(result.allPassed).toBe(true);
    });
    it('fails when always returning 1', () => {
      const result = runAllTests(ex, 'SET r0 #1\nSTP');
      expect(result.allPassed).toBe(false);
    });
  });

  describe('runAllTests (challenge 12: MIN)', () => {
    let ex;
    beforeEach(() => {
      ex = getExercisesAPI().EXERCISES.find((e) => e.id === 12);
      markCompleted(9);
    });

    const passingSource = [
      'SET r0 r2',
      'SUB r0 r3',
      'ISN r0',
      'JMP i7',
      'SET r0 r2',
      'STP',
      'SET r0 r3',
      'STP',
    ].join('\n');

    it('passes with correct SUB-compare solution', () => {
      const result = runAllTests(ex, passingSource);
      expect(result.allPassed).toBe(true);
    });
    it('fails when always returning r2', () => {
      const result = runAllTests(ex, 'SET r0 r2\nSTP');
      expect(result.allPassed).toBe(false);
    });
  });

  describe('runAllTests (challenge 13: MAX)', () => {
    let ex;
    beforeEach(() => {
      ex = getExercisesAPI().EXERCISES.find((e) => e.id === 13);
      markCompleted(9);
    });

    const passingSource = [
      'SET r0 r2',
      'SUB r0 r3',
      'ISN r0',
      'JMP i7',
      'SET r0 r3',
      'STP',
      'SET r0 r2',
      'STP',
    ].join('\n');

    it('passes with correct SUB-compare solution', () => {
      const result = runAllTests(ex, passingSource);
      expect(result.allPassed).toBe(true);
    });
    it('fails when always returning r2', () => {
      const result = runAllTests(ex, 'SET r0 r2\nSTP');
      expect(result.allPassed).toBe(false);
    });
  });
});
