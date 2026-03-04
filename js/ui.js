/**
 * WDR+E — User interface with challenge system.
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
  var monacoCodeBeforeBlocks = '';   // Monaco content (with comments) when last switching to blocks; restored when switching back
  var syncHighlightTimeout = null;

  var currentModeId = 'sandbox';     // 'sandbox' | exercise id (number)
  var currentExercise = null;        // null in sandbox, exercise object otherwise
  var hintIndices = {};              // exerciseId -> next hint index (session-scoped)
  var autoRunInterval = null;        // setInterval id for auto-stepping
  var isAutoRunning = false;         // whether auto-run is active
  var resetOnChange = true;          // reset program when user edits registers/memory

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
    else return;

    // If resetOnChange is enabled, reset program (PC → 0, halted → false)
    if (resetOnChange) {
      try {
        window.MiniASM.loadProgram(machine, { source: getSource() });
      } catch (err) { /* parse error — leave machine as-is */ }
      updateStatus();
      highlightPCLine();
      if (currentMode === 'blocks' && blocklyWorkspace) {
        window.MiniASMBlocks.setPCIndicator(blocklyWorkspace, machine ? machine.pc : -1);
      }
    }
  });

  // ─── Status & PC highlight ──────────────────────────────────────────

  function updateStatus() {
    var el = document.getElementById('status');
    if (!machine) { el.textContent = T('stopped'); el.className = 'status'; return; }
    if (machine.halted) {
      el.textContent = T('halted');
      el.className = 'status halted';
    } else {
      el.textContent = T('pcLabel') + (machine.pc + 1);
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

  function getAutoRunInterval() {
    var slider = document.getElementById('speed-slider');
    return slider ? parseInt(slider.value, 10) : 500;
  }

  function stopAutoRun() {
    if (autoRunInterval !== null) {
      clearInterval(autoRunInterval);
      autoRunInterval = null;
    }
    isAutoRunning = false;
    var btn = document.getElementById('btn-run');
    btn.textContent = 'Run';
    btn.classList.remove('stop');
    btn.classList.add('primary');
  }

  function run() {
    // If already auto-running, stop
    if (isAutoRunning) {
      stopAutoRun();
      return;
    }

    // If machine is halted or finished, ask user if they want to restart
    if (machine && (machine.halted || machine.pc >= machine.code.length)) {
      if (!confirm('Program has finished. Restart from the beginning?')) return;
      reset();
    }

    // Load program fresh
    if (!loadProgram()) return;

    // Instant execution when delay is 0
    if (getAutoRunInterval() === 0) {
      window.MiniASM.run(machine);
      refreshTables();
      updateStatus();
      highlightPCLine();
      if (currentMode === 'blocks' && blocklyWorkspace) {
        window.MiniASMBlocks.setPCIndicator(blocklyWorkspace, machine.pc);
      }
      return;
    }

    // Switch button to "Stop"
    isAutoRunning = true;
    var btn = document.getElementById('btn-run');
    btn.textContent = 'Stop';
    btn.classList.remove('primary');
    btn.classList.add('stop');

    // Perform initial step immediately, then set interval
    function autoStep() {
      if (!machine || machine.halted || machine.pc >= machine.code.length) {
        stopAutoRun();
        refreshTables();
        updateStatus();
        highlightPCLine();
        if (currentMode === 'blocks' && blocklyWorkspace) {
          window.MiniASMBlocks.setPCIndicator(blocklyWorkspace, machine ? machine.pc : -1);
        }
        return;
      }
      window.MiniASM.execute(machine);
      refreshTables();
      updateStatus();
      highlightPCLine();
      if (currentMode === 'blocks' && blocklyWorkspace) {
        window.MiniASMBlocks.setPCIndicator(blocklyWorkspace, machine.pc);
      }
    }

    // First step right away
    autoStep();
    if (!isAutoRunning) return; // halted on first step

    // Use setTimeout recursion so interval changes take effect immediately
    function scheduleNext() {
      if (!isAutoRunning) return;
      autoRunInterval = setTimeout(function () {
        autoStep();
        if (isAutoRunning) scheduleNext();
      }, getAutoRunInterval());
    }
    scheduleNext();
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
    stopAutoRun();
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
      if (editor) monacoCodeBeforeBlocks = editor.getValue();
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
        editor.setValue(monacoCodeBeforeBlocks);
      }
      if (machine) {
        highlightPCLine();
      }
    }
  }

  // ─── Navigation bar setup (Sandbox + Category dropdown) ─────────────

  function buildNavButtons() {
    var menu = document.getElementById('nav-dropdown-menu');
    menu.innerHTML = '';

    var categories = window.MiniASMExercises.CATEGORIES;
    var exercises  = window.MiniASMExercises.EXERCISES;

    for (var c = 0; c < categories.length; c++) {
      var cat = categories[c];

      // Category header
      var header = document.createElement('div');
      header.className = 'nav-cat-header';
      header.textContent = cat.name;
      menu.appendChild(header);

      // Collect tutorials and challenges for this category
      var tutorials  = [];
      var challenges = [];
      for (var i = 0; i < exercises.length; i++) {
        if (exercises[i].category === cat.id) {
          if (exercises[i].type === 'tutorial') tutorials.push(exercises[i]);
          else challenges.push(exercises[i]);
        }
      }

      // Tutorial sub-label + items
      if (tutorials.length > 0) {
        var tutLabel = document.createElement('div');
        tutLabel.className = 'nav-cat-sublabel';
        tutLabel.textContent = 'Tutorials';
        menu.appendChild(tutLabel);

        for (var t = 0; t < tutorials.length; t++) {
          menu.appendChild(createNavItem(tutorials[t]));
        }
      }

      // Separator + challenge sub-label + items
      if (challenges.length > 0) {
        if (tutorials.length > 0) {
          var sep = document.createElement('div');
          sep.className = 'nav-cat-separator';
          menu.appendChild(sep);
        }
        var chLabel = document.createElement('div');
        chLabel.className = 'nav-cat-sublabel';
        chLabel.textContent = 'Challenges';
        menu.appendChild(chLabel);

        for (var ch = 0; ch < challenges.length; ch++) {
          menu.appendChild(createNavItem(challenges[ch]));
        }
      }

      // Separator between categories
      if (c < categories.length - 1) {
        var catSep = document.createElement('div');
        catSep.className = 'nav-cat-separator';
        catSep.style.margin = '8px 12px';
        menu.appendChild(catSep);
      }
    }

    updateNavButtons();
  }

  function createNavItem(ex) {
    var btn = document.createElement('button');
    btn.className = 'nav-item';
    btn.setAttribute('data-mode', String(ex.id));

    var icon = document.createElement('span');
    icon.className = 'nav-item-icon';
    btn.appendChild(icon);

    var text = document.createElement('span');
    text.textContent = ex.type === 'tutorial' ? ex.title : ex.name;
    btn.appendChild(text);

    return btn;
  }

  function updateNavButtons() {
    // Sandbox button
    var sandboxBtn = document.querySelector('#mode-nav > button[data-mode="sandbox"]');
    sandboxBtn.classList.toggle('active', currentModeId === 'sandbox');

    // Dropdown toggle
    var toggle = document.getElementById('nav-dropdown-toggle');
    var label  = document.getElementById('nav-dropdown-label');
    if (currentModeId !== 'sandbox' && currentExercise) {
      var displayName = currentExercise.type === 'tutorial'
        ? currentExercise.title
        : currentExercise.name;
      label.textContent = displayName + ' ▾';
      toggle.classList.add('has-selection');
    } else {
      label.textContent = 'Challenges ▾';
      toggle.classList.remove('has-selection');
    }

    // Menu items
    var items = document.querySelectorAll('#nav-dropdown-menu .nav-item');
    for (var i = 0; i < items.length; i++) {
      var btn    = items[i];
      var exId   = parseInt(btn.getAttribute('data-mode'), 10);
      var ex     = findExercise(exId);
      if (!ex) continue;

      var completed = window.MiniASMExercises.isCompleted(exId);
      var available = window.MiniASMExercises.isAvailable(ex);

      btn.classList.remove('active', 'locked', 'completed');
      if (completed) btn.classList.add('completed');
      if (!available && !completed) btn.classList.add('locked');
      if (currentModeId === exId) btn.classList.add('active');

      // Update icon
      var icon = btn.querySelector('.nav-item-icon');
      if (icon) {
        icon.textContent = completed ? '✅' : (!available ? '🔒' : '○');
      }
    }
  }

  /** Open / close dropdown, handle item clicks */
  function setupDropdown() {
    var dropdown = document.getElementById('nav-dropdown');
    var toggle   = document.getElementById('nav-dropdown-toggle');
    var menu     = document.getElementById('nav-dropdown-menu');

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    menu.addEventListener('click', function (e) {
      var btn = e.target.closest('.nav-item');
      if (!btn) return;
      if (btn.classList.contains('locked')) return;

      var exId = parseInt(btn.getAttribute('data-mode'), 10);
      dropdown.classList.remove('open');
      switchMode(exId);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });
  }

  function handleNavClick(e) {
    var btn = e.target.closest('button[data-mode="sandbox"]');
    if (!btn) return;
    var dropdown = document.getElementById('nav-dropdown');
    dropdown.classList.remove('open');
    switchMode('sandbox');
  }

  // ─── Mode switching ─────────────────────────────────────────────────

  function switchMode(modeId) {
    if (modeId === currentModeId) return;

    // Stop any running auto-step
    stopAutoRun();

    // Save current code
    saveCurrentCode();

    // Update state
    currentModeId = modeId;
    currentExercise = (modeId === 'sandbox') ? null : findExercise(modeId);

    // Load code for new mode
    var code = loadCodeForMode(modeId);
    if (editor) editor.setValue(code);
    monacoCodeBeforeBlocks = code;

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
    var panel = document.getElementById('exercise-panel');
    if (currentExercise) {
      panel.classList.add('visible');
      updateExercisePanel();
    } else {
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

    var titleKey = ex.type === 'tutorial' ? 'tutorialPrefix' : 'challengePrefix';
    document.getElementById('ex-title').textContent =
      T(titleKey, { id: ex.id, title: ex.title });
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

  // Speed slider: update displayed value
  document.getElementById('speed-slider').addEventListener('input', function () {
    var v = parseInt(this.value, 10);
    document.getElementById('speed-value').textContent = v === 0 ? 'Instant' : v + 'ms';
  });

  document.getElementById('btn-panel-test').addEventListener('click', runTests);
  document.getElementById('btn-hint').addEventListener('click', showNextHint);
  document.getElementById('btn-mode-code').addEventListener('click', function () { setEditorMode('code'); });
  document.getElementById('btn-mode-blocks').addEventListener('click', function () { setEditorMode('blocks'); });
  document.getElementById('mode-nav').addEventListener('click', handleNavClick);

  // Reset-on-change toggle: restore from localStorage and wire up
  (function () {
    var chk = document.getElementById('chk-reset-on-change');
    try {
      var saved = localStorage.getItem('miniasm-resetOnChange');
      if (saved !== null) {
        resetOnChange = saved === 'true';
        chk.checked = resetOnChange;
      }
    } catch (e) { /* ignore */ }
    chk.addEventListener('change', function () {
      resetOnChange = this.checked;
      try { localStorage.setItem('miniasm-resetOnChange', String(resetOnChange)); } catch (e) { /* ignore */ }
    });
  })();

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
      if (line.trim() === '' || line.trim().startsWith(';')) return '';
      var codeLineIndex = 0;
      for (var i = 1; i <= lineNumber; i++) {
        var l = model.getLineContent(i);
        if (l.trim() !== '' && !l.trim().startsWith(';')) codeLineIndex++;
      }
      return String(codeLineIndex);
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
    setupDropdown();
    buildNavButtons();
    machine = createMachine();
    loadProgram();
    refreshTables();
    updateStatus();
    highlightPCLine();
  });
})();
