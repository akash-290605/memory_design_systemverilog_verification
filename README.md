
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
