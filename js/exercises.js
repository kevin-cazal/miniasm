/**
 * MiniASM Exercise System — progressive challenges for the web IDE.
 * Depends on: lang.js
 *
 * ─── HOW TO ADD A NEW EXERCISE ────────────────────────────────────────
 *  1. Add the exercise text (name, title, goal, description, hints,
 *     starterCode) to each language in lang.js under exercises[id].
 *  2. Append a new data object to EXERCISE_DATA below (id, available,
 *     unlocks, tests).
 *  3. If the exercise unlocks a new instruction, make sure that
 *     instruction is defined in interpreter.js (INST object) and
 *     has a corresponding Blockly block in blocks-miniasm.js.
 *  4. That's it! Navigation, progress, testing, and unlocking
 *     are all handled automatically.
 * ──────────────────────────────────────────────────────────────────────
 */
(function () {
  var T = window.MiniASMLang.T;
  var lang = window.MiniASMLang.current();
  var CFG = window.MiniASMConfig;

  var STORAGE_KEY = 'miniasm-progress';

  // Primitive instructions — always available
  var PRIMITIVES = ['SET', 'INC', 'DEC', 'ISZ', 'ISN', 'STP', 'JMP'];

  // ─── Exercise data (structural / non-translatable) ─────────────────
  //
  // Each entry has:
  //   id          – unique number (determines ordering & prerequisite chain)
  //   available   – array of opcode strings the learner may use
  //   unlocks     – opcode string unlocked on completion (or null)
  //   tests       – array of { inputs, expected } — keys are 'r0'..'r3' or '@0'..'@63'

  var EXERCISE_DATA = [
    {
      id: 1,
      available: PRIMITIVES,
      unlocks: 'ADD',
      tests: [
        { inputs: { r2: 5,  r3: 3  }, expected: { r0: 8  } },
        { inputs: { r2: 0,  r3: 0  }, expected: { r0: 0  } },
        { inputs: { r2: 1,  r3: 0  }, expected: { r0: 1  } },
        { inputs: { r2: 0,  r3: 7  }, expected: { r0: 7  } },
        { inputs: { r2: 10, r3: 10 }, expected: { r0: 20 } },
      ],
    },
    {
      id: 2,
      available: PRIMITIVES.concat(['ADD']),
      unlocks: 'MUL',
      tests: [
        { inputs: { r2: 3, r3: 4 }, expected: { r0: 12 } },
        { inputs: { r2: 0, r3: 5 }, expected: { r0: 0  } },
        { inputs: { r2: 5, r3: 0 }, expected: { r0: 0  } },
        { inputs: { r2: 1, r3: 7 }, expected: { r0: 7  } },
        { inputs: { r2: 7, r3: 1 }, expected: { r0: 7  } },
        { inputs: { r2: 6, r3: 6 }, expected: { r0: 36 } },
      ],
    },
    {
      id: 3,
      available: PRIMITIVES.concat(['ADD', 'MUL']),
      unlocks: 'POW',
      tests: [
        { inputs: { r2: 2, r3: 3  }, expected: { r0: 8  } },
        { inputs: { r2: 3, r3: 2  }, expected: { r0: 9  } },
        { inputs: { r2: 5, r3: 0  }, expected: { r0: 1  } },
        { inputs: { r2: 2, r3: 0  }, expected: { r0: 1  } },
        { inputs: { r2: 1, r3: 10 }, expected: { r0: 1  } },
        { inputs: { r2: 3, r3: 3  }, expected: { r0: 27 } },
      ],
    },
  ];

  // ─── Merge data + language text into full exercise objects ─────────

  function buildExercises() {
    var exTexts = lang.exercises || {};
    var exercises = [];
    for (var i = 0; i < EXERCISE_DATA.length; i++) {
      var data = EXERCISE_DATA[i];
      var text = exTexts[data.id] || {};
      var ex = {};
      // Copy structural data
      for (var key in data) ex[key] = data[key];
      // Overlay translatable text
      ex.name        = text.name        || '';
      ex.title       = text.title       || '';
      ex.goal        = text.goal        || '';
      ex.description = text.description || '';
      ex.hints       = text.hints       || [];
      ex.starterCode = text.starterCode || '';
      exercises.push(ex);
    }
    return exercises;
  }

  var EXERCISES = buildExercises();

  // ─── Progress management (localStorage) ──────────────────────────────

  function loadProgress() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : { completed: [] };
    } catch (e) {
      return { completed: [] };
    }
  }

  function saveProgress(progress) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) { /* quota exceeded or private mode — ignore */ }
  }

  function isCompleted(exerciseId) {
    return loadProgress().completed.indexOf(exerciseId) !== -1;
  }

  function markCompleted(exerciseId) {
    var progress = loadProgress();
    if (progress.completed.indexOf(exerciseId) === -1) {
      progress.completed.push(exerciseId);
    }
    saveProgress(progress);
  }

  /** An exercise is available when every earlier exercise is completed. */
  function isAvailable(exercise) {
    for (var i = 0; i < EXERCISES.length; i++) {
      if (EXERCISES[i].id < exercise.id && !isCompleted(EXERCISES[i].id)) {
        return false;
      }
    }
    return true;
  }

  /** Return the list of opcode names unlocked by completed exercises. */
  function getUnlockedInstructions() {
    var unlocked = [];
    for (var i = 0; i < EXERCISES.length; i++) {
      if (isCompleted(EXERCISES[i].id) && EXERCISES[i].unlocks) {
        unlocked.push(EXERCISES[i].unlocks);
      }
    }
    return unlocked;
  }

  // ─── Opcode validation ───────────────────────────────────────────────

  function validateOpcodes(source, allowed) {
    var errors = [];
    var lines = source.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line || line.startsWith(';')) continue;
      var opcode = line.split(/\s+/)[0];
      if (allowed.indexOf(opcode) === -1) {
        errors.push({ line: i + 1, opcode: opcode });
      }
    }
    return errors;
  }

  // ─── Test runner ─────────────────────────────────────────────────────

  function runSingleTest(source, inputs) {
    var machine = window.MiniASM.createMachine();
    // Start with clean state
    var regs = {};
    for (var r = 0; r < CFG.registers.count; r++) regs[r] = 0;
    machine.registers = regs;
    machine.memory = new Array(CFG.memory.size).fill(0);

    try {
      window.MiniASM.loadProgram(machine, { source: source });
    } catch (e) {
      return { error: T('parseError') + e.message };
    }

    if (machine.code.length === 0) {
      return { error: T('noInstructions') };
    }

    // Apply test inputs (after load — loadProgram does not touch regs/memory)
    for (var key in inputs) {
      if (key.startsWith('r')) {
        machine.registers[parseInt(key.slice(1), 10)] = inputs[key];
      } else if (key.startsWith('@')) {
        machine.memory[parseInt(key.slice(1), 10)] = inputs[key];
      }
    }

    var halted = window.MiniASM.run(machine, 100000);
    if (!halted) {
      return { error: T('timeout') };
    }
    return { machine: machine };
  }

  /**
   * Return the effective set of allowed opcodes for an exercise:
   * its base `available` list + any instructions unlocked so far.
   */
  function effectiveAvailable(exercise) {
    var base = exercise.available.slice();
    var unlocked = getUnlockedInstructions();
    for (var i = 0; i < unlocked.length; i++) {
      if (base.indexOf(unlocked[i]) === -1) {
        base.push(unlocked[i]);
      }
    }
    return base;
  }

  /** Run all test cases for an exercise. Returns { results, allPassed, forbidden? }. */
  function runAllTests(exercise, source) {
    // Validate opcodes: base available + unlocked instructions
    var allowed = effectiveAvailable(exercise);
    var opcodeErrors = validateOpcodes(source, allowed);
    if (opcodeErrors.length > 0) {
      return { forbidden: opcodeErrors, results: [], allPassed: false };
    }

    var results = [];
    var allPassed = true;

    for (var i = 0; i < exercise.tests.length; i++) {
      var test = exercise.tests[i];
      var result = runSingleTest(source, test.inputs);

      if (result.error) {
        results.push({
          index: i, inputs: test.inputs, expected: test.expected,
          passed: false, error: result.error
        });
        allPassed = false;
        continue;
      }

      var m = result.machine;
      var passed = true;
      var actual = {};

      for (var key in test.expected) {
        var actualVal;
        if (key.startsWith('r')) {
          actualVal = m.registers[parseInt(key.slice(1), 10)];
        } else if (key.startsWith('@')) {
          actualVal = m.memory[parseInt(key.slice(1), 10)];
        }
        actual[key] = actualVal;
        if (actualVal !== test.expected[key]) passed = false;
      }

      results.push({
        index: i, inputs: test.inputs, expected: test.expected,
        actual: actual, passed: passed
      });
      if (!passed) allPassed = false;
    }

    return { results: results, allPassed: allPassed };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────

  function formatIO(d) {
    var parts = [];
    for (var key in d) {
      if (key.startsWith('@')) parts.push('mem[' + key.slice(1) + ']=' + d[key]);
      else parts.push(key + '=' + d[key]);
    }
    return parts.join(', ');
  }

  // ─── Public API ──────────────────────────────────────────────────────

  window.MiniASMExercises = {
    EXERCISES:    EXERCISES,
    PRIMITIVES:   PRIMITIVES,
    loadProgress: loadProgress,
    saveProgress: saveProgress,
    isCompleted:  isCompleted,
    markCompleted: markCompleted,
    isAvailable:  isAvailable,
    getUnlockedInstructions: getUnlockedInstructions,
    effectiveAvailable: effectiveAvailable,
    validateOpcodes: validateOpcodes,
    runAllTests:  runAllTests,
    formatIO:     formatIO,
  };
})();
