/**
 * MiniASM Blockly blocks and code generator (Scratch-like block mode).
 * Supports dynamic toolbox — only shows blocks for allowed opcodes.
 * Depends on: lang.js
 */
(function(global) {
  var Blockly = global.Blockly;
  if (!Blockly) return;

  var T = global.MiniASMLang.T;

  var regOptions = [['0', '0'], ['1', '1'], ['2', '2'], ['3', '3']];

  // ----- Block definitions -----
  Blockly.Blocks['miniasm_start'] = {
    init: function() {
      this.appendDummyInput().appendField(T('blockStart'));
      this.setNextStatement(true, null);
      this.setPreviousStatement(false);
      this.setDeletable(false);
      this.setColour(120);
      this.setTooltip(T('tooltipStart'));
    }
  };

  var lineNumField = function() {
    return new (Blockly.FieldLabelSerializable || Blockly.FieldLabel)('0', 'line_num');
  };

  Blockly.Blocks['miniasm_set'] = {
    init: function() {
      this.appendDummyInput()
          .appendField(lineNumField(), 'LINE_NUM')
          .appendField('SET')
          .appendField(new Blockly.FieldDropdown([['reg', 'reg'], ['mem', 'mem']]), 'DEST_TYPE')
          .appendField(new Blockly.FieldTextInput('0'), 'DEST_VAL');
      this.appendDummyInput()
          .appendField(T('blockTo'))
          .appendField(new Blockly.FieldDropdown([['reg', 'reg'], ['mem', 'mem'], ['#', '#']]), 'SRC_TYPE')
          .appendField(new Blockly.FieldTextInput('0'), 'SRC_VAL');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(230);
      this.setTooltip(T('tooltipSet'));
    }
  };

  Blockly.Blocks['miniasm_inc'] = {
    init: function() {
      this.appendDummyInput()
          .appendField(lineNumField(), 'LINE_NUM')
          .appendField('INC')
          .appendField(new Blockly.FieldDropdown(regOptions), 'REG');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip(T('tooltipInc'));
    }
  };

  Blockly.Blocks['miniasm_dec'] = {
    init: function() {
      this.appendDummyInput()
          .appendField(lineNumField(), 'LINE_NUM')
          .appendField('DEC')
          .appendField(new Blockly.FieldDropdown(regOptions), 'REG');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip(T('tooltipDec'));
    }
  };

  Blockly.Blocks['miniasm_isz'] = {
    init: function() {
      this.appendDummyInput()
          .appendField(lineNumField(), 'LINE_NUM')
          .appendField('ISZ')
          .appendField(new Blockly.FieldDropdown(regOptions), 'REG');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(290);
      this.setTooltip(T('tooltipIsz'));
    }
  };

  Blockly.Blocks['miniasm_isn'] = {
    init: function() {
      this.appendDummyInput()
          .appendField(lineNumField(), 'LINE_NUM')
          .appendField('ISN')
          .appendField(new Blockly.FieldDropdown(regOptions), 'REG');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(290);
      this.setTooltip(T('tooltipIsn'));
    }
  };

  Blockly.Blocks['miniasm_jmp'] = {
    init: function() {
      this.appendDummyInput()
          .appendField(lineNumField(), 'LINE_NUM')
          .appendField('JMP')
          .appendField(new Blockly.FieldNumber(0, 0, 999), 'LINE');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(290);
      this.setTooltip(T('tooltipJmp'));
    }
  };

  Blockly.Blocks['miniasm_stp'] = {
    init: function() {
      this.appendDummyInput()
          .appendField(lineNumField(), 'LINE_NUM')
          .appendField('STP');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(30);
      this.setTooltip(T('tooltipStp'));
    }
  };

  // ----- Unlockable instruction blocks -----
  Blockly.Blocks['miniasm_add'] = {
    init: function() {
      this.appendDummyInput()
          .appendField(lineNumField(), 'LINE_NUM')
          .appendField('ADD  r')
          .appendField(new Blockly.FieldDropdown(regOptions), 'X')
          .appendField(' r')
          .appendField(new Blockly.FieldDropdown(regOptions), 'Y');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(65);
      this.setTooltip(T('tooltipAdd'));
    }
  };

  Blockly.Blocks['miniasm_mul'] = {
    init: function() {
      this.appendDummyInput()
          .appendField(lineNumField(), 'LINE_NUM')
          .appendField('MUL  r')
          .appendField(new Blockly.FieldDropdown(regOptions), 'X')
          .appendField(' r')
          .appendField(new Blockly.FieldDropdown(regOptions), 'Y');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(65);
      this.setTooltip(T('tooltipMul'));
    }
  };

  Blockly.Blocks['miniasm_pow'] = {
    init: function() {
      this.appendDummyInput()
          .appendField(lineNumField(), 'LINE_NUM')
          .appendField('POW  r')
          .appendField(new Blockly.FieldDropdown(regOptions), 'X')
          .appendField(' r')
          .appendField(new Blockly.FieldDropdown(regOptions), 'Y');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(65);
      this.setTooltip(T('tooltipPow'));
    }
  };

  // ----- Generator: block -> MiniASM line -----
  var generator = {};
  generator['miniasm_set'] = function(block) {
    var dt = block.getFieldValue('DEST_TYPE');
    var dval = String(block.getFieldValue('DEST_VAL') || '').trim().replace(/^r|^@/, '');
    var dest = dt === 'reg' ? ('r' + dval) : ('@' + dval);
    var st = block.getFieldValue('SRC_TYPE');
    var sval = String(block.getFieldValue('SRC_VAL') || '').trim().replace(/^r|^@|^#/, '');
    var src = st === 'reg' ? ('r' + sval) : (st === 'mem' ? ('@' + sval) : ('#' + sval));
    return 'SET ' + dest + ' ' + src;
  };
  generator['miniasm_inc'] = function(block) {
    return 'INC r' + (block.getFieldValue('REG') || '0');
  };
  generator['miniasm_dec'] = function(block) {
    return 'DEC r' + (block.getFieldValue('REG') || '0');
  };
  generator['miniasm_isz'] = function(block) {
    return 'ISZ r' + (block.getFieldValue('REG') || '0');
  };
  generator['miniasm_isn'] = function(block) {
    return 'ISN r' + (block.getFieldValue('REG') || '0');
  };
  generator['miniasm_jmp'] = function(block) {
    return 'JMP l' + (block.getFieldValue('LINE') || 0);
  };
  generator['miniasm_stp'] = function() {
    return 'STP';
  };
  generator['miniasm_add'] = function(block) {
    return 'ADD r' + (block.getFieldValue('X') || '0') + ' r' + (block.getFieldValue('Y') || '0');
  };
  generator['miniasm_mul'] = function(block) {
    return 'MUL r' + (block.getFieldValue('X') || '0') + ' r' + (block.getFieldValue('Y') || '0');
  };
  generator['miniasm_pow'] = function(block) {
    return 'POW r' + (block.getFieldValue('X') || '0') + ' r' + (block.getFieldValue('Y') || '0');
  };

  // ----- blocksToCode -----
  function blocksToCode(workspace) {
    var lines = [];
    var topBlocks = workspace.getTopBlocks(true);
    var startBlock = null;
    for (var i = 0; i < topBlocks.length; i++) {
      if (topBlocks[i].type === 'miniasm_start') {
        startBlock = topBlocks[i];
        break;
      }
    }
    var block;
    if (startBlock && startBlock.getNextBlock) {
      block = startBlock.getNextBlock();
    } else {
      block = null;
    }
    if (block) {
      while (block) {
        var fn = generator[block.type];
        if (fn) lines.push(fn(block));
        block = block.getNextBlock ? block.getNextBlock() : null;
      }
    } else {
      for (var j = 0; j < topBlocks.length; j++) {
        block = topBlocks[j];
        var fn = generator[block.type];
        if (fn) lines.push(fn(block));
      }
    }
    return lines.join('\n');
  }

  // ----- codeToBlocks -----
  function codeToBlocks(workspace, code) {
    workspace.clear();
    var lines = (code || '').split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
    var blockInfos = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (line.startsWith(';')) continue;
      var blockInfo = parseLineToBlock(line);
      if (blockInfo) blockInfos.push(blockInfo);
    }
    var blockXml = document.createElement('xml');
    var startEl = document.createElement('block');
    startEl.setAttribute('type', 'miniasm_start');
    startEl.setAttribute('x', 20);
    startEl.setAttribute('y', 20);
    startEl.setAttribute('deletable', 'false');
    if (blockInfos.length > 0) {
      var nextEl = buildNextChain(blockInfos, 0);
      if (nextEl) startEl.appendChild(nextEl);
    }
    blockXml.appendChild(startEl);
    try {
      Blockly.Xml.domToWorkspace(blockXml, workspace);
      updateBlockLineNumbers(workspace);
    } catch (e) {
      console.warn('codeToBlocks:', e);
    }
  }

  function buildNextChain(blockInfos, index) {
    if (index >= blockInfos.length) return null;
    var nextEl = document.createElement('next');
    var blockEl = blockInfoToXml(blockInfos[index], 20, 20 + (index + 1) * 50);
    var nested = buildNextChain(blockInfos, index + 1);
    if (nested) blockEl.appendChild(nested);
    nextEl.appendChild(blockEl);
    return nextEl;
  }

  function parseLineToBlock(line) {
    var tokens = line.split(/\s+/).map(function(t) { return t.trim(); }).filter(Boolean);
    if (tokens.length === 0) return null;
    var op = tokens[0];
    if (op === 'SET' && tokens.length >= 3) {
      var dest = tokens[1];
      var src = tokens[2];
      var destIsReg = dest.charAt(0) === 'r';
      var srcIsReg = src.charAt(0) === 'r';
      var srcIsMem = src.charAt(0) === '@';
      var srcIsImm = src.charAt(0) === '#';
      return {
        type: 'miniasm_set',
        DEST_TYPE: destIsReg ? 'reg' : 'mem',
        DEST_VAL: destIsReg ? dest.replace(/^r/, '') : dest.replace(/^@/, ''),
        SRC_TYPE: srcIsImm ? '#' : (srcIsMem ? 'mem' : 'reg'),
        SRC_VAL: srcIsImm ? src.replace(/^#/, '') : (srcIsMem ? src.replace(/^@/, '') : src.replace(/^r/, ''))
      };
    }
    if (op === 'INC' && tokens.length >= 2) return { type: 'miniasm_inc', REG: tokens[1].replace(/^r/, '') };
    if (op === 'DEC' && tokens.length >= 2) return { type: 'miniasm_dec', REG: tokens[1].replace(/^r/, '') };
    if (op === 'ISZ' && tokens.length >= 2) return { type: 'miniasm_isz', REG: tokens[1].replace(/^r/, '') };
    if (op === 'ISN' && tokens.length >= 2) return { type: 'miniasm_isn', REG: tokens[1].replace(/^r/, '') };
    if (op === 'JMP' && tokens.length >= 2) {
      var lineNum = tokens[1].charAt(0) === 'l' ? parseInt(tokens[1].slice(1), 10) : parseInt(tokens[1], 10);
      return { type: 'miniasm_jmp', LINE: isNaN(lineNum) ? 0 : lineNum };
    }
    if (op === 'STP') return { type: 'miniasm_stp' };
    // Unlockable instructions
    if (op === 'ADD' && tokens.length >= 3) return { type: 'miniasm_add', X: tokens[1].replace(/^r/, ''), Y: tokens[2].replace(/^r/, '') };
    if (op === 'MUL' && tokens.length >= 3) return { type: 'miniasm_mul', X: tokens[1].replace(/^r/, ''), Y: tokens[2].replace(/^r/, '') };
    if (op === 'POW' && tokens.length >= 3) return { type: 'miniasm_pow', X: tokens[1].replace(/^r/, ''), Y: tokens[2].replace(/^r/, '') };
    return null;
  }

  function blockInfoToXml(info, x, y) {
    var block = document.createElement('block');
    block.setAttribute('type', info.type);
    block.setAttribute('x', x);
    block.setAttribute('y', y);
    for (var key in info) {
      if (key === 'type') continue;
      var field = document.createElement('field');
      field.setAttribute('name', key);
      field.textContent = String(info[key]);
      block.appendChild(field);
    }
    return block;
  }

  // ----- Dynamic toolbox -----
  // Maps opcodes to their Blockly block type
  var OPCODE_TO_BLOCK = {
    SET: 'miniasm_set',
    INC: 'miniasm_inc',
    DEC: 'miniasm_dec',
    ISZ: 'miniasm_isz',
    ISN: 'miniasm_isn',
    JMP: 'miniasm_jmp',
    STP: 'miniasm_stp',
    ADD: 'miniasm_add',
    MUL: 'miniasm_mul',
    POW: 'miniasm_pow',
  };

  // Category structure (opcodes grouped by category, with lang keys)
  var CATEGORIES = [
    { nameKey: 'catData',       opcodes: ['SET'] },
    { nameKey: 'catArithmetic', opcodes: ['INC', 'DEC', 'ADD', 'MUL', 'POW'] },
    { nameKey: 'catControl',    opcodes: ['ISZ', 'ISN', 'JMP', 'STP'] },
  ];

  /**
   * Build a Blockly toolbox XML string showing only allowed opcodes.
   * If allowedOpcodes is null/undefined, all opcodes are shown.
   */
  function buildToolboxXml(allowedOpcodes) {
    var xml = '<xml xmlns="https://developers.google.com/blockly/xml">';
    for (var c = 0; c < CATEGORIES.length; c++) {
      var cat = CATEGORIES[c];
      var blocks = [];
      for (var o = 0; o < cat.opcodes.length; o++) {
        var op = cat.opcodes[o];
        if (!allowedOpcodes || allowedOpcodes.indexOf(op) !== -1) {
          blocks.push(OPCODE_TO_BLOCK[op]);
        }
      }
      if (blocks.length > 0) {
        xml += '<category name="' + T(cat.nameKey) + '">';
        for (var b = 0; b < blocks.length; b++) {
          xml += '<block type="' + blocks[b] + '"></block>';
        }
        xml += '</category>';
      }
    }
    xml += '</xml>';
    return xml;
  }

  /**
   * Update a workspace's toolbox to show only the given opcodes.
   */
  function updateToolbox(workspace, allowedOpcodes) {
    if (!workspace) return;
    var xml = buildToolboxXml(allowedOpcodes);
    workspace.updateToolbox(xml);
  }

  // ----- Workspace creation -----
  function createWorkspace(container, allowedOpcodes) {
    var toolbox = buildToolboxXml(allowedOpcodes);
    return Blockly.inject(container, {
      toolbox: toolbox,
      grid: { spacing: 20, length: 3, colour: '#313244', snap: true },
      zoom: { controls: true, wheel: true, startScale: 1, maxScale: 2, minScale: 0.5 }
    });
  }

  // ----- PC indicator & line numbers -----
  function getBlockAtLineIndex(workspace, index) {
    if (!workspace || index < 0) return null;
    var topBlocks = workspace.getTopBlocks(true);
    var startBlock = null;
    for (var i = 0; i < topBlocks.length; i++) {
      if (topBlocks[i].type === 'miniasm_start') {
        startBlock = topBlocks[i];
        break;
      }
    }
    var block = startBlock && startBlock.getNextBlock ? startBlock.getNextBlock() : null;
    var n = 0;
    while (block) {
      if (block.type !== 'miniasm_start' && generator[block.type]) {
        if (n === index) return block;
        n++;
      }
      block = block.getNextBlock ? block.getNextBlock() : null;
    }
    return null;
  }

  function setPCIndicator(workspace, pcIndex) {
    if (!workspace) return;
    var pcBlock = pcIndex >= 0 ? getBlockAtLineIndex(workspace, pcIndex) : null;
    if (typeof workspace.highlightBlock === 'function') {
      workspace.highlightBlock(pcBlock ? pcBlock.id : null);
    }
  }

  function updateBlockLineNumbers(workspace) {
    if (!workspace) return;
    var topBlocks = workspace.getTopBlocks(true);
    var startBlock = null;
    for (var i = 0; i < topBlocks.length; i++) {
      if (topBlocks[i].type === 'miniasm_start') {
        startBlock = topBlocks[i];
        break;
      }
    }
    var block = startBlock && startBlock.getNextBlock ? startBlock.getNextBlock() : null;
    var lineNum = 1;
    while (block) {
      if (block.type !== 'miniasm_start' && generator[block.type]) {
        var field = block.getField('LINE_NUM');
        if (field && typeof field.setValue === 'function') {
          field.setValue(String(lineNum));
        }
        lineNum++;
      }
      block = block.getNextBlock ? block.getNextBlock() : null;
    }
  }

  function centerBlocksInView(workspace) {
    if (!workspace) return;
    var topBlocks = workspace.getTopBlocks(true);
    var startBlock = null;
    for (var i = 0; i < topBlocks.length; i++) {
      if (topBlocks[i].type === 'miniasm_start') {
        startBlock = topBlocks[i];
        break;
      }
    }
    if (startBlock && typeof workspace.centerOnBlock === 'function') {
      workspace.centerOnBlock(startBlock.id, false);
    }
  }

  global.MiniASMBlocks = {
    blocksToCode: blocksToCode,
    codeToBlocks: codeToBlocks,
    createWorkspace: createWorkspace,
    getBlockAtLineIndex: getBlockAtLineIndex,
    setPCIndicator: setPCIndicator,
    updateBlockLineNumbers: updateBlockLineNumbers,
    centerBlocksInView: centerBlocksInView,
    buildToolboxXml: buildToolboxXml,
    updateToolbox: updateToolbox
  };
})(typeof window !== 'undefined' ? window : this);
