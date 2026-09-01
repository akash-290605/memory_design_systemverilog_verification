# Memory Design & SystemVerilog Verification

![Verilog](https://img.shields.io/badge/RTL-Verilog-green)
![SystemVerilog](https://img.shields.io/badge/Verification-SystemVerilog-blue)
![QuestaSim](https://img.shields.io/badge/Simulator-QuestaSim-orange)
![SVA](https://img.shields.io/badge/Assertions-SVA-purple)
![Coverage](https://img.shields.io/badge/Coverage-Code%20%7C%20Functional%20%7C%20Assertion-brightgreen)
![GitHub](https://img.shields.io/badge/Version%20Control-GitHub-black)

---

## Overview

This project implements and verifies a **1 KB Single-Port Synchronous Memory** using **Verilog HDL** for RTL design and a **layered SystemVerilog verification environment** for functional verification.

The project demonstrates a complete **RTL Design and Functional Verification flow**, starting from RTL implementation and continuing through simulation, constrained-random testing, self-checking, functional coverage, code coverage, assertion checking, regression testing, waveform analysis, and verification closure.

### Memory Configuration

- **Memory Capacity:** 1 KB
- **Data Width:** 32 bits
- **Data Size:** 4 Bytes
- **Memory Depth:** 256 words
- **Address Width:** 8 bits
- **Address Range:** `0x00` to `0xFF`
- **Memory Type:** Single-Port Synchronous Memory
- **Interface:** `valid/ready` handshake
- **Clock:** Positive-edge triggered
- **Reset:** Active-high synchronous reset
- **RTL Language:** Verilog HDL
- **Verification Language:** SystemVerilog
- **Simulator:** QuestaSim / ModelSim

---

## Project Objectives

The main objectives of this project are:

1. Design a synchronous memory using Verilog HDL.
2. Verify memory write functionality.
3. Verify memory read functionality.
4. Verify reset behavior.
5. Verify `valid/ready` handshake behavior.
6. Verify all legal memory addresses.
7. Verify minimum and maximum address boundaries.
8. Verify unwritten memory locations.
9. Verify invalid transaction behavior.
10. Develop a reusable layered SystemVerilog testbench.
11. Implement a self-checking scoreboard.
12. Implement an associative-array reference model.
13. Implement functional coverage.
14. Implement cross coverage.
15. Implement SystemVerilog Assertions.
16. Run RTL code coverage.
17. Run assertion coverage.
18. Automate simulation using QuestaSim `.do` scripts.
19. Verify scoreboard error-detection capability using intentional mismatch tests.
20. Perform regression testing for verification closure.

---

## Memory Specification

| Parameter | Specification |
|---|---|
| Memory Type | Single-Port Synchronous Memory |
| Memory Capacity | **1 KB** |
| Data Width | **32 bits** |
| Data Size | **4 Bytes** |
| Memory Depth | **256 Words** |
| Address Width | **8 bits** |
| Address Range | `0x00` – `0xFF` |
| Clock | Positive Edge Triggered |
| Reset | Active-High Synchronous Reset |
| Interface | `valid/ready` handshake |
| RTL Language | Verilog HDL |
| Verification Language | SystemVerilog |
| Simulator | QuestaSim / ModelSim |

---

## Memory Size Calculation

The memory capacity is calculated as:

```text
Memory Capacity = Number of Locations × Data Width
                 = 256 × 32 bits
                 = 8192 bits
                 = 1024 Bytes
                 = 1 KB

Therefore:
256 words × 32 bits = 1 KB
```

---

## Memory Architecture

The memory is implemented as a single-port synchronous memory.

```text
                     +----------------------+
                     |                      |
         clk ------->|                      |
         rst ------->|                      |
       valid ------->|                      |
      wr_rd  ------->|                      |
        addr ------->|     1 KB MEMORY      |
       wdata ------->|      256 × 32        |
                     |                      |
       rdata <-------|                      |
       ready <-------|                      |
                     |                      |
                     +----------------------+
```

The memory contains:

- 256 memory locations
- Each location = 32 bits
- Total capacity = 8192 bits = 1 KB

---

## Memory Address Organization

The memory uses an 8-bit address.

Therefore:

```text
2^8 = 256 locations
```

The valid address range is: `0x00 → 0xFF`

| Address | Description |
|---|---|
| 0x00 | First memory location |
| 0x01 | Second memory location |
| 0x02 | Third memory location |
| ... | ... |
| 0xFE | Second-last memory location |
| 0xFF | Last memory location |

The verification environment explicitly tests the minimum and maximum addresses.

---

## Interface Specification

The memory interface contains the following signals.

| Signal | Direction | Width | Description |
|---|---|---|---|
| clk | Input | 1 | System clock |
| rst | Input | 1 | Active-high synchronous reset |
| valid | Input | 1 | Indicates a valid transaction |
| ready | Output/Input* | 1 | Indicates transaction acceptance |
| wr_rd | Input | 1 | Selects read or write operation |
| addr | Input | 8 | Memory address |
| wdata | Input | 32 | Write data |
| rdata | Output | 32 | Read data |

\* `ready` direction must match the actual RTL implementation.

### Read Operation

For a read transaction, the verification environment drives a valid transaction with the appropriate read/write control.

Conceptually:

```text
valid = 1
wr_rd = READ
addr  = requested address
```

The memory returns the data stored at the requested address.

```text
Read Data = Memory[addr]
```

The verification environment compares the returned DUT data against the reference model.

### Write Operation

For a write transaction, the verification environment drives:

```text
valid = 1
wr_rd = WRITE
addr  = requested address
wdata = data to be written
```

The write occurs synchronously with the active clock edge.

Conceptually:

```text
Memory[addr] = wdata
```

The scoreboard updates its reference model with the same transaction.

---

## Reset Behavior

The memory uses an active-high synchronous reset.

When `rst = 1`, the DUT follows the reset behavior defined by the RTL.

The verification environment checks:

- Reset assertion
- Reset release
- Output behavior during reset
- Interface behavior during reset
- Transaction behavior after reset
- Correct operation after reset release

---

## Valid / Ready Handshake

The memory interface uses a valid/ready handshake mechanism.

A transaction is accepted when `valid && ready` is true.

The verification environment checks different handshake conditions, including:

- valid = 1, ready = 1
- valid = 1, ready = 0
- valid = 0, ready = 1
- valid = 0, ready = 0

This verifies correct behavior during normal operation and stalled transactions.

---

## Verification Architecture

The testbench follows a layered SystemVerilog verification architecture.

```text
                     +----------------+
                     |      TEST      |
                     +-------+--------+
                             |
                             v
                     +----------------+
                     |  ENVIRONMENT   |
                     +-------+--------+
                             |
          +------------------+------------------+
          |                  |                  |
          v                  v                  v
    +-----------+      +-----------+      +-----------+
    |   AGENT   |      | SCOREBOARD |      | COVERAGE  |
    +-----+-----+      +-----+-----+      +-----------+
          |                  |
   +------+------+           |
   |      |      |           |
   v      v      v           v
Generator Driver Monitor  Reference
              |              Model
              |                 |
              +--------+--------+
                       |
                       v
                  +---------+
                  |   DUT   |
                  | 1 KB RAM|
                  +---------+
```

---

## Verification Components

### Transaction

The transaction class, such as `mem_tx`, represents a memory operation.

Typical transaction fields include:

- Read/write operation
- Address
- Write data
- Read data
- Valid
- Ready
- Transaction delay

The transaction object provides a clean way to transfer memory operations between verification components.

### Generator

The generator creates directed and constrained-random transactions.

Typical generated scenarios include:

- Single write
- Single read
- Write followed by read
- Read-after-write
- Back-to-back writes
- Back-to-back reads
- Mixed read/write transactions
- Boundary-address accesses
- Random addresses
- Random data
- Handshake stalls
- Corner-case scenarios

### Driver / BFM

The Driver or Bus Functional Model converts transaction-level information into pin-level DUT activity.

The driver controls signals such as: `valid`, `wr_rd`, `addr`, `wdata`.

The driver follows the clock and the defined valid/ready protocol.

### SystemVerilog Interface

The SystemVerilog interface groups all DUT interface signals into one reusable connection.

The interface is shared between: DUT, Driver, Monitor, Assertions.

A clocking block is used to simplify signal synchronization and reduce race-condition problems between the testbench and DUT.

### Monitor

The monitor passively observes the DUT interface.

It captures:

- Address
- Read/write operation
- Write data
- Read data
- Valid
- Ready
- Transaction timing

The monitor converts pin-level activity into transaction objects.

The transactions are then sent to: Scoreboard, Coverage collector, Debug components.

### Agent

The agent groups the active verification components.

```text
Agent
 |
 +-- Generator
 |
 +-- Driver / BFM
 |
 +-- Monitor
```

This provides a modular and reusable verification structure.

### Environment

The environment integrates the major verification components.

```text
Environment
 |
 +-- Agent
 |
 +-- Scoreboard
 |
 +-- Reference Model
 |
 +-- Functional Coverage
 |
 +-- Assertions
```

The environment coordinates stimulus generation, monitoring, checking, and coverage collection.

---

## Reference Memory Model

An associative array is used as the reference memory model.

```systemverilog
bit [31:0] ref_mem[bit [7:0]];
```

The reference model maintains the expected contents of the memory.

For a write operation:

```text
ref_mem[address] = write_data
```

For a read operation:

```text
expected_data = ref_mem[address]
```

The expected value is compared with the actual DUT output.

---

## Scoreboard

The scoreboard provides self-checking functionality.

```text
              Reference Model
                     |
                     v
              +-------------+
              |  SCOREBOARD |
              +------+------+
                     ^
                     |
                  DUT Data
```

The scoreboard compares:

```text
Expected Data == Actual DUT Data
```

**Passing Condition:** `Expected == Actual` → the transaction is reported as a PASS.

**Failing Condition:** `Expected != Actual` → the scoreboard reports a DATA MISMATCH error.

---

## Functional Coverage

Functional coverage is used to measure whether important functional scenarios have been exercised.

Coverage includes:

- Address coverage
- Read coverage
- Write coverage
- Idle coverage
- Data pattern coverage
- Boundary address coverage
- Handshake coverage
- Cross coverage

### Address Coverage

The 256-address memory space is divided into functional regions.

```text
LOW       : 0x00 – 0x3F
MID_LOW   : 0x40 – 0x7F
MID_HIGH  : 0x80 – 0xBF
HIGH      : 0xC0 – 0xFF
```

Special boundary addresses:

```text
Minimum Address = 0x00
Maximum Address = 0xFF
```

All regions and boundary addresses are exercised during verification.

### Operation Coverage

Operation coverage includes: READ, WRITE, IDLE.

This ensures that all intended operation types are exercised.

### Data Pattern Coverage

The following data patterns are used during testing:

```text
0x00000000
0xFFFFFFFF
0xAAAAAAAA
0x55555555
0x12345678
0x87654321
```

These patterns help exercise different combinations of data bits.

### Cross Coverage

Cross coverage verifies combinations between functional coverage points.

For example:

```systemverilog
cross addr_bins, operation;
```

Possible combinations include:

- LOW + READ
- LOW + WRITE
- MID_LOW + READ
- MID_LOW + WRITE
- MID_HIGH + READ
- MID_HIGH + WRITE
- HIGH + READ
- HIGH + WRITE

Cross coverage helps identify scenarios that may not be covered by individual coverage points.

---

## SystemVerilog Assertions

SystemVerilog Assertions are used to check protocol and design behavior automatically.

The verification environment uses SVA to check conditions such as:

- Reset behavior
- Valid/ready handshake
- Signal stability during stalls
- Correct transaction timing
- Write control behavior
- Invalid transaction conditions
- Interface protocol compliance

Assertions allow protocol violations to be detected immediately during simulation.

---

## Test Plan

The verification test plan contains directed, constrained-random, corner-case, and fault-injection tests.

### Test 1 – Reset Test

**Objective:** Verify correct DUT behavior during and after reset.

**Checks:**
- Reset assertion
- Reset release
- Output behavior
- Interface behavior
- First transaction after reset

**Expected Result:** The DUT must follow the specified reset behavior and must not perform unintended transactions during reset.

### Test 2 – Single Write Test

**Objective:** Verify that data is correctly written into the selected memory location.

Example:

```text
Address   = 0x10
Data      = 0x12345678
Operation = WRITE
```

Expected: `Memory[0x10] = 0x12345678`

### Test 3 – Single Read Test

**Objective:** Verify that previously written data can be correctly read.

Example:

```text
Write:
Address = 0x20
Data    = 0xAAAAAAAA

Read:
Address = 0x20
```

Expected: `Read Data = 0xAAAAAAAA`

### Test 4 – Read After Write

The same address is written and then read: `WRITE → READ`

This verifies memory data retention and correct readback behavior.

### Test 5 – Back-to-Back Write

Multiple write transactions are performed consecutively: `WRITE → WRITE → WRITE → WRITE`

This verifies that consecutive write transactions are handled correctly.

### Test 6 – Back-to-Back Read

Multiple read transactions are performed consecutively: `READ → READ → READ → READ`

This verifies correct handling of consecutive read operations.

### Test 7 – Mixed Read/Write

Mixed transactions are generated: `WRITE → READ → WRITE → READ`

This verifies correct operation when read and write transactions occur consecutively.

### Test 8 – Boundary Address Test

The first and last memory addresses are explicitly tested.

```text
Minimum Address = 0x00
Maximum Address = 0xFF
```

Example:

```text
WRITE 0x00
READ  0x00

WRITE 0xFF
READ  0xFF
```

### Test 9 – Data Pattern Test

Multiple data patterns are written and read back.

```text
0x00000000
0xFFFFFFFF
0xAAAAAAAA
0x55555555
0x12345678
0x87654321
```

### Test 10 – Unwritten Address Test

The testbench reads addresses that have not previously been written.

The observed DUT result is compared against the expected behavior defined by the RTL specification.

### Test 11 – Randomized Test

Constrained-random transactions are generated to explore a large number of possible scenarios.

Randomized fields include:

- Address
- Read/write operation
- Write data
- Transaction delay
- Valid
- Ready

Random testing improves scenario diversity compared with purely directed testing.

### Test 12 – Handshake Stall Test

The verification environment generates stalled handshake conditions.

Examples:

- valid = 1, ready = 0
- valid = 0, ready = 1
- valid = 1, ready = 1

The purpose is to verify that the DUT behaves correctly when transactions are temporarily stalled.

### Test 13 – Invalid Transaction Test

Illegal or unsupported transaction conditions are generated where applicable.

The DUT response is checked against the defined interface behavior.

### Test 14 – Intentional Mismatch Test

The reference model is intentionally corrupted.

Example:

```text
Actual DUT Data = 0x12345678
Expected Data   = 0x87654321
```

The scoreboard must detect the mismatch.

Expected result: `ERROR: DATA MISMATCH`

This test verifies the error-detection capability of the scoreboard.

---

## Regression Testing

Regression testing runs multiple verification tests together.

The regression suite includes:

- Reset Test
- Basic Write Test
- Basic Read Test
- Read-After-Write Test
- Back-to-Back Write Test
- Back-to-Back Read Test
- Mixed Read/Write Test
- Boundary Test
- Data Pattern Test
- Unwritten Address Test
- Random Test
- Handshake Test
- Invalid Transaction Test
- Fault Injection Test

The objective is to ensure that changes to the RTL or testbench do not introduce new failures.

---

## Code Coverage

Code coverage is used to measure how thoroughly the RTL implementation has been exercised.

The targeted coverage metrics are:

- Statement Coverage
- Branch Coverage
- Condition Coverage
- Toggle Coverage

Reported project results:

| Coverage Metric | Result |
|---|---|
| Statement Coverage | 100% |
| Branch Coverage | 100% |
| Condition Coverage | 100% |
| Toggle Coverage | 100% |

---

## Functional Coverage Results

The reported functional coverage is: **Functional Coverage = 100%**

The coverage includes:

- Address bins
- Read operation
- Write operation
- Idle operation
- Data patterns
- Boundary addresses
- Cross coverage

---

## Assertion Coverage Results

The implemented SVA properties are exercised during regression.

Reported result: **Assertion Violations = 0**

All implemented assertion checks passed during the baseline regression.

---

## Scoreboard Results

The baseline regression produced:

```text
Transactions Checked = 10,000+
Mismatches           = 0
```

This demonstrates that the DUT output matched the expected reference-model behavior for the baseline regression.

---

## Fault Injection Results

The intentional mismatch test corrupts the expected reference data.

The scoreboard successfully detects the injected error.

```text
Injected Fault       → Detected
Scoreboard Detection → 100%
```

This demonstrates that the scoreboard is functioning as a self-checking verification component.

---

## Verification Results Summary

| Test / Metric | Result |
|---|---|
| Reset Test | PASS |
| Basic Write | PASS |
| Basic Read | PASS |
| Read After Write | PASS |
| Back-to-Back Write | PASS |
| Back-to-Back Read | PASS |
| Mixed Read/Write | PASS |
| Boundary Address | PASS |
| Data Pattern | PASS |
| Unwritten Address | PASS |
| Randomized Transactions | PASS |
| Handshake Stall | PASS |
| Invalid Transaction | PASS |
| Assertion Checks | PASS |
| Baseline Scoreboard | 0 Mismatches |
| Functional Coverage | 100% |
| Statement Coverage | 100% |
| Branch Coverage | 100% |
| Condition Coverage | 100% |
| Toggle Coverage | 100% |
| Fault Injection Detection | 100% |

---

## Simulation

Simulation is automated using QuestaSim / ModelSim `.do` scripts.

The simulation directory contains:

```text
sim/
└── run_sim.do
```

The simulation script can automate:

- Compilation
- Elaboration
- Test execution
- Waveform generation
- Coverage collection
- Simulation log generation
- Verification result generation

### Simulation Flow

```text
             Source Files
                  |
                  v
          Compile RTL + TB
                  |
                  v
              Elaborate
                  |
                  v
           Start Simulation
                  |
                  v
          Run Verification
                  |
      +-----------+-----------+
      |           |           |
      v           v           v
   Waveform    Coverage    Assertions
      |           |           |
      +-----------+-----------+
                  |
                  v
              Scoreboard
                  |
                  v
             Test Results
                  |
                  v
              Regression
                  |
                  v
         Verification Closure
```

---

## Simulation Artifacts

The repository contains or can contain simulation and verification artifacts.

```text
logs/
└── simulation.log

waveforms/
└── memory_waveform.wlf

coverage/
└── coverage_report/

results/
└── verification_results/
```

These artifacts are useful for:

- Debugging
- Waveform analysis
- Coverage analysis
- Regression review
- Verification documentation

---

## Waveform Analysis

Waveforms are used to debug and verify signal-level behavior.

Important signals to observe include: `clk`, `rst`, `valid`, `ready`, `wr_rd`, `addr`, `wdata`, `rdata`.

Waveform analysis helps verify:

- Correct transaction timing
- Correct read/write behavior
- Handshake behavior
- Reset behavior
- Data integrity
- Stall handling

The waveform file can be stored under `waveforms/`.

---

## Logs

Simulation logs provide textual evidence of test execution.

Typical log information includes:

- Test Started
- Transaction Generated
- Transaction Driven
- Transaction Monitored
- Scoreboard Comparison
- PASS / FAIL
- Coverage
- Assertion Results
- Test Completed

The simulation log can be stored under `logs/simulation.log`.

---

## Project Directory Structure

```text
memory_design_systemverilog_verification/
│
├── README.md
│
├── rtl/
│   └── memory.v
│
├── tb/
│   ├── interface/
│   ├── transaction/
│   ├── generator/
│   ├── driver/
│   ├── monitor/
│   ├── scoreboard/
│   ├── coverage/
│   ├── assertions/
│   ├── agent/
│   ├── environment/
│   └── tests/
│
├── sim/
│   └── run_sim.do
│
├── logs/
│   └── simulation.log
│
├── waveforms/
│   └── memory_waveform.wlf
│
├── coverage/
│   └── coverage_report/
│
├── results/
│   └── verification_results/
│
├── presentation/
│   └── Memory_Design_SystemVerilog_Verification.pptx
│
└── README.md
```

---

## Tools & Technologies

| Category | Technology |
|---|---|
| RTL Design | Verilog HDL |
| Verification | SystemVerilog |
| Assertions | SystemVerilog Assertions |
| Simulation | QuestaSim / ModelSim |
| Functional Coverage | SystemVerilog Covergroups |
| Code Coverage | Statement / Branch / Condition / Toggle |
| Assertion Coverage | SVA |
| Automation | QuestaSim .do Scripts |
| Version Control | Git |
| Repository | GitHub |

---

## Key Verification Features

**RTL Design**
- Verilog-based synchronous memory
- 1 KB memory capacity
- 32-bit data width
- 8-bit address width
- Single-port architecture
- Synchronous reset

**SystemVerilog Verification**
- Object-oriented transaction class
- Constrained-random stimulus
- Layered testbench
  - Interface
  - Clocking block
  - Generator
  - Driver / BFM
  - Monitor
  - Agent
  - Environment
  - Scoreboard
  - Reference model

**Verification Metrics**
- Functional coverage
- Cross coverage
- Code coverage
- Assertion coverage
- Regression testing
- Fault injection

**Debug**
- Simulation logs
- Waveform analysis
- Scoreboard error reporting
- Assertion failures
- Coverage reports

---

## Verification Closure

Verification closure is evaluated using multiple verification metrics.

The project targets:

```text
Functional Coverage      → 100%
Statement Coverage       → 100%
Branch Coverage          → 100%
Condition Coverage       → 100%
Toggle Coverage          → 100%
Assertion Violations     → 0
Scoreboard Mismatches    → 0
Fault Detection          → 100%
```

The combination of directed testing, constrained-random testing, assertions, coverage, scoreboard checking, and regression provides a comprehensive verification approach.

---

## Project Presentation

A PowerPoint presentation is included with the project.

Recommended location:

```text
presentation/
└── Memory_Design_SystemVerilog_Verification.pptx
```

The presentation covers:

- Project Overview
- Project Objectives
- Memory Specification
- Memory Architecture
- Memory Size Calculation
- RTL Design
- Verification Architecture
- Transaction
- Generator
- Driver / BFM
- Interface
- Clocking Block
- Monitor
- Agent
- Environment
- Scoreboard
- Reference Model
- Functional Coverage
- Cross Coverage
- SystemVerilog Assertions
- Test Scenarios
- Simulation
- Waveforms
- Logs
- Code Coverage
- Functional Coverage
- Regression Results
- Fault Injection
- Verification Closure

---

## Project Documentation

This README provides the complete overview of the project, including:

- Design specification
- Verification architecture
- Test plan
- Coverage
- Assertions
- Simulation
- Results
- Project structure
- Presentation

All source files and verification artifacts are maintained in the GitHub repository.

---

## Skills Demonstrated

This project demonstrates practical experience in:

Verilog HDL, SystemVerilog, RTL Design, Digital Design, Memory Design, Object-Oriented Programming, Constrained-Random Verification, Functional Verification, Testbench Development, Interface Design, Clocking Blocks, Bus Functional Models, Scoreboard Development, Reference Modeling, Functional Coverage, Cross Coverage, SystemVerilog Assertions, Code Coverage, Regression Testing, Fault Injection, Simulation Debugging, Waveform Analysis, QuestaSim / ModelSim, Git and GitHub.

---

## Conclusion

This project demonstrates a complete RTL Design and Functional Verification flow for a 1 KB Single-Port Synchronous Memory.

The memory is implemented using Verilog HDL, while a layered SystemVerilog verification environment is used to verify its functionality and protocol behavior.

The verification environment includes:

- Transaction-based stimulus
- Constrained-random verification
- Generator
- Driver / BFM
- Monitor
- Agent
- Environment
- Scoreboard
- Associative-array reference model
- Functional coverage
- Cross coverage
- SystemVerilog Assertions
- Code coverage
- Regression testing
- Fault injection
- Waveform analysis

The reported verification results demonstrate:

```text
Functional Coverage       = 100%
Statement Coverage        = 100%
Branch Coverage           = 100%
Condition Coverage        = 100%
Toggle Coverage           = 100%
Assertion Violations      = 0
Scoreboard Mismatches     = 0
Random Transactions       = 10,000+
Fault Detection           = 100%
```

This project showcases practical skills in RTL design, SystemVerilog functional verification, constrained-random testing, self-checking testbench development, assertions, coverage analysis, simulation debugging, and verification closure.

---

## Project Links

**GitHub Repository**

Memory Design & SystemVerilog Verification
https://github.com/akash-290605/memory_design_systemverilog_verification/tree/main

**Project Website**

GitHub Pages
https://akash-290605.github.io/memory_design_systemverilog_verification/

---

## Author

**Akash K**
Memory Design & SystemVerilog Verification Project
