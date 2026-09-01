# Verification Reports Overview

This directory contains the verification artifacts, coverage databases, and assertion logs generated during the functional verification of the memory design.

---

## 📁 Directory Structure & Key Deliverables

* **[assertions/](./assertions/)** — Houses SystemVerilog Assertion (SVA) tracking and protocol validation logs.
  * **[final_assertion_report/](./assertions/final_assertion_report/)** — Top-level assertion summary and consolidated metrics.
    * **[assertion_coverage.ucdb](./assertions/final_assertion_report/assertion_coverage.ucdb)** — Aggregated binary UCDB file for EDA tool analysis (Questa/ModelSim).
    * **[assertion_coverage_report.txt](./assertions/final_assertion_report/assertion_coverage_report.txt)** — Plain-text report detailing pass/fail counts, property evaluations, and coverage scores.
  * **[other_assertion_report/](./assertions/other_assertion_report/)** — Granular, scenario-specific assertion logs and individual debug traces.

* **[coverage/](./coverage/)** — Contains structural code coverage and functional coverage results.
  * **[final_coverage_report/](./coverage/final_coverage_report/)** — Cumulative merged coverage database across all test cases.
    * **[final_coverage.ucdb](./coverage/final_coverage_report/final_coverage.ucdb)** — Merged UCDB database capturing comprehensive code and functional covergroup metrics.
    * **[coverage_summary.txt](./coverage/final_coverage_report/coverage_summary.txt)** — Plain-text executive summary highlighting total coverage percentages and hit/miss bins.
  * **[other_coverage_report/](./coverage/other_coverage_report/)** — Individual test suite logs, run-level coverage metrics, and raw simulator dumps.

---

## Verification Scope & Objectives

**1. SystemVerilog Assertions (SVA)**
* Verifies read/write protocol compliance, handshake stability, and timing constraints.
* Tracks reset behavior, illegal address access, and data bus integrity.

**2. Functional Coverage**
* Ensures complete stimulus distribution across memory address spaces (low, medium, high boundaries).
* Validates transaction patterns including single accesses, back-to-back operations, alternating reads/writes, and burst transfers.

**3. Code Coverage**
* Measures statement, branch, condition, toggle, and FSM transition coverage across the memory RTL.
