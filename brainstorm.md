# WDR+E — Category & Challenge Brainstorm

> **Design principle:** Every category should unlock at least one new instruction,
> turning challenges into "keys" that open new possibilities. The learner should
> feel like they're building their own computer, one instruction at a time.

**Implemented so far:** Arithmetic (tutorials 0–3, challenges ADD/MUL/POW), **Comparisons & Logic** (tutorials 7–8, challenges SUB/ABS/SGN/MIN/MAX), **Swaps & Rearrangement** (tutorial 14, challenges SWAP/ROTATE3/SORT2/SORT3). All other categories and the SYS/syscalls idea below are not yet implemented.

---

## Current instruction inventory

| Status | Instructions |
|--------|-------------|
| **Primitives** (always available) | `SET`, `INC`, `DEC`, `ISZ`, `ISN`, `STP`, `JMP` |
| **Unlocked via Arithmetic** | `ADD`, `MUL`, `POW` |
| **Unlocked via Comparisons** | `SUB` |
| **Unlocked via Swaps** | `SWP` |
| **Proposed new** | `LDR`, `STR`, `DIV`, `MOD`, `SHL`, `SHR` |

---

## 📐 Category: Comparisons & Logic — **✅ Implemented**

> *Prerequisite: complete Arithmetic*
> *Key unlock: SUB*

### Tutorials
- **"Going Down"** — Subtract a fixed amount using DEC; introduces negative registers — ✅
- **"Which Way?"** — Teaches ISN (if negative, skip): branch based on sign — ✅

### Challenges
| # | Name | Goal | Unlocks | Done |
|---|------|------|---------|------|
| 1 | **SUB** | `r0 = r2 − r3` | `SUB rX rY` | ✅ |
| 2 | **ABS** | `r0 = \|r2\|` (absolute value) | — | ✅ |
| 3 | **SGN** | `r0 = sign(r2)` → −1, 0, or +1 | — | ✅ |
| 4 | **MIN** | `r0 = min(r2, r3)` | — | ✅ |
| 5 | **MAX** | `r0 = max(r2, r3)` | — | ✅ |

---

## 🔀 Category: Swaps & Rearrangement — **✅ Implemented**

> *Prerequisite: complete Arithmetic*
> *Key unlock: SWP — a simple but powerful utility instruction*

### Tutorials
- **"The Spare Drawer"** — Swap two values using a third register as temp (classic 3-variable swap pattern) — ✅

### Challenges
| # | Name | Goal | Unlocks | Done |
|---|------|------|---------|------|
| 1 | **SWAP** | Swap r2 and r3 (result: r2 has old r3, r3 has old r2) | `SWP rX rY` | ✅ |
| 2 | **ROTATE3** | Rotate r1→r2→r3→r1 (cyclic shift of 3 values) | — | ✅ |
| 3 | **SORT2** | Put min(r2,r3) in r2, max(r2,r3) in r3 (conditional swap) | — | ✅ |
| 4 | **SORT3** | Sort r1 ≤ r2 ≤ r3 (only 3 values, but needs multiple comparisons) | — | ✅ |

> *SORT3 with only primitives + SWP is a great intro to sorting logic.*

---

## 🗄️ Category: Memory & Pointers — *Not yet*

> *Prerequisite: complete Arithmetic*
> *Key unlocks: LDR, STR — the gateway to real algorithms*
>
> `LDR rX rY` — Load: `rX = memory[rY]` (read from address stored in rY)
> `STR rX rY` — Store: `memory[rY] = rX` (write to address stored in rY)

### Tutorials
- **"The Shelf"** — Store and retrieve a value from a fixed memory address (`SET @0 r2` / `SET r0 @0`)
- **"The Mailbox"** — Use a register as a *pointer*: put an address in r1, then read from that address (motivates why LDR/STR are needed)

### Challenges
| # | Name | Goal | Unlocks |
|---|------|------|---------|
| 1 | **INDIRECT READ** | r2 holds an address. Put the value at that address into r0 (i.e. `r0 = memory[r2]`) | `LDR rX rY` |
| 2 | **INDIRECT WRITE** | Write the value r3 into the memory cell whose address is in r2 (i.e. `memory[r2] = r3`) | `STR rX rY` |
| 3 | **FILL** | Set memory cells `@0..@(r2−1)` all to value r3 | — |
| 4 | **COPY BLOCK** | Copy `@0..@(r2−1)` to `@r3..@(r3+r2−1)` | — |
| 5 | **SUM ARRAY** | `r0 = @0 + @1 + … + @(r2−1)` | — |

> *Once you have LDR/STR, the learner can work with arrays and data structures — this is the single most impactful unlock.*

---

## 🔍 Category: Searching — *Not yet*

> *Prerequisite: complete Memory & Pointers (needs LDR/STR)*

### Tutorials
- **"Needle in a Haystack"** — Walk through memory cells one by one looking for a value

### Challenges
| # | Name | Goal | Unlocks |
|---|------|------|---------|
| 1 | **LINEAR SEARCH** | Find index of value r3 in `@0..@(r2−1)`, or −1 if not found | — |
| 2 | **COUNT** | Count how many cells in `@0..@(r2−1)` equal r3 | — |
| 3 | **FIND MIN** | `r0 = index of smallest value` in `@0..@(r2−1)` | — |
| 4 | **FIND MAX** | `r0 = index of largest value` in `@0..@(r2−1)` | — |

---

## 📊 Category: Sorting — *Not yet*

> *Prerequisite: complete Searching + Swaps*
> *Capstone category — combines everything learned so far*

### Tutorials
- **"Swap Two Neighbors"** — Compare and swap two adjacent memory cells (the building block of bubble sort)

### Challenges
| # | Name | Goal | Unlocks |
|---|------|------|---------|
| 1 | **SORT PAIR** | Sort `@0, @1` so `@0 ≤ @1` | — |
| 2 | **SORT TRIPLE** | Sort `@0, @1, @2` in ascending order | — |
| 3 | **BUBBLE SORT** | Sort `@0..@(r2−1)` ascending (any correct sort accepted) | — |
| 4 | **SELECTION SORT** | Sort `@0..@(r2−1)` using selection sort (find min, swap to front) | — |

> *Sorting is a huge milestone. The learner has essentially built a computer that can sort!*

---

## ➗ Category: Division & Remainders — *Not yet*

> *Prerequisite: complete Comparisons (needs SUB)*
> *Key unlocks: DIV, MOD*

### Tutorials
- **"Repeated Subtraction"** — Division is just counting how many times you can subtract

### Challenges
| # | Name | Goal | Unlocks |
|---|------|------|---------|
| 1 | **DIV** | `r0 = r2 ÷ r3` (integer division, floor) | `DIV rX rY` |
| 2 | **MOD** | `r0 = r2 mod r3` (remainder) | `MOD rX rY` |
| 3 | **DIVMOD** | `r0 = quotient`, `r1 = remainder` (both at once) | — |
| 4 | **GCD** | `r0 = gcd(r2, r3)` via Euclid's algorithm | — |

---

## ⚡ Category: Bitwise & Shifting — *Not yet*

> *Prerequisite: complete Division & Remainders (needs MOD for even/odd)*
> *Key unlocks: SHL, SHR*
>
> `SHL rX` — Shift left: `rX = rX × 2`
> `SHR rX` — Shift right: `rX = rX ÷ 2` (floor)

### Tutorials
- **"Double or Nothing"** — Double a value using ADD rX rX, then learn about SHL
- **"Half Time"** — Halve a value using repeated subtraction, motivating SHR

### Challenges
| # | Name | Goal | Unlocks |
|---|------|------|---------|
| 1 | **DOUBLE** | `r0 = r2 × 2` (without MUL) | `SHL rX` |
| 2 | **HALVE** | `r0 = r2 ÷ 2` (floor, without DIV) | `SHR rX` |
| 3 | **IS EVEN?** | `r0 = 1` if r2 is even, `0` otherwise | — |
| 4 | **LOG2** | `r0 = ⌊log₂(r2)⌋` (how many times can you halve?) | — |
| 5 | **IS POWER OF 2?** | `r0 = 1` if r2 is a power of 2, `0` otherwise | — |

---

## 🔢 Category: Sequences & Series — *Not yet*

> *Prerequisite: complete Arithmetic*
> *No new unlocks — pure algorithmic thinking*

### Tutorials
- **"Counting Up"** — Sum 1 + 2 + … + N with a loop

### Challenges
| # | Name | Goal | Unlocks |
|---|------|------|---------|
| 1 | **TRIANGULAR** | `r0 = 1 + 2 + … + r2` | — |
| 2 | **FACTORIAL** | `r0 = r2!` | — |
| 3 | **FIBONACCI** | `r0 = fib(r2)` — tricky with 4 registers! | — |
| 4 | **COLLATZ** | `r0 = # of steps to reach 1 from r2` (needs even/odd check) | — |

---

## 🧮 Category: Number Theory — *Not yet*

> *Prerequisite: complete Division & Remainders (needs MOD)*

### Challenges
| # | Name | Goal | Unlocks |
|---|------|------|---------|
| 1 | **ISQRT** | `r0 = ⌊√r2⌋` (integer square root via trial) | — |
| 2 | **ISPRIME** | `r0 = 1` if r2 is prime, `0` otherwise | — |
| 3 | **NTH PRIME** | `r0 =` the r2-th prime number | — |

---

## 🔄 Category: Encoding & Decoding — *Not yet*

> *Prerequisite: complete Memory & Pointers + Bitwise*
> *Uses memory to store sequences of digits/bits*

### Challenges
| # | Name | Goal | Unlocks |
|---|------|------|---------|
| 1 | **TO BINARY** | Write binary digits of r2 into `@0..@(r0−1)` (r0 = number of bits) | — |
| 2 | **FROM BINARY** | Read binary digits from `@0..@(r2−1)` → `r0` (decimal value) | — |
| 3 | **CAESAR CIPHER** | Shift every value in `@0..@(r2−1)` up by r3 (wrap around at 26) | — |
| 4 | **RLE ENCODE** | Run-length encode `@0..@(r2−1)` into `@32..` (value, count pairs) | — |

> *RLE is a real compression algorithm — the learner implements actual CS!*

---

## 🏗️ Category: Data Structures — *Not yet*

> *Prerequisite: complete Memory & Pointers*
> *Teaches stack/queue patterns using memory*

### Tutorials
- **"The Stack"** — Use a register as a stack pointer, push/pop values to/from memory

### Challenges
| # | Name | Goal | Unlocks |
|---|------|------|---------|
| 1 | **PUSH & POP** | Push r2 then r3 onto a stack at `@0..`, pop both into r0 (should get r3) | — |
| 2 | **STACK REVERSE** | Push `@0..@(r2−1)` onto stack, pop back → array is reversed | — |
| 3 | **BALANCED?** | `@0..@(r2−1)` has 1s (open) and 2s (close). `r0 = 1` if balanced, 0 otherwise | — |
| 4 | **QUEUE** | Implement enqueue/dequeue: process r2 values FIFO | — |

> *Teaching data structures at machine level gives deep understanding of how stacks/queues actually work.*

---

## Suggested progression graph

```
Arithmetic (existing)
    │
    ├─── Comparisons & Logic  ──→  Division & Remainders  ──→  Number Theory
    │         unlocks SUB              unlocks DIV, MOD
    │
    ├─── Swaps & Rearrangement  ──┐
    │         unlocks SWP          │
    │                              ├──→  Sorting (capstone)
    ├─── Memory & Pointers  ──────┤
    │         unlocks LDR, STR     │
    │              │               │
    │              ├──→ Searching ─┘
    │              │
    │              ├──→ Data Structures
    │              │
    │              └──→ Encoding & Decoding (also needs Bitwise)
    │
    ├─── Sequences & Series (no unlocks, pure algo)
    │
    └─── Bitwise & Shifting (needs Division)
              unlocks SHL, SHR
```

## Unlock chain summary

```
Primitives:  SET  INC  DEC  ISZ  ISN  STP  JMP
                │
Arithmetic:     ├──→  ADD  ──→  MUL  ──→  POW
                │
Comparisons:    ├──→  SUB
                │
Swaps:          ├──→  SWP
                │
Memory:         ├──→  LDR  +  STR
                │
Division:       ├──→  DIV  +  MOD
                │
Bitwise:        ├──→  SHL  +  SHR
                │
Syscalls:       └──→  SYS  (1 instruction, many call numbers)
```

Total: 7 primitives + 11 unlockable = **18 instructions** in the full game.
`SYS` alone unlocks ~10 syscalls — the biggest single unlock in the game.
Each unlock genuinely enables new kinds of programs the learner couldn't write before.

---
---

# 💡 Big Idea: I/O via Syscalls — Like a Real OS — *Not yet*

> *This would turn WDR+E from a "math toy" into something that feels like a real computer,
> while teaching how operating systems actually work.*

## Concept

Instead of dedicated I/O instructions, add a single **system call** instruction:

| Instruction | What it does |
|-------------|-------------|
| `SYS rX` | **Syscall** — Perform system call number `rX`. Arguments/results via registers and memory. |

Just like a real OS (Linux `syscall`, DOS `int 21h`), the program puts a **call number**
in a register, arguments in other registers, and invokes `SYS`. The "kernel" (the VM runtime)
handles the rest.

This is how real computers work: user programs don't talk to hardware directly —
they ask the OS to do it. The learner discovers *why* syscalls exist.

## Syscall table

| Call # (r0) | Name | Args | Result | Description |
|-------------|------|------|--------|-------------|
| 1 | `write_char` | r1 = ASCII code | — | Print one character to screen |
| 2 | `read_char` | — | r0 = ASCII code | Block until keypress, return code |
| 3 | `read_key` | — | r0 = ASCII code (0 if none) | Non-blocking key read |
| 4 | `clear_screen` | — | — | Clear screen, cursor to (0,0) |
| 5 | `set_cursor` | r1 = column, r2 = row | — | Move cursor position |
| 6 | `get_cursor` | — | r1 = column, r2 = row | Read current cursor position |
| 7 | `write_mem` | r1 = start addr, r2 = length | — | Print `length` chars from memory starting at `@r1` |
| 8 | `read_line` | r1 = dest addr, r2 = max length | r0 = chars read | Read until Enter, store in memory |
| 9 | `random` | r1 = max | r0 = random 0..max-1 | Generate random number |
| 10 | `timer` | — | r0 = elapsed steps | Read step counter (for timing) |

> *Start with just calls 1-2 (write/read char). Add more as the learner progresses.
> The table can grow — just like a real OS gains new syscalls over versions.*

## How it works in practice

```asm
; Print 'H' to screen
SET r0 #1       ; syscall 1 = write_char
SET r1 #72      ; 'H' = ASCII 72
SYS r0          ; execute syscall

; Wait for a keypress
SET r0 #2       ; syscall 2 = read_char
SYS r0          ; blocks until key pressed, result in r0
; r0 now holds the ASCII code of the pressed key
```

The beauty: **one instruction (`SYS`) unlocks an entire world of capabilities.**
Each new syscall number the learner discovers is like finding a new tool,
but the mechanism is always the same.

## UI additions

- **Character screen panel** — monospaced grid, dark background
  (green-on-black retro feel, or Catppuccin-themed)
- Cursor position tracked internally (auto-advance after each write, newline on code 10)
- Screen could appear as a toggleable tab alongside registers/memory,
  or as a split below them
- When `SYS` with `read_char` is hit, the VM pauses and the screen panel
  gets focus with a blinking cursor, waiting for a keypress

## Category: Syscalls & I/O — *Not yet*

> *Prerequisite: complete Memory & Pointers*
> *Key unlock: SYS*

### Tutorials
- **"Knock Knock"** — Introduces the syscall concept: put call number in r0, args in r1, call `SYS r0`. Print one character.
- **"Say Hello"** — Store 'H','e','l','l','o' in memory, loop through and syscall `write_char` for each
- **"Echo"** — `read_char` then `write_char` in a loop — the user types and sees their own keys

### Challenges
| # | Name | Goal | Unlocks |
|---|------|------|---------|
| 1 | **PRINT CHAR** | Use syscall to print the character whose code is in r2 | `SYS rX` (syscalls 1-2) |
| 2 | **ECHO** | Read keys and echo them back until Enter (code 10) | syscall 3 (non-blocking) |
| 3 | **HELLO WORLD** | Print "HELLO" from memory using a loop | syscall 7 (write_mem) |
| 4 | **UPPERCASE** | Read chars until Enter, output them as uppercase | — |
| 5 | **REVERSE ECHO** | Read chars into memory, then print in reverse | — |
| 6 | **COUNTER** | Display a counting number on screen (int→digit conversion) | — |
| 7 | **TYPEWRITER** | Full echo with newline + cursor support | syscalls 5-6 (cursor) |

> *The int→digit conversion in COUNTER is deceptively hard: DIV/MOD to extract digits,
> add 48 for ASCII, print in the right order. Great capstone.*

## Category: Games & Interactive (endgame) — *Not yet*

> *Prerequisite: complete Syscalls & I/O + most other categories*
> *The ultimate reward — you've built enough of a computer to make games*

### Challenges (open-ended / creative)
| # | Name | Goal | Needs |
|---|------|------|-------|
| 1 | **NUMBER GUESS** | Machine picks a "secret" (via `random` syscall). User guesses, machine says higher/lower/correct! | syscall 9 |
| 2 | **REACTION TIME** | Print a char after random delay, measure response time | syscalls 9, 10 |
| 3 | **SNAKE BYTE** | Move a character around screen with WASD (non-blocking key read + cursor positioning) | syscalls 3, 5 |
| 4 | **PONG** | Two paddles, a bouncing ball — the holy grail | everything |

> *Even a simple number guessing game on this machine would be a huge achievement.
> "I wrote a game in assembly" is a story the learner will tell forever.*

## Why syscalls > dedicated instructions

| Dedicated instructions (`INP`, `OUT`, `CLR`...) | Syscall approach (`SYS`) |
|--------------------------------------------------|--------------------------|
| One instruction per feature — instruction set bloats | One instruction, infinite capabilities |
| Doesn't teach anything about real systems | Teaches exactly how Linux/Windows/DOS work |
| Adding new I/O means new parser/interpreter work | Adding new I/O = just a new call number |
| Flat learning curve | "Aha!" moment: *"Oh, THAT'S what a syscall is!"* |

## Implementation notes

- `SYS rX` reads `machine.registers[rX]` as the call number, dispatches to handler
- Handlers are a simple lookup table — easy to extend
- `read_char` (call 2) sets `machine.waitingForInput = true`; the UI listens for
  a keypress, writes the code into r0, then resumes execution
- `write_char` (call 1) pushes to `machine.screenBuffer`; the UI renders it
- `machine.screen` = array (e.g. 40×12 = 480 cells) + cursor position
- Auto-run/step pauses naturally on blocking syscalls (read_char, read_line)
- Screen panel is hidden until the first `SYS` challenge is reached

## Where it fits in the progression

```
                           ... all other categories ...
                                       │
Memory & Pointers  ───────────────────►│
Encoding & Decoding  ─────────────────►│
                                       ▼
                            Syscalls & I/O
                                  │
                                  ▼
                          Games & Interactive
```

This would be the **late-game content** — by the time the learner reaches it,
they've mastered loops, memory, pointers, and encoding. Syscalls make their
programs come alive, and they learn a concept that transfers directly to
real systems programming.
