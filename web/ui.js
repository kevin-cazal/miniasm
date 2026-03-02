/**
 * MiniASM VM — User interface with exercise system.
 * Depends on: lang.js, interpreter.js, exercises.js, blocks-miniasm.js, Blockly, Monaco.
 */
(function () {
  var T = window.MiniASMLang.T;
  var CFG = window.MiniASMConfig;

  var REG_NAMES   = CFG.REG_NAMES;
  var MEMORY_SIZE = CFG.memory.size;
  var MEMORY_COLS = CFG.memory.columns;

  // ─── State ──────────────────────────────────────────────────────────
  var editor = null;
  var blocklyWorkspace = null;
  var machine = null;
  var decorations = [];
  var currentMode = 'code';          // 'code' | 'blocks'
  var syncHighlightTimeout = null;

  var currentModeId = 'sandbox';     // 'sandbox' | exercise id (number)
  var currentExercise = null;        // null in sandbox, exercise object otherwise
  var hintIndices = {};              // exerciseId -> next hint index (session-scoped)

  // ─── Helpers ────────────────────────────────────────────────────────

  function getSource() {
    if (currentMode === 'code' && editor) return editor.getValue();
    if (currentMode === 'blocks' && blocklyWorkspace) return window.MiniASMBlocks.blocksToCode(blocklyWorkspace);
    return '';
  }

  function createMachine() {
    return window.MiniASM.createMachine();
  }

  function loadProgram() {
    if (!machine) machine = createMachine();
    try {
      window.MiniASM.loadProgram(machine, { source: getSource() });
      return true;
    } catch (e) {
      alert(T('parseError') + e.message);
      return false;
    }
  }

  function canEditState() {
    return !!machine;
  }

  // ─── Code persistence per mode ──────────────────────────────────────

  function codeKey(modeId) {
    return 'miniasm-code-' + modeId;
  }

  function saveCurrentCode() {
    try {
      localStorage.setItem(codeKey(currentModeId), getSource());
    } catch (e) { /* ignore */ }
  }

  function loadCodeForMode(modeId) {
    try {
      var saved = localStorage.getItem(codeKey(modeId));
      if (saved !== null) return saved;
    } catch (e) { /* ignore */ }
    // Return starter code for exercises, empty for sandbox
    if (modeId !== 'sandbox') {
      var ex = findExercise(modeId);
      return ex ? ex.starterCode : '';
    }
    return '';
  }

  function findExercise(id) {
    var exercises = window.MiniASMExercises.EXERCISES;
    for (var i = 0; i < exercises.length; i++) {
      if (exercises[i].id === id) return exercises[i];
    }
    return null;
  }

  // ─── Allowed opcodes for current mode ───────────────────────────────

  function getAllowedOpcodes() {
    if (currentExercise) {
      // Exercise: base available + any unlocked instructions
      return window.MiniASMExercises.effectiveAvailable(currentExercise);
    }
    // Sandbox: primitives + unlocked instructions
    var unlocked = window.MiniASMExercises.getUnlockedInstructions();
    return window.MiniASMExercises.PRIMITIVES.concat(unlocked);
  }

  // ─── Registers & memory tables ──────────────────────────────────────

  function refreshRegisters() {
    var tbody = document.querySelector('#registers-table tbody');
    tbody.innerHTML = '';
    if (!machine) return;
    var editable = canEditState();
    for (var i = 0; i < REG_NAMES.length; i++) {
      var tr = document.createElement('tr');
      var tdVal = document.createElement('td');
      tdVal.className = 'value';
      tdVal.textContent = String(machine.registers[i] ?? 0);
      if (editable) {
        tdVal.setAttribute('contenteditable', 'true');
        tdVal.setAttribute('data-reg', String(i));
        tdVal.setAttribute('spellcheck', 'false');
      }
      tr.innerHTML = '<td class="reg-name">' + REG_NAMES[i] + '</td>';
      tr.appendChild(tdVal);
      tbody.appendChild(tr);
    }
  }

  function refreshMemory() {
    var theadRow = document.getElementById('memory-thead-row');
    var tbody = document.querySelector('#memory-table tbody');
    tbody.innerHTML = '';
    theadRow.innerHTML = '';
    var th0 = document.createElement('th');
    th0.className = 'addr';
    theadRow.appendChild(th0);
    for (var c = 0; c < MEMORY_COLS; c++) {
      var th = document.createElement('th');
      th.className = 'addr';
      th.textContent = String(c);
      theadRow.appendChild(th);
    }
    if (!machine) return;
    var editable = canEditState();
    for (var row = 0; row < MEMORY_SIZE / MEMORY_COLS; row++) {
      var tr = document.createElement('tr');
      var tdLine = document.createElement('td');
      tdLine.className = 'addr';
      tdLine.textContent = String(row);
      tr.appendChild(tdLine);
      for (var col = 0; col < MEMORY_COLS; col++) {
        var idx = row * MEMORY_COLS + col;
        var td = document.createElement('td');
        td.className = 'value';
        td.textContent = String(machine.memory[idx] ?? 0);
        if (editable) {
          td.setAttribute('contenteditable', 'true');
          td.setAttribute('data-index', String(idx));
          td.setAttribute('spellcheck', 'false');
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }

  function refreshTables() {
    refreshRegisters();
    refreshMemory();
  }

  function commitRegisterEdit(td) {
    var reg = parseInt(td.getAttribute('data-reg'), 10);
    if (isNaN(reg) || reg < 0 || reg >= CFG.registers.count) return;
    var v = parseInt(td.textContent.trim(), 10);
    if (!isNaN(v)) {
      machine.registers[reg] = v;
      td.textContent = String(v);
    } else {
      td.textContent = String(machine.registers[reg] ?? 0);
    }
  }

  function commitMemoryEdit(td) {
    var idx = parseInt(td.getAttribute('data-index'), 10);
    if (isNaN(idx) || idx < 0 || idx >= MEMORY_SIZE) return;
    var v = parseInt(td.textContent.trim(), 10);
    if (!isNaN(v)) {
      machine.memory[idx] = v;
      td.textContent = String(v);
    } else {
      td.textContent = String(machine.memory[idx] ?? 0);
    }
  }

  document.querySelector('.panel-state').addEventListener('focusout', function (e) {
    if (!machine) return;
    var t = e.target;
    if (t.nodeName !== 'TD' || !t.classList.contains('value')) return;
    if (t.hasAttribute('data-reg')) commitRegisterEdit(t);
    else if (t.hasAttribute('data-index')) commitMemoryEdit(t);
  });

  // ─── Status & PC highlight ──────────────────────────────────────────

  function updateStatus() {
    var el = document.getElementById('status');
    if (!machine) { el.textContent = T('stopped'); el.className = 'status'; return; }
    if (machine.halted) {
      el.textContent = T('halted');
      el.className = 'status halted';
    } else {
      el.textContent = T('pcLabel') + machine.pc;
      el.className = 'status running';
    }
  }

  function highlightPCLine() {
    if (!editor || !machine) return;
    var validPC = machine.pc >= 0 && machine.pc < machine.code.length;
    var line = validPC && machine.lineNumbers && machine.lineNumbers[machine.pc] !== undefined
      ? machine.lineNumbers[machine.pc]
      : null;
    decorations = editor.deltaDecorations(decorations, line != null
      ? [{ range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 }, options: { isWholeLine: true, className: 'pc-line-highlight' } }]
      : []);
  }

  function clampPC() {
    if (!machine || !machine.code.length) return;
    machine.pc = Math.max(0, Math.min(machine.pc, machine.code.length - 1));
  }

  function syncProgramAndHighlightPC() {
    if (!machine) machine = createMachine();
    var source = getSource();
    try {
      window.MiniASM.loadProgram(machine, { source: source });
      clampPC();
      updateStatus();
      if (currentMode === 'blocks' && blocklyWorkspace && editor) {
        editor.setValue(source);
      }
      if (currentMode === 'code' && blocklyWorkspace && editor) {
        window.MiniASMBlocks.codeToBlocks(blocklyWorkspace, source);
      }
    } catch (e) {
      // Parse error while editing – keep current machine state
    }
    highlightPCLine();
    if (currentMode === 'blocks' && blocklyWorkspace) {
      window.MiniASMBlocks.updateBlockLineNumbers(blocklyWorkspace);
      window.MiniASMBlocks.setPCIndicator(blocklyWorkspace, machine ? machine.pc : -1);
    }
  }

  // ─── Run / Step / Reset ─────────────────────────────────────────────

  function run() {
    if (!loadProgram()) return;
    window.MiniASM.run(machine);
    refreshTables();
    updateStatus();
    highlightPCLine();
    if (currentMode === 'blocks' && blocklyWorkspace) {
      window.MiniASMBlocks.setPCIndicator(blocklyWorkspace, machine.pc);
    }
  }

  function step() {
    if (!machine) {
      if (!loadProgram()) return;
    }
    if (machine.halted || machine.pc >= machine.code.length) {
      loadProgram();
    }
    if (machine.pc < machine.code.length && !machine.halted) {
      window.MiniASM.execute(machine);
    }
    refreshTables();
    updateStatus();
    highlightPCLine();
    if (currentMode === 'blocks' && blocklyWorkspace) {
      window.MiniASMBlocks.setPCIndicator(blocklyWorkspace, machine.pc);
    }
  }

  function reset() {
    try {
      machine = createMachine();
      window.MiniASM.loadProgram(machine, { source: getSource() });
    } catch (e) {
      machine = null;
    }
    refreshTables();
    updateStatus();
    if (!machine) {
      decorations = editor ? editor.deltaDecorations(decorations, []) : [];
    }
    highlightPCLine();
    if (currentMode === 'blocks' && blocklyWorkspace) {
      window.MiniASMBlocks.setPCIndicator(blocklyWorkspace, machine ? machine.pc : -1);
    }
  }

  // ─── Code / Blocks mode toggle ──────────────────────────────────────

  function setEditorMode(mode) {
    currentMode = mode;
    document.querySelector('.code-wrap').classList.toggle('active', mode === 'code');
    document.querySelector('.blocks-wrap').classList.toggle('active', mode === 'blocks');
    document.getElementById('btn-mode-code').classList.toggle('active', mode === 'code');
    document.getElementById('btn-mode-blocks').classList.toggle('active', mode === 'blocks');
    if (mode === 'blocks') {
      var allowed = getAllowedOpcodes();
      if (!blocklyWorkspace) {
        blocklyWorkspace = window.MiniASMBlocks.createWorkspace(
          document.getElementById('blockly-workspace'),
          allowed
        );
        blocklyWorkspace.addChangeListener(function () {
          clearTimeout(syncHighlightTimeout);
          syncHighlightTimeout = setTimeout(syncProgramAndHighlightPC, 200);
        });
      } else {
        window.MiniASMBlocks.updateToolbox(blocklyWorkspace, allowed);
      }
      window.MiniASMBlocks.codeToBlocks(blocklyWorkspace, editor ? editor.getValue() : '');
      if (machine) {
        window.MiniASMBlocks.setPCIndicator(blocklyWorkspace, machine.pc);
      }
      window.MiniASMBlocks.centerBlocksInView(blocklyWorkspace);
      window.MiniASMBlocks.updateBlockLineNumbers(blocklyWorkspace);
    } else {
      if (blocklyWorkspace && editor) {
        editor.setValue(window.MiniASMBlocks.blocksToCode(blocklyWorkspace));
      }
      if (machine) {
        highlightPCLine();
      }
    }
  }

  // ─── Navigation bar setup ──────────────────────────────────────────

  function buildNavButtons() {
    var nav = document.getElementById('mode-nav');
    // Keep the sandbox button (first child), remove exercise buttons
    while (nav.children.length > 1) nav.removeChild(nav.lastChild);

    var exercises = window.MiniASMExercises.EXERCISES;
    for (var i = 0; i < exercises.length; i++) {
      var ex = exercises[i];
      var btn = document.createElement('button');
      btn.setAttribute('data-mode', String(ex.id));
      btn.textContent = ex.id + '. ' + ex.name;
      nav.appendChild(btn);
    }
    updateNavButtons();
  }

  function updateNavButtons() {
    var nav = document.getElementById('mode-nav');
    var buttons = nav.querySelectorAll('button');
    var exercises = window.MiniASMExercises.EXERCISES;

    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var modeId = btn.getAttribute('data-mode');

      // Remove all state classes
      btn.classList.remove('active', 'locked', 'completed');

      if (modeId === 'sandbox') {
        if (currentModeId === 'sandbox') btn.classList.add('active');
        continue;
      }

      var exId = parseInt(modeId, 10);
      var ex = findExercise(exId);
      if (!ex) continue;

      var completed = window.MiniASMExercises.isCompleted(exId);
      var available = window.MiniASMExercises.isAvailable(ex);

      if (completed) btn.classList.add('completed');
      if (!available && !completed) btn.classList.add('locked');
      if (currentModeId === exId) btn.classList.add('active');

      // Update label
      var prefix = completed ? '✅ ' : (!available ? '🔒 ' : '');
      btn.textContent = prefix + ex.id + '. ' + ex.name;
    }
  }

  function handleNavClick(e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    if (btn.classList.contains('locked')) return;

    var modeId = btn.getAttribute('data-mode');
    if (modeId === 'sandbox') {
      switchMode('sandbox');
    } else {
      var exId = parseInt(modeId, 10);
      switchMode(exId);
    }
  }

  // ─── Mode switching ─────────────────────────────────────────────────

  function switchMode(modeId) {
    if (modeId === currentModeId) return;

    // Save current code
    saveCurrentCode();

    // Update state
    currentModeId = modeId;
    currentExercise = (modeId === 'sandbox') ? null : findExercise(modeId);

    // Load code for new mode
    var code = loadCodeForMode(modeId);
    if (editor) editor.setValue(code);

    // Reset machine
    machine = createMachine();
    try {
      window.MiniASM.loadProgram(machine, { source: code });
    } catch (e) { /* parse error in saved code — ok */ }

    // Update blockly toolbox
    var allowed = getAllowedOpcodes();
    if (blocklyWorkspace) {
      window.MiniASMBlocks.updateToolbox(blocklyWorkspace, allowed);
      if (currentMode === 'blocks') {
        window.MiniASMBlocks.codeToBlocks(blocklyWorkspace, code);
        window.MiniASMBlocks.centerBlocksInView(blocklyWorkspace);
      }
    }

    // Show/hide exercise UI
    var testBtn = document.getElementById('btn-test');
    var panel = document.getElementById('exercise-panel');
    if (currentExercise) {
      testBtn.style.display = '';
      panel.classList.add('visible');
      updateExercisePanel();
    } else {
      testBtn.style.display = 'none';
      panel.classList.remove('visible');
    }

    // Update everything
    updateNavButtons();
    refreshTables();
    updateStatus();
    highlightPCLine();

    if (currentMode === 'blocks' && blocklyWorkspace) {
      window.MiniASMBlocks.setPCIndicator(blocklyWorkspace, machine ? machine.pc : -1);
    }
  }

  // ─── Exercise panel ─────────────────────────────────────────────────

  function updateExercisePanel() {
    if (!currentExercise) return;
    var ex = currentExercise;

    document.getElementById('ex-title').textContent =
      T('exercisePrefix', { id: ex.id, title: ex.title });
    document.getElementById('ex-goal').textContent = ex.goal;
    document.getElementById('ex-body').textContent = ex.description;

    // Available instructions (base + unlocked)
    var allowed = window.MiniASMExercises.effectiveAvailable(ex);
    var availEl = document.getElementById('ex-available');
    availEl.innerHTML = T('availableLabel');
    for (var i = 0; i < allowed.length; i++) {
      var code = document.createElement('code');
      code.textContent = allowed[i];
      availEl.appendChild(code);
    }

    // Hint count
    var seen = hintIndices[ex.id] || 0;
    var remaining = ex.hints.length - seen;
    document.getElementById('hint-count').textContent =
      remaining > 0 ? T('hintsRemaining', { n: remaining }) : T('hintsNone');

    // Clear previous test results and hints display
    document.getElementById('test-results').innerHTML = '';
    document.getElementById('ex-hints').innerHTML = '';

    // Re-show previously viewed hints
    for (var h = 0; h < seen; h++) {
      appendHintBox(ex.hints[h], h + 1, ex.hints.length);
    }

    // Show completed badge
    if (window.MiniASMExercises.isCompleted(ex.id)) {
      var results = document.getElementById('test-results');
      results.innerHTML = '<div class="test-summary success">' + T('alreadyCompleted') + '</div>';
    }
  }

  // ─── Hints ──────────────────────────────────────────────────────────

  function appendHintBox(text, num, total) {
    var hintsEl = document.getElementById('ex-hints');
    var box = document.createElement('div');
    box.className = 'hint-box';
    box.textContent = T('hintBox', { num: num, total: total, text: text });
    hintsEl.appendChild(box);
  }

  function showNextHint() {
    if (!currentExercise) return;
    var ex = currentExercise;
    var idx = hintIndices[ex.id] || 0;
    if (idx >= ex.hints.length) return;

    appendHintBox(ex.hints[idx], idx + 1, ex.hints.length);
    hintIndices[ex.id] = idx + 1;

    // Update count
    var remaining = ex.hints.length - (idx + 1);
    document.getElementById('hint-count').textContent =
      remaining > 0 ? T('hintsRemaining', { n: remaining }) : T('hintsNone');
  }

  // ─── Test runner UI ─────────────────────────────────────────────────

  function runTests() {
    if (!currentExercise) return;
    var ex = currentExercise;
    var source = getSource();
    var fmtIO = window.MiniASMExercises.formatIO;

    var result = window.MiniASMExercises.runAllTests(ex, source);
    var resultsEl = document.getElementById('test-results');
    resultsEl.innerHTML = '';

    // Forbidden opcodes?
    if (result.forbidden && result.forbidden.length > 0) {
      var summary = document.createElement('div');
      summary.className = 'test-summary forbidden';
      var forbiddenTitle = result.forbidden.length > 1
        ? T('forbiddenPlural') : T('forbiddenSingular');
      summary.innerHTML = forbiddenTitle + ':<br>';
      for (var f = 0; f < result.forbidden.length; f++) {
        var err = result.forbidden[f];
        summary.innerHTML += '  ' + T('lineLabel') + err.line + ': <b>' + err.opcode + '</b><br>';
      }
      summary.innerHTML += '<br>' + T('allowedLabel') + ex.available.join(', ');
      resultsEl.appendChild(summary);
      return;
    }

    // Test lines
    for (var i = 0; i < result.results.length; i++) {
      var r = result.results[i];
      var div = document.createElement('div');
      div.className = 'test-line';

      if (r.error) {
        div.classList.add('error');
        div.textContent = T('testErrorLine', {
          n: r.index + 1, io: fmtIO(r.inputs), err: r.error
        });
      } else if (r.passed) {
        div.classList.add('pass');
        div.textContent = T('testPassLine', {
          n: r.index + 1, io: fmtIO(r.inputs), actual: fmtIO(r.actual)
        });
      } else {
        div.classList.add('fail');
        div.textContent = T('testFailLine', {
          n: r.index + 1, io: fmtIO(r.inputs),
          expected: fmtIO(r.expected), actual: fmtIO(r.actual)
        });
      }
      resultsEl.appendChild(div);
    }

    // Summary
    var summary = document.createElement('div');
    summary.className = 'test-summary';

    if (result.allPassed) {
      var wasAlreadyDone = window.MiniASMExercises.isCompleted(ex.id);
      if (!wasAlreadyDone) {
        window.MiniASMExercises.markCompleted(ex.id);
        summary.classList.add('success');
        summary.innerHTML = T('allPassed');
        if (ex.unlocks) {
          var unlock = document.createElement('div');
          unlock.className = 'unlock-msg';
          unlock.textContent = T('unlockMsg', { instr: ex.unlocks + ' rX rY' });
          summary.appendChild(unlock);
        }
        updateNavButtons();
      } else {
        summary.classList.add('success');
        summary.innerHTML = T('stillPass');
      }
    } else {
      summary.classList.add('failure');
      summary.innerHTML = T('someFailed');
    }
    resultsEl.appendChild(summary);
  }

  // ─── Wire up event handlers ─────────────────────────────────────────

  document.getElementById('btn-run').addEventListener('click', run);
  document.getElementById('btn-step').addEventListener('click', step);
  document.getElementById('btn-reset').addEventListener('click', reset);
  document.getElementById('btn-test').addEventListener('click', runTests);
  document.getElementById('btn-panel-test').addEventListener('click', runTests);
  document.getElementById('btn-hint').addEventListener('click', showNextHint);
  document.getElementById('btn-mode-code').addEventListener('click', function () { setEditorMode('code'); });
  document.getElementById('btn-mode-blocks').addEventListener('click', function () { setEditorMode('blocks'); });
  document.getElementById('mode-nav').addEventListener('click', handleNavClick);

  // ─── Monaco editor initialization ───────────────────────────────────

  require.config({
    paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' },
    'vs/nls': { availableLanguages: { '*': 'en' } }
  });

  require(['vs/editor/editor.main'], function () {
    editor = monaco.editor.create(document.getElementById('monaco-editor'), {
      value: loadCodeForMode('sandbox'),
      language: 'plaintext',
      theme: 'vs-dark',
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbers: 'on'
    });

    function lineNumbersForLine(lineNumber) {
      var model = editor.getModel();
      if (!model) return String(lineNumber);
      var line = model.getLineContent(lineNumber);
      if (line.trim().startsWith(';')) return '';
      return String(lineNumber);
    }

    function applyLineNumberOption() {
      editor.updateOptions({ lineNumbers: lineNumbersForLine });
    }

    applyLineNumberOption();
    editor.getModel().onDidChangeContent(function () {
      applyLineNumberOption();
      clearTimeout(syncHighlightTimeout);
      syncHighlightTimeout = setTimeout(syncProgramAndHighlightPC, 200);
    });

    var style = document.createElement('style');
    style.textContent = '.pc-line-highlight { background: rgba(249, 226, 175, 0.15); }';
    document.head.appendChild(style);

    // Build nav & initialize
    buildNavButtons();
    machine = createMachine();
    loadProgram();
    refreshTables();
    updateStatus();
    highlightPCLine();
  });
})();
