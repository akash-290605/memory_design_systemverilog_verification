# 📈 Simulation Waveform Analysis & Protocol Verification

This document provides a detailed breakdown of the cycle-accurate simulation waveforms captured in *Siemens QuestaSim* for the [memory_design_systemverilog_verification](../) project.

---

## 🎯 Purpose of Waveform Analysis

- ⏱️ **Cycle-Accurate Signal Integrity:** Verifies clock-to-data setup/hold relationships, control signal assertion/deassertion timings, and synchronous interface handshakes.
- 🔍 **State & Dataflow Tracing:** Visually confirms that transactions generated in the verification environment accurately reflect across physical RTL pins (`clk`, `rst_n`, `wr_en`, `rd_en`, `addr`, `wdata`, and `rdata`).
- 🐞 **Visual Bug Localization:** Correlates scoreboard transaction logs with raw pin-level activity to inspect edge-case behaviors, such as back-to-back read/write operations and reset clearing.

---

## 📸 Verification & Waveform Traces

### 🔹 1. Coverage Analysis
![Coverage Output](coverage/output_image.png)

- 📊 **Metric Tracking:** Highlights code coverage, functional coverage, and cross-coverage metrics achieved during test suite execution.

---

### 🔹 2. Protocol Assertions Verification
![Assertions Output](assertions/assertion_nwrite_nread.png)

- 🛡️ **Assertion Checks:** Demonstrates Concurrent and Immediate SVA (SystemVerilog Assertions) validating handshake integrity and setup/hold timing rules without failures.

---

### 🔹 3. Simulation Waveforms
![Waveform Output](waveforms/output_image.png)

- 🔄 **Read/Write Behavior:** Confirms synchronous transactions, correct address mapping, stable data lines, and expected read latency on `rdata`.

---

## 📊 Summary of Waveform Verification

| Interface Signal | Type | Protocol Behavior | Timing Rule | Status |
| :--- | :--- | :--- | :--- | :--- |
| `clk` | Input | System Clock (100 MHz) | 50% Duty Cycle | ✅ Stable |
| `rst_n` | Input | Active-Low Reset Release | Deasserted on Clock Edge | ✅ Verified |
| `wr_en` | Input | Active-High Write Strobe | Mutually exclusive with IDLE | ✅ Verified |
| `rd_en` | Input | Active-High Read Strobe | Triggers 1-cycle latency read | ✅ Verified |
| `addr` | Input | Target Memory Address ($0 \text{ to } 2^N - 1$) | Stable during active enable | ✅ Verified |
| `wdata` | Input | Write Data Bus | Valid during `wr_en = 1` | ✅ Verified |
| `rdata` | Output | Read Data Bus | Valid 1 cycle after `rd_en = 1` | ✅ Verified |
