/**
 * MiniASM VM — User interface (editor, blocks, registers, memory, run/step/reset).
 * Depends on: interpreter.js (window.MiniASM), blocks-miniasm.js (window.MiniASMBlocks),
 * Blockly, and Monaco loader (require).
 */
(function() {
  const REG_NAMES = ['r0', 'r1', 'r2', 'r3'];
  const MEMORY_SIZE = 64;
  let editor;
  let blocklyWorkspace = null;
  let machine = null;
  let decorations = [];
  let currentMode = 'code'; // 'code' | 'blocks'
  let syncHighlightTimeout = null;

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
      alert('Parse error: ' + e.message);
      return false;
    }
  }

  function canEditState() {
    return !!machine;
  }

  function refreshRegisters() {
    const tbody = document.querySelector('#registers-table tbody');
    tbody.innerHTML = '';
    if (!machine) return;
    const editable = canEditState();
    for (let i = 0; i < REG_NAMES.length; i++) {
      const tr = document.createElement('tr');
      const tdVal = document.createElement('td');
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

  const MEMORY_COLS = 16;
  function refreshMemory() {
    const theadRow = document.getElementById('memory-thead-row');
    const tbody = document.querySelector('#memory-table tbody');
    tbody.innerHTML = '';
    theadRow.innerHTML = '';
    const th0 = document.createElement('th');
    th0.className = 'addr';
    theadRow.appendChild(th0);
    for (let c = 0; c < MEMORY_COLS; c++) {
      const th = document.createElement('th');
      th.className = 'addr';
      th.textContent = String(c);
      theadRow.appendChild(th);
    }
    if (!machine) return;
    const editable = canEditState();
    for (let row = 0; row < MEMORY_SIZE / MEMORY_COLS; row++) {
      const tr = document.createElement('tr');
      const tdLine = document.createElement('td');
      tdLine.className = 'addr';
      tdLine.textContent = String(row);
      tr.appendChild(tdLine);
      for (let c = 0; c < MEMORY_COLS; c++) {
        const i = row * MEMORY_COLS + c;
        const td = document.createElement('td');
        td.className = 'value';
        td.textContent = String(machine.memory[i] ?? 0);
        if (editable) {
          td.setAttribute('contenteditable', 'true');
          td.setAttribute('data-index', String(i));
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
    const reg = parseInt(td.getAttribute('data-reg'), 10);
    if (isNaN(reg) || reg < 0 || reg > 3) return;
    const v = parseInt(td.textContent.trim(), 10);
    if (!isNaN(v)) {
      machine.registers[reg] = v;
      td.textContent = String(v);
    } else {
      td.textContent = String(machine.registers[reg] ?? 0);
    }
  }

  function commitMemoryEdit(td) {
    const idx = parseInt(td.getAttribute('data-index'), 10);
    if (isNaN(idx) || idx < 0 || idx >= MEMORY_SIZE) return;
    const v = parseInt(td.textContent.trim(), 10);
    if (!isNaN(v)) {
      machine.memory[idx] = v;
      td.textContent = String(v);
    } else {
      td.textContent = String(machine.memory[idx] ?? 0);
    }
  }

  document.querySelector('.panel-state').addEventListener('focusout', function(e) {
    if (!machine) return;
    const t = e.target;
    if (t.nodeName !== 'TD' || !t.classList.contains('value')) return;
    if (t.hasAttribute('data-reg')) commitRegisterEdit(t);
    else if (t.hasAttribute('data-index')) commitMemoryEdit(t);
  });

  function updateStatus() {
    const el = document.getElementById('status');
    if (!machine) { el.textContent = 'Stopped'; el.className = 'status'; return; }
    if (machine.halted) {
      el.textContent = 'Halted';
      el.className = 'status halted';
    } else {
      el.textContent = 'PC = ' + machine.pc;
      el.className = 'status running';
    }
  }

  function highlightPCLine() {
    if (!editor || !machine) return;
    const validPC = machine.pc >= 0 && machine.pc < machine.code.length;
    const line = validPC && machine.lineNumbers && machine.lineNumbers[machine.pc] !== undefined
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
      loadProgram(machine, { source: getSource() });
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

  function setMode(mode) {
    currentMode = mode;
    document.querySelector('.code-wrap').classList.toggle('active', mode === 'code');
    document.querySelector('.blocks-wrap').classList.toggle('active', mode === 'blocks');
    document.getElementById('btn-mode-code').classList.toggle('active', mode === 'code');
    document.getElementById('btn-mode-blocks').classList.toggle('active', mode === 'blocks');
    if (mode === 'blocks') {
      if (!blocklyWorkspace) {
        blocklyWorkspace = window.MiniASMBlocks.createWorkspace(document.getElementById('blockly-workspace'));
        blocklyWorkspace.addChangeListener(function() {
          clearTimeout(syncHighlightTimeout);
          syncHighlightTimeout = setTimeout(syncProgramAndHighlightPC, 200);
        });
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

  document.getElementById('btn-run').addEventListener('click', run);
  document.getElementById('btn-step').addEventListener('click', step);
  document.getElementById('btn-reset').addEventListener('click', reset);
  document.getElementById('btn-mode-code').addEventListener('click', function() { setMode('code'); });
  document.getElementById('btn-mode-blocks').addEventListener('click', function() { setMode('blocks'); });

  require.config({
    paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' },
    'vs/nls': { availableLanguages: { '*': 'en' } }
  });
  require(['vs/editor/editor.main'], function() {
    editor = monaco.editor.create(document.getElementById('monaco-editor'), {
      value: '; add r0 + r1 -> r0\nSET r0 #5\nSET r1 #3\nISZ r1\nJMP l5\nSTP\nINC r0\nDEC r1\nJMP l2\n',
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
    editor.getModel().onDidChangeContent(function() {
      applyLineNumberOption();
      clearTimeout(syncHighlightTimeout);
      syncHighlightTimeout = setTimeout(syncProgramAndHighlightPC, 200);
    });
    const style = document.createElement('style');
    style.textContent = '.pc-line-highlight { background: rgba(249, 226, 175, 0.15); }';
    document.head.appendChild(style);
    machine = createMachine();
    loadProgram();
    refreshTables();
    updateStatus();
    highlightPCLine();
  });
})();
