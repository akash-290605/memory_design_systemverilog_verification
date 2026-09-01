# Simulation & Verification Scripts

This directory contains QuestaSim/ModelSim automation do-scripts (`.do`) used to compile, simulate, run regressions, and extract coverage and assertion metrics for the Memory Verification environment.

---

## Script Overview

| Script Name | Purpose | Execution Scope |
| :--- | :--- | :--- |
| `run_sim.do` | Runs basic functional simulation and waveform debugging. | Single Test |
| `run_cc.do` | Compiles with coverage flags and collects code coverage for an individual test. | Single Test |
| `run_all_cc.do` | Executes the complete test suite, merges coverage databases, and generates coverage reports. | Regression (All Tests) |
| `run_as.do` | Enables and checks SystemVerilog Assertions (SVA) and functional coverage for a single test. | Single Test |
| `run_all_assert.do` | Runs all test cases with full assertion verification and assertion coverage reporting. | Regression (All Tests) |

---

## Detailed File Breakdown

### 1. `run_sim.do`
* **Purpose:** Standard Functional Simulation.
* **Details:** 
  * Compiles the memory RTL and testbench files (`vlog`/`vcom`).
  * Optimizes the design and launches the simulator (`vsim`).
  * Opens the waveform viewer (`add wave -r /*`) and runs the simulation to completion.

### 2. `run_cc.do`
* **Purpose:** Single Test Code Coverage Collection.
* **Details:** 
  * Compiles the design with code coverage flags enabled (Statement, Branch, Condition, Expression, Toggle, FSM).
  * Runs a specific test case while recording coverage into a unified coverage database (`.ucdb`).

### 3. `run_all_cc.do`
* **Purpose:** Full Code Coverage Regression.
* **Details:** 
  * Sequentially executes all defined test cases in batch/command-line mode.
  * Merges all individual UCDB database files into a single cumulative coverage file (`vcover merge`).
  * Generates the final HTML/text code coverage report for sign-off analysis.

### 4. `run_as.do`
* **Purpose:** Assertion-Based Verification (Single Test).
* **Details:** 
  * Compiles RTL and TB with SVA (SystemVerilog Assertions) enabled (`-assertdebug`).
  * Runs the test while monitoring immediate and concurrent assertion pass/fail statuses.

### 5. `run_all_assert.do`
* **Purpose:** Full Assertion Regression & Coverage.
* **Details:** 
  * Executes all test suites to verify that no assertions trigger false failures across edge cases.
  * Measures assertion coverage to confirm all protocol rules and safety properties were exercised.

---

## How to Run

Execute any script inside QuestaSim/ModelSim transcript window:

```tcl
do script_name.do
