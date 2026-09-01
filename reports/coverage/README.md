# Functional & Code Coverage Reports

This directory documents the structural code coverage (line, branch, condition, toggle, FSM) and functional covergroup metrics collected during the memory design verification.

---

## 📌 Pinned Reports

* **[final_coverage_report/](./final_coverage_report/)**  
  Contains the cumulative, merged coverage database and top-level summary across all constrained-random and targeted test cases.
  * **[final_coverage.ucdb](./final_coverage_report/final_coverage.ucdb)** — Unified Coverage Database (UCDB) binary file aggregating code and functional coverage for EDA analysis tools (e.g., Questa/ModelSim).
  * **[coverage_summary.txt](./final_coverage_report/coverage_summary.txt)** — Plain-text executive summary detailing overall coverage percentages, hit bins, and coverage hole analysis.

* **[other_coverage_report/](./other_coverage_report/)**  
  Contains test-specific, unmerged coverage logs and individual scenario coverage reports generated per simulation run.

---

## Verification Scope & Coverage Metrics

**1. Functional Coverage (Covergroups & Bins)**
* Verifies memory address space coverage across low, medium, and high boundary zones.
* Validates transaction patterns including single read/write, back-to-back operations, alternating access, and burst transfers.
* Tracks control signal combinations and cross-coverage between operation modes and data patterns.

**2. Code Coverage Metrics**
* **Statement/Line Coverage:** Ensures all executable lines across the memory RTL are exercised.
* **Branch & Decision Coverage:** Validates `if-else` and `case` decision branches.
* **Toggle Coverage:** Verifies that every bit in control, address, and data vectors switches through both `0 -> 1` and `1 -> 0` transitions.
* **FSM Coverage:** Validates all state reachability and valid state-to-state transitions.
