/**
 * MiniASM — Internationalization strings.
 * Each entry in LANGUAGES is a complete set of translatable text.
 * For now only English is defined; add new languages by copying the
 * English object and translating every value.
 */
(function () {
  var LANGUAGES = [
    {
      code: 'en',
      name: 'English',

      // ─── Toolbar & Navigation ─────────────────────────────────
      sandbox: '🏖️ Sandbox',
      btnCode: 'Code',
      btnBlocks: 'Blocks',
      btnRun: 'Run',
      btnStep: 'Step',
      btnReset: 'Reset',
      btnTest: '▶ Test',
      btnHint: '💡 Hint',

      // ─── Status bar ───────────────────────────────────────────
      stopped: 'Stopped',
      halted: 'Halted',
      pcLabel: 'PC = ',

      // ─── Tables ───────────────────────────────────────────────
      registers: 'Registers',
      value: 'Value',
      memory: 'Memory',

      // ─── Errors (shown to user) ───────────────────────────────
      parseError: 'Parse error: ',
      noInstructions: 'No instructions to execute',
      timeout: 'TIMEOUT — possible infinite loop (100 000 steps)',

      // ─── Exercise panel ───────────────────────────────────────
      exercisePrefix: 'Exercise {id}: {title}',
      availableLabel: 'Available: ',
      hintBox: '💡 Hint {num}/{total}:\n{text}',
      hintsRemaining: '({n} left)',
      hintsNone: '(none left)',
      alreadyCompleted: '✅ Already completed!',

      // ─── Test results ─────────────────────────────────────────
      forbiddenSingular: '⚠️ Forbidden instruction',
      forbiddenPlural: '⚠️ Forbidden instructions',
      lineLabel: 'Line ',
      allowedLabel: 'Allowed: ',
      testErrorLine: '⚠️ Test {n}: {io} → ERROR: {err}',
      testPassLine: '✅ Test {n}: {io} → {actual}',
      testFailLine: '❌ Test {n}: {io} → expected {expected}, got {actual}',
      allPassed: '🎉 All tests passed! Exercise completed!',
      unlockMsg: '🔓 New instruction unlocked: {instr}',
      stillPass: '🎉 All tests still pass!',
      someFailed: 'Some tests failed — keep trying!',

      // ─── Blockly blocks ───────────────────────────────────────
      blockStart: 'start',
      blockTo: 'to',
      tooltipStart: 'Program entry point. All instructions chain below this block.',
      tooltipSet: 'SET dest src — Copy a value into a register or memory cell.\ndest: reg (rN) or mem (@N)\nsrc: reg (rN), mem (@N), or immediate (#N)',
      tooltipInc: 'INC rN — Increment register rN by 1.',
      tooltipDec: 'DEC rN — Decrement register rN by 1.',
      tooltipIsz: 'ISZ rN — If register rN is zero, skip the next instruction.',
      tooltipIsn: 'ISN rN — If register rN is negative, skip the next instruction.',
      tooltipJmp: 'JMP iN — Jump to instruction N (unconditional goto).',
      tooltipStp: 'STP — Stop execution and halt the program.',
      tooltipAdd: 'ADD rX rY — rX = rX + rY  (rY is preserved)',
      tooltipMul: 'MUL rX rY — rX = rX × rY  (rY is preserved)',
      tooltipPow: 'POW rX rY — rX = rX ^ rY  (rY is preserved)',

      // ─── Blockly category names ───────────────────────────────
      catData: 'Data',
      catArithmetic: 'Arithmetic',
      catControl: 'Control',

      // ─── Exercise text (keyed by exercise id) ─────────────────
      exercises: {
        1: {
          name: 'ADD',
          title: 'Addition',
          goal: 'Put r2 + r3 into r0',
          description:
            'Registers r2 and r3 are pre-loaded with values.\n' +
            'Write a program that:\n' +
            '  • Computes r2 + r3\n' +
            '  • Stores the result in r0\n' +
            '  • Ends with STP\n' +
            '\n' +
            'You may use r0, r1 as scratch registers and memory (@0–@63).',
          hints: [
            'You can only INC and DEC by 1.\nThink: how would you move a value from r3 into r0, one unit at a time?',
            'First copy r2 into r0 (SET r0 r2).\nThen loop: INC r0, DEC r3, repeat until r3 == 0.\nUse ISZ r3 to detect when to stop.',
          ],
          starterCode:
            '; ─── Exercise 1: Addition ───\n' +
            '; Goal: Put r2 + r3 into r0\n' +
            ';\n' +
            '; Available: SET, INC, DEC, ISZ, ISN, STP, JMP\n' +
            '; Inputs in r2 and r3. Store result in r0.\n' +
            '; r0, r1 are free to use as scratch.\n' +
            ';\n' +
            '; Write your code below:\n' +
            '\n' +
            'STP\n',
        },
        2: {
          name: 'MUL',
          title: 'Multiplication',
          goal: 'Put r2 × r3 into r0',
          description:
            'Registers r2 and r3 are pre-loaded with values.\n' +
            'Write a program that:\n' +
            '  • Computes r2 × r3\n' +
            '  • Stores the result in r0\n' +
            '  • Ends with STP\n' +
            '\n' +
            'You may use r0, r1 as scratch registers and memory (@0–@63).\n' +
            '\n' +
            '💡 You now have ADD rX rY available from Exercise 1!',
          hints: [
            'Multiplication is repeated addition.\n3 × 4 = 3 + 3 + 3 + 3  (add 3 to a result, 4 times).',
            'Set r0 to 0. Copy r2 into r1 (to preserve it).\nLoop: ADD r0 r1, DEC r3, repeat until r3 == 0.\nUse ISZ r3 to detect when to stop.',
          ],
          starterCode:
            '; ─── Exercise 2: Multiplication ───\n' +
            '; Goal: Put r2 × r3 into r0\n' +
            ';\n' +
            '; Available: SET, INC, DEC, ISZ, ISN, STP, JMP, ADD\n' +
            '; Inputs in r2 and r3. Store result in r0.\n' +
            '; r0, r1 are free to use as scratch.\n' +
            ';\n' +
            '; Write your code below:\n' +
            '\n' +
            'STP\n',
        },
        3: {
          name: 'POW',
          title: 'Exponentiation',
          goal: 'Put r2 ^ r3 into r0  (r2 raised to the power r3)',
          description:
            'Registers r2 and r3 are pre-loaded with values.\n' +
            'Write a program that:\n' +
            '  • Raises r2 to the power of r3\n' +
            '  • Stores the result in r0\n' +
            '  • Ends with STP\n' +
            '\n' +
            'You may use r0, r1 as scratch registers and memory (@0–@63).\n' +
            '\n' +
            '💡 You now have ADD and MUL available!',
          hints: [
            'Exponentiation is repeated multiplication.\n2^3 = 2 × 2 × 2  (multiply 1 by the base, exponent times).',
            'Remember: x^0 = 1 for any x.\nStart r0 at 1. Copy r2 into r1 (to preserve the base).\nLoop: MUL r0 r1, DEC r3, repeat until r3 == 0.',
          ],
          starterCode:
            '; ─── Exercise 3: Exponentiation ───\n' +
            '; Goal: Put r2 ^ r3 into r0\n' +
            ';\n' +
            '; Available: SET, INC, DEC, ISZ, ISN, STP, JMP, ADD, MUL\n' +
            '; Inputs in r2 and r3. Store result in r0.\n' +
            '; r0, r1 are free to use as scratch.\n' +
            ';\n' +
            '; Write your code below:\n' +
            '\n' +
            'STP\n',
        },
      },
    },
  ];

  // ─── Current language (default: first entry) ─────────────────
  var current = LANGUAGES[0];

  /**
   * Get a translated string, with optional placeholder replacement.
   * Usage: T('hintBox', { num: 1, total: 3, text: '...' })
   */
  function T(key, params) {
    var s = current[key];
    if (s === undefined) return key;
    if (params) {
      for (var p in params) {
        s = s.replace(new RegExp('\\{' + p + '\\}', 'g'), params[p]);
      }
    }
    return s;
  }

  window.MiniASMLang = {
    LANGUAGES: LANGUAGES,
    current: function () { return current; },
    setCurrent: function (code) {
      for (var i = 0; i < LANGUAGES.length; i++) {
        if (LANGUAGES[i].code === code) {
          current = LANGUAGES[i];
          return true;
        }
      }
      return false;
    },
    T: T,
  };
})();
