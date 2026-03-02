/**
 * MiniASM VM — vanilla JavaScript implementation.
 * Instruction set: SET (Reg/Mem, Reg/Mem/Immediate), INC, DEC, ISZ, ISN, STP, JMP.
 */

const Register = { R0: 0, R1: 1, R2: 2, R3: 3 };
const REG_NAMES = ['r0', 'r1', 'r2', 'r3'];

function parseOperand(token) {
  if (!token || token.length < 2) throw new Error(`Invalid token: ${token}`);
  const prefix = token[0];
  const value = parseInt(token.slice(1), 10);
  if (Number.isNaN(value)) throw new Error(`Invalid number in token: ${token}`);
  switch (prefix) {
    case 'r': return { type: 'Register', value };
    case '#': return { type: 'Immediate', value };
    case '@': return { type: 'MemoryAddress', value };
    case 'l': return { type: 'InstructionNumber', value };
    default: throw new Error(`Unknown token prefix: ${prefix}`);
  }
}

const INST = {
  SET: {
    args: [
      ['Register', 'MemoryAddress'],
      ['Register', 'MemoryAddress', 'Immediate']
    ],
    run(m, dest, src) {
      const v = getValue(m, src);
      setValue(m, dest, v);
    }
  },
  INC: {
    args: [['Register']],
    run(m, x) { m.registers[x.value] += 1; }
  },
  DEC: {
    args: [['Register']],
    run(m, x) { m.registers[x.value] -= 1; }
  },
  ISZ: {
    args: [['Register']],
    run(m, x) { if (m.registers[x.value] === 0) m.pc += 1; }
  },
  ISN: {
    args: [['Register']],
    run(m, x) { if (m.registers[x.value] < 0) m.pc += 1; }
  },
  ADD: {
    args: [['Register'], ['Register']],
    run(m, x, y) { m.registers[x.value] += m.registers[y.value]; }
  },
  MUL: {
    args: [['Register'], ['Register']],
    run(m, x, y) { m.registers[x.value] *= m.registers[y.value]; }
  },
  POW: {
    args: [['Register'], ['Register']],
    run(m, x, y) { m.registers[x.value] = Math.pow(m.registers[x.value], m.registers[y.value]); }
  },
  STP: {
    args: [],
    run(m) { m.halted = true; }
  },
  JMP: {
    args: [['InstructionNumber']],
    run(m, line) { m.pc = line.value - 1; }  // source line numbers are 1-based (l1=first, l2=second, …)
  }
};

function checkArg(opcode, argIndex, operand, allowedTypes) {
  if (!allowedTypes.includes(operand.type)) {
    throw new Error(
      `Argument ${argIndex + 1} for ${opcode}: expected one of [${allowedTypes.join(', ')}], got ${operand.type}`
    );
  }
}

function getValue(m, op) {
  switch (op.type) {
    case 'Register': return m.registers[op.value];
    case 'MemoryAddress': return m.memory[op.value];
    case 'Immediate': return op.value;
    default: throw new Error(`Cannot get value for type: ${op.type}`);
  }
}

function setValue(m, dest, value) {
  switch (dest.type) {
    case 'Register': m.registers[dest.value] = value; break;
    case 'MemoryAddress': m.memory[dest.value] = value; break;
    default: throw new Error(`Cannot set value for type: ${dest.type}`);
  }
}

function parseInstruction(line) {
  const tokens = line.split(/\s+/).map(s => s.trim()).filter(Boolean);
  if (tokens.length === 0) return null;
  const opcode = tokens[0];
  const info = INST[opcode];
  if (!info) throw new Error(`Unknown opcode: ${opcode}`);
  const givenArgs = tokens.slice(1);
  if (info.args.length !== givenArgs.length) {
    throw new Error(`Expected ${info.args.length} arguments for ${opcode}, got ${givenArgs.length}`);
  }
  const operands = givenArgs.map(t => parseOperand(t));
  for (let i = 0; i < info.args.length; i++) {
    checkArg(opcode, i, operands[i], info.args[i]);
  }
  return { opcode, operands };
}

function createMachine() {
  const rand = () => Math.floor(Math.random() * 256);
  return {
    instructions: [],
    code: [],
    registers: { [Register.R0]: rand(), [Register.R1]: rand(), [Register.R2]: rand(), [Register.R3]: rand() },
    memory: Array.from({ length: 64 }, rand),
    pc: 0,
    halted: false
  };
}

/**
 * Load program into machine. Accepts:
 * - string: raw source (e.g. from textarea)
 * - object: { source: string } or { lines: string[] }
 */
function loadProgram(machine, program) {
  let text;
  if (typeof program === 'string') {
    text = program;
  } else if (program && typeof program === 'object') {
    if (typeof program.source === 'string') text = program.source;
    else if (Array.isArray(program.lines)) text = program.lines.join('\n');
    else throw new Error('Program object must have "source" or "lines"');
  } else {
    throw new Error('Program must be a string or { source | lines } object');
  }
  const allLines = text.split(/\n/).map(l => l.trim());
  const lines = [];
  const lineNumbers = [];
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];
    if (line && !line.startsWith(';')) {
      lines.push(line);
      lineNumbers.push(i + 1);
    }
  }
  machine.instructions = lines;
  machine.code = lines.map((line, idx) => [idx, parseInstruction(line)]);
  machine.lineNumbers = lineNumbers;
  return machine;
}

function execute(machine) {
  const [index, instr] = machine.code[machine.pc];
  INST[instr.opcode].run(machine, ...instr.operands);
  if (machine.halted) return;
  if (instr.opcode !== 'JMP') {
    machine.pc += 1;
  }
}

function run(machine, maxSteps = 100000) {
  let steps = 0;
  while (machine.pc < machine.code.length && !machine.halted && steps < maxSteps) {
    execute(machine);
    steps += 1;
  }
  return machine.halted;
}

function printCode(machine) {
  for (const [idx, instr] of machine.code) {
    const marker = idx === machine.pc ? ' <== PC' : '';
    const argsStr = instr.operands.map(op => {
      if (op.type === 'Register') return REG_NAMES[op.value];
      if (op.type === 'Immediate') return '#' + op.value;
      if (op.type === 'MemoryAddress') return '@' + op.value;
      return 'l' + op.value;
    }).join(' ');
    console.log(`${idx}: ${instr.opcode} ${argsStr}${marker}`);
  }
}

function printRegisters(machine) {
  console.log('Registers:');
  for (let i = 0; i <= 3; i++) {
    console.log(`r${i}: ${machine.registers[i]}`);
  }
}

function printMemory(machine) {
  for (let i = 0; i < 64; i += 8) {
    const row = machine.memory.slice(i, i + 8).map(x => x.toString(16).padStart(2, '0'));
    console.log(row.join(' '));
  }
}

// Export for use as module or in browser (code from DOM via loadProgram(m, { source: el.value }))
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Register,
    createMachine,
    loadProgram,
    execute,
    run,
    parseInstruction,
    printCode,
    printRegisters,
    printMemory,
    INST
  };
}
if (typeof window !== 'undefined') {
  window.MiniASM = {
    Register,
    createMachine,
    loadProgram,
    execute,
    run,
    parseInstruction,
    printCode,
    printRegisters,
    printMemory,
    INST
  };
}
