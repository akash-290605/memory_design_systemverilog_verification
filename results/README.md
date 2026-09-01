# 📈 Simulation Waveform Analysis & Protocol Verification

This document provides a detailed breakdown of the cycle-accurate simulation waveforms captured in **Siemens QuestaSim** for the [memory_design_systemverilog_verification](https://github.com/akash-290605/memory_design_systemverilog_verification) project.

---

## 🎯 Purpose of Waveform Analysis

* ⏱️ **Cycle-Accurate Signal Integrity:** Verifies clock-to-data setup/hold relationships, control signal assertion/deassertion timings, and synchronous interface handshakes.
* 🔍 **State & Dataflow Tracing:** Visually confirms that transactions generated in the verification environment accurately reflect across physical RTL pins (`clk`, `rst_n`, `wr_en`, `rd_en`, `addr`, `wdata`, and `rdata`).
* 🐞 **Visual Bug Localization:** Correlates scoreboard transaction logs with raw pin-level activity to inspect edge-case behaviors, such as back-to-back read/write operations and reset clearing.

---

## 📸 Waveform Traces & Timing Analysis

### 🔹 1. Power-On Reset & Initialization Phase
Validates that the memory controller synchronously initializes all internal registers and holds the output data bus in a high-impedance or deterministic default state upon active-low reset assertion (`rst_n = 0`).

<p align="center">
  <img src="./waveform_reset_initialization.png" alt="Reset and Initialization Waveform" width="100%">
</p>

* 🔄 **Behavior:** When `rst_n` is driven low, read/write enables are masked.
* ⚡ **Post-Reset:** Once `rst_n` is released high on the rising clock edge, the interface safely transitions to `IDLE` state.

---

### 🔹 2. Synchronous Write Operation (`wr_en = 1`)
Illustrates single and burst write operations where target memory addresses are populated with randomized data vectors.

<p align="center">
  <img src="./waveform_write_operation.png" alt="Write Operation Waveform" width="100%">
</p>

* ✍️ **Protocol Check:** `addr` and `wdata` are driven synchronously on the positive clock edge when `wr_en` is high.
* 🔒 **Data Stability:** Setup and hold times are strictly satisfied via the virtual interface clocking block (`driver_cb`).

---

### 🔹 3. Synchronous Read Operation & Latency (`rd_en = 1`)
Demonstrates read transaction execution, highlighting read latency cycles and data validity windows on `rdata`.

<p align="center">
  <img src="./waveform_read_operation.png" alt="Read Operation Waveform" width="100%">
</p>

* 📖 **Latency Check:** Captured `rdata` becomes valid exactly 1 cycle after `rd_en` and `addr` are applied.
* ⚖️ **Scoreboard Match:** The monitor samples `rdata` via `monitor_cb` and passes it to the scoreboard, matching 100% with the reference model.

---

### 🔹 4. Back-to-Back & Corner-Case Transactions
Exhibits continuous alternating write-then-read bursts, boundary address accesses (`0x00`, `0xFF`), and simultaneous operation prevention.

<p align="center">
  <img src="./waveform_back_to_back_transactions.png" alt="Back-to-Back Transactions Waveform" width="100%">
</p>

---

## 📊 Summary of Waveform Verification

| Interface Signal | Type | Protocol Behavior | Timing Rule | Status |
| :--- | :---: | :--- | :--- | :---: |
| `clk` | Input | System Clock (100 MHz) | 50% Duty Cycle | ✅ Stable |
| `rst_n` | Input | Active-Low Asynchronous / Synchronous Release | Deasserted on Clock Edge | ✅ Verified |
| `wr_en` | Input | Active-High Write Strobe | Mutually exclusive with IDLE | ✅ Verified |
| `rd_en` | Input | Active-High Read Strobe | Triggers 1-cycle latency read | ✅ Verified |
| `addr` | Input | Target Memory Address ($0$ to $2^{N}-1$) | Stable during active enable | ✅ Verified |
| `wdata` | Input | Write Data Bus | Valid during `wr_en = 1` | ✅ Verified |
| `rdata` | Output | Read Data Bus | Valid 1 cycle after `rd_en = 1` | ✅ Verified |
