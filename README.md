
# Memory Design & SystemVerilog Verification

![Verilog](https://img.shields.io/badge/RTL-Verilog-green)
![SystemVerilog](https://img.shields.io/badge/Verification-SystemVerilog-blue)
![QuestaSim](https://img.shields.io/badge/Simulator-QuestaSim-orange)
![SVA](https://img.shields.io/badge/Assertions-SVA-purple)
![Coverage](https://img.shields.io/badge/Coverage-Code%20%7C%20Functional%20%7C%20Assertion-brightgreen)
![GitHub](https://img.shields.io/badge/Version%20Control-GitHub-black)

## Overview

This project implements and verifies a **1 KB Single-Port Synchronous Memory** using **Verilog RTL** and a **layered SystemVerilog verification environment**.

The memory consists of:

- **Data Width:** 32 bits
- **Memory Depth:** 256 words
- **Address Width:** 8 bits
- **Memory Capacity:** 1 KB
- **Memory Type:** Single-Port Synchronous Memory
- **Interface:** `valid/ready` handshake
- **RTL Language:** Verilog HDL
- **Verification Language:** SystemVerilog
- **Simulator:** QuestaSim / ModelSim

The verification environment is developed using SystemVerilog Object-Oriented Programming concepts and includes:

- Transaction-based stimulus generation
- Constrained-random verification
- Bus Functional Model (BFM)
- SystemVerilog interface
- Clocking block
- Generator
- Monitor
- Agent
- Environment
- Scoreboard
- Reference memory model
- Functional coverage
- Cross coverage
- SystemVerilog Assertions
- Directed tests
- Corner-case tests
- Code coverage
- Assertion coverage
- Regression testing
- QuestaSim automation scripts
- Simulation logs
- Coverage reports
- Verification results
- Waveform analysis

The objective of this project is to demonstrate a complete **RTL Design and Functional Verification flow**, from RTL implementation to simulation, self-checking, coverage analysis, assertion checking, and regression.

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
16. Run code coverage.
17. Run assertion coverage.
18. Automate simulations using QuestaSim `.do` scripts.
19. Verify scoreboard error-detection capability using intentional mismatch tests.
20. Perform regression testing for verification closure.

---

# Memory Specification

| Parameter | Specification |
|---|---|
| Memory Type | Single-Port Synchronous Memory |
| Memory Capacity | **1 KB** |
| Data Width | **32 bits** |
| Data Width | **4 Bytes** |
| Memory Depth | **256 Words** |
| Address Width | **8 bits** |
| Address Range | `0` to `255` |
| Clock | Positive Edge Triggered |
| Reset | Active-High Synchronous Reset |
| Interface | `valid/ready` handshake |
| RTL Language | Verilog HDL |
| Verification Language | SystemVerilog |
| Simulator | QuestaSim / ModelSim |

---

# Memory Size Calculation

```text
Memory Capacity = Number of Locations × Data Width

                = 256 × 32 bits

                = 8192 bits

                = 1024 Bytes

                = 1 KB
```

---
## Verification Architecture

The testbench is structured following standard layered verification methodology:

* **Transaction (`mem_tx`):** Defines write/read operations, randomized address, data, and delay constraints.
* **Generator:** Creates randomized stimulus sequences (single write/read, back-to-back, boundary addresses).
* **Driver / BFM:** Drives pin-level transitions onto the DUT interface complying with the `valid`/`ready` protocol.
* **Monitor:** Passively captures interface activity on clock edges and converts pin-level activity to transactions.
* **Scoreboard & Reference Model:** Uses an associative array (`bit [31:0] ref_mem[bit [7:0]]`) to dynamically check DUT read output against expected data.
* **Coverage Collector:** Evaluates functional coverage bins across address spaces, data patterns, and cross coverage (`addr x op`).
* **Assertions (SVA):** Monitors interface protocol compliance (handshake setup/hold, reset behavior, write-enable checks).

---

## Key Test Scenarios
* **Reset Check:** Verification of output bus stability and internal state during active reset.
* **Single & Burst Read/Write:** Verification of basic access cycles and back-to-back operations without idle cycles.
* **Boundary & Corner Cases:** Read/write operations at `0x00`, `0xFF`, alternating address patterns (`0xAA`, `0x55`), and unwritten address reads.
* **Handshake Stalls:** Handling randomized `ready` de-assertions and `valid` stalls.
* **Intentional Mismatch Test:** Injected corrupt reference data to verify scoreboard detection and error reporting capabilities.

---

## Verification Results

* **Functional Coverage:** Achieved **100%** coverage across all address bins, operation types (`READ`, `WRITE`, `IDLE`), and cross-coverage metrics (`address_bins x operation`).
* **Code Coverage:** Achieved **100% Statement, Branch, Condition, and Toggle Coverage** on the RTL memory block.
* **Assertion Coverage:** All SVA checks passed with zero violations across 10,000+ randomized transaction cycles.
* **Scoreboard Verification:** Self-checking scoreboard reported **0 Mismatches** during baseline regression runs, and correctly flagged 100% of injected faults during error-injection test runs.

---

## Simulation & How to Run

Simulations are automated using QuestaSim/ModelSim macro `.do` scripts.

### Run with QuestaSim CLI:
```bash
# Clone the repository
git clone [https://github.com/akash-290605/memory_design_systemverilog_verification.git](https://github.com/akash-290605/memory_design_systemverilog_verification.git)
cd memory_design_systemverilog_verification/sim

# Run compile and regression script
vsim -c -do run_sim.do
