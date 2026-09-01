# Assertion Verification Reports

This directory documents the SystemVerilog Assertion (SVA) checks, protocol validation results, and formal/simulation-based assertion metrics for the memory design verification suite.

---

## 📌 Pinned Reports

* **[final_assertion_report/](./final_assertion_report/)**  
  Contains the comprehensive, consolidated assertion summary and coverage database across all integrated test runs.
  * **[assertion_coverage.ucdb](./final_assertion_report/assertion_coverage.ucdb)** — Unified Coverage Database (UCDB) binary file storing cumulative assertion and functional coverage metrics for EDA tool analysis (e.g., Questa/ModelSim).
  * **[assertion_coverage_report.txt](./final_assertion_report/assertion_coverage_report.txt)** — Plain-text human-readable export detailing pass/fail counts, property evaluation metrics, and overall assertion coverage percentages.

* **[other_assertion_report/](./other_assertion_report/)**  
  Contains scenario-specific assertion logs, standalone interface checks, and intermediate debug traces generated during individual test runs.

---

## Verification Scope & Explanation

**1. Protocol & Interface Checks**
* Verifies read and write enable timing, valid/ready handshakes, and setup/hold requirements.
* Confirms that address and data buses maintain stability during active transactions.

**2. Data Integrity Checks**
* Validates that write operations store the exact expected values into the specified memory locations.
* Ensures subsequent read operations retrieve the correct stored data without latency or bit corruption issues.

**3. Boundary & Corner Cases**
* Validates assertion behavior during simultaneous access attempts, resets, and out-of-range addressing.
* Confirms that undefined states (`X` or `Z`) do not propagate across control signals.
