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

      // ─── Challenge panel ──────────────────────────────────────
      challengePrefix: '{title}',
      tutorialPrefix: 'Tutorial: {title}',
      availableLabel: 'Available: ',
      hintBox: '💡 Hint {num}/{total}:\n{text}',
      hintsRemaining: '({n} left)',
      hintsNone: '(none left)',
      alreadyCompleted: '✅ Already completed!',
      dropdownPlaceholder: 'Challenges ▾',

      // ─── Test results ─────────────────────────────────────────
      forbiddenSingular: '⚠️ Forbidden instruction',
      forbiddenPlural: '⚠️ Forbidden instructions',
      lineLabel: 'Line ',
      allowedLabel: 'Allowed: ',
      testErrorLine: '⚠️ Test {n}: {io} → ERROR: {err}',
      testPassLine: '✅ Test {n}: {io} → {actual}',
      testFailLine: '❌ Test {n}: {io} → expected {expected}, got {actual}',
      allPassed: '🎉 All tests passed! Challenge completed!',
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

      // ─── Challenge/tutorial text (keyed by id) ─────────────────
      exercises: {
        // ─── Tutorials (0–3) ─────────────────────────────────────
        0: {
          name: 'Tutorial',
          title: 'Hello, Machine!',
          goal: 'Set r0 to 42 and halt the program',
          description:
            'Welcome to MiniASM! This tutorial teaches you the basics.\n' +
            '\n' +
            '🖥️ THE MACHINE\n' +
            'You have 4 registers (r0, r1, r2, r3) — small numbered slots that hold values.\n' +
            'You also have 64 memory cells (@0–@63).\n' +
            'During tests, all registers start at 0 (unless the test sets them).\n' +
            '\n' +
            '📝 HOW TO WRITE CODE\n' +
            'Each line is one instruction:  OPCODE arguments\n' +
            'Lines starting with ; are comments (ignored by the machine).\n' +
            '\n' +
            '🧰 TWO INSTRUCTIONS TO LEARN\n' +
            '  SET r0 #42  → Put the number 42 into register r0\n' +
            '  STP         → Stop the program (REQUIRED at the end!)\n' +
            '\n' +
            '🎯 YOUR TASK\n' +
            'Write a program that sets r0 to exactly 42, then stops.\n' +
            'You only need two lines!\n' +
            '\n' +
            '▶ Click "Run" to execute, or "Step" to go one instruction at a time.\n' +
            '   When ready, click "Test" in this panel to check your answer.',
          hints: [
            'The SET instruction copies a value into a register.\nTo write a constant number, prefix it with #.\nExample: SET r0 #42',
            'Don\'t forget to end your program with STP!\nYour full program:\n  SET r0 #42\n  STP',
          ],
          starterCode:
            '; ─── Tutorial 0: Hello, Machine! ───\n' +
            '; Goal: Set r0 to 42 and halt\n' +
            ';\n' +
            '; Useful instructions:\n' +
            ';   SET r0 #42  — put 42 into r0\n' +
            ';   STP         — stop the program\n' +
            ';\n' +
            '; Write your code below:\n' +
            '\n' +
            'STP\n',
        },
        1: {
          name: 'Tutorial',
          title: 'Copy Cat',
          goal: 'Copy the value of r2 into r0',
          description:
            'SET can also copy one register into another!\n' +
            '\n' +
            '🧰 NEW SKILL\n' +
            '  SET r0 r2   → Copy the value of r2 into r0\n' +
            '\n' +
            'You already know:\n' +
            '  SET r0 #N   → Put a constant N into r0\n' +
            '  STP         → Stop the program\n' +
            '\n' +
            '🎯 YOUR TASK\n' +
            'Register r2 is pre-loaded with a value by the test.\n' +
            'Copy that value into r0, then stop.\n' +
            '\n' +
            '💡 The difference:\n' +
            '  SET r0 #5   → Always puts 5 (a fixed number)\n' +
            '  SET r0 r2   → Copies whatever is in r2 (could be anything!)',
          hints: [
            'Use SET with two registers: SET r0 r2\nThis copies the value of r2 into r0.',
            'Your full program:\n  SET r0 r2\n  STP',
          ],
          starterCode:
            '; ─── Tutorial 1: Copy Cat ───\n' +
            '; Goal: Copy r2 into r0\n' +
            ';\n' +
            '; Useful instructions:\n' +
            ';   SET r0 r2  — copy r2 into r0\n' +
            ';   STP        — stop the program\n' +
            ';\n' +
            '; Write your code below:\n' +
            '\n' +
            'STP\n',
        },
        2: {
          name: 'Tutorial',
          title: 'Step by Step',
          goal: 'Put r2 + 3 into r0',
          description:
            'Programs run one line at a time, top to bottom.\n' +
            'You can chain instructions to build up a result!\n' +
            '\n' +
            '🧰 NEW INSTRUCTIONS\n' +
            '  INC r0   → Add 1 to r0\n' +
            '  DEC r0   → Subtract 1 from r0\n' +
            '\n' +
            'You already know:\n' +
            '  SET r0 r2   → Copy r2 into r0\n' +
            '  STP         → Stop the program\n' +
            '\n' +
            '🎯 YOUR TASK\n' +
            'Register r2 has a number. Put r2 + 3 into r0.\n' +
            '\n' +
            '💡 STRATEGY\n' +
            '1. First, copy r2 into r0 (so you start with its value)\n' +
            '2. Then, add 1 to r0 three times\n' +
            '3. Stop!\n' +
            '\n' +
            '📌 Use "Step" to watch each instruction execute one at a time.',
          hints: [
            'Start by copying r2 into r0 with SET.\nThen use INC r0 three times to add 3.',
            'Your full program:\n  SET r0 r2\n  INC r0\n  INC r0\n  INC r0\n  STP',
          ],
          starterCode:
            '; ─── Tutorial 2: Step by Step ───\n' +
            '; Goal: Put r2 + 3 into r0\n' +
            ';\n' +
            '; Useful instructions:\n' +
            ';   SET r0 r2  — copy r2 into r0\n' +
            ';   INC r0     — add 1 to r0\n' +
            ';   DEC r0     — subtract 1 from r0\n' +
            ';   STP        — stop the program\n' +
            ';\n' +
            '; Write your code below:\n' +
            '\n' +
            'STP\n',
        },
        3: {
          name: 'Tutorial',
          title: 'The Loop',
          goal: 'Transfer the value of r2 into r0 using a loop',
          description:
            'The most powerful concept: LOOPS!\n' +
            'A loop repeats instructions until a condition is met.\n' +
            '\n' +
            '🧰 NEW INSTRUCTIONS\n' +
            '  ISZ r2    → If r2 is zero, SKIP the next line\n' +
            '  JMP i4    → Jump to line 4 (go back / go forward)\n' +
            '\n' +
            '🔄 THE LOOP PATTERN\n' +
            'Here\'s how to repeat something until r2 reaches 0:\n' +
            '\n' +
            '  Line 1: ISZ r2    ← Is r2 zero?\n' +
            '  Line 2: JMP i4    ← NO → jump to loop body (line 4)\n' +
            '  Line 3: STP       ← YES → done! stop here\n' +
            '  Line 4: ...       ← loop body (do your work)\n' +
            '  Line 5: ...       ← more work\n' +
            '  Line 6: JMP i1    ← go back to check again\n' +
            '\n' +
            '🎯 YOUR TASK\n' +
            'r2 has a number. Transfer it into r0, one unit at a time.\n' +
            'Each loop step: DEC r2 (remove 1) and INC r0 (add 1).\n' +
            'When r2 reaches 0, r0 holds the original value!\n' +
            '\n' +
            '⚠️ SET is NOT available — you must use the loop!\n' +
            '   (During tests, r0 starts at 0.)',
          hints: [
            'Follow the loop pattern from the description.\nYour loop body should DEC r2 and INC r0.\nThen JMP back to the ISZ check.',
            'Full solution:\n  ISZ r2\n  JMP i4\n  STP\n  DEC r2\n  INC r0\n  JMP i1',
          ],
          starterCode:
            '; ─── Tutorial 3: The Loop ───\n' +
            '; Goal: Transfer r2 into r0 using a loop\n' +
            ';\n' +
            '; Available: INC, DEC, ISZ, ISN, JMP, STP\n' +
            '; (SET is NOT available!)\n' +
            ';\n' +
            '; The loop pattern:\n' +
            ';   ISZ r2    ; check if r2 is 0\n' +
            ';   JMP i?    ; if not, jump to loop body\n' +
            ';   STP       ; if yes, we\'re done\n' +
            ';   ...       ; loop body\n' +
            ';   JMP i1    ; go back to check\n' +
            ';\n' +
            '; Write your code below:\n' +
            '\n' +
            'STP\n',
        },
        // ─── Challenges (4–6) ────────────────────────────────────
        4: {
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
            'You may use r0, r1 as scratch registers and memory (@0–@63).\n' +
            '\n' +
            '💡 Hint: combine what you learned in the tutorials!\n' +
            '   Copy r2 into r0 (SET), then loop to add r3 into r0.',
          hints: [
            'You can only INC and DEC by 1.\nThink: how would you move a value from r3 into r0, one unit at a time?',
            'First copy r2 into r0 (SET r0 r2).\nThen loop: INC r0, DEC r3, repeat until r3 == 0.\nUse ISZ r3 to detect when to stop.',
          ],
          starterCode:
            '; ─── Challenge: Addition ───\n' +
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
        5: {
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
            '💡 You now have ADD rX rY available from the previous exercise!',
          hints: [
            'Multiplication is repeated addition.\n3 × 4 = 3 + 3 + 3 + 3  (add 3 to a result, 4 times).',
            'Set r0 to 0. Copy r2 into r1 (to preserve it).\nLoop: ADD r0 r1, DEC r3, repeat until r3 == 0.\nUse ISZ r3 to detect when to stop.',
          ],
          starterCode:
            '; ─── Challenge: Multiplication ───\n' +
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
        6: {
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
            '; ─── Challenge: Exponentiation ───\n' +
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
