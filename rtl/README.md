# Single-Port Synchronous Memory RTL Specification

## 📋 Memory Specifications

* **Memory Architecture:** Single-Port Synchronous RAM with Handshake (`valid` / `ready`)
* **Data Width (`WIDTH`):** 32 bits (4 bytes per word)
* **Memory Depth (`DEPTH`):** 256 words (1 KB total storage)
* **Address Width (`ADDR_WIDTH`):** 8 bits ($\log_2(256) = 8$)
* **Clocking & Reset:** Synchronous operations on `posedge clk`, Active-High synchronous reset (`rst == 1`)

---

## 📌 Signal Interface & Pin Descriptions

| Signal Name | Direction | Width | Description |
| :--- | :---: | :---: | :--- |
| `clk` | **Input** | `1` | **System Clock**: Synchronizes all read, write, and reset operations on the rising edge. |
| `rst` | **Input** | `1` | **Active-High Synchronous Reset**: Clears the entire memory array (`mem`), resets output `rdata` to `0`, and deasserts `ready` to `0`. |
| `wr_rd` | **Input** | `1` | **Write/Read Mode Select**: Determines operation mode when `valid == 1`. <br>• `1'b1`: **Write operation** (`mem[addr] <= wdata`) <br>• `1'b0`: **Read operation** (`rdata <= mem[addr]`) |
| `valid` | **Input** | `1` | **Transaction Request / Enable**: Asserted high by the master to initiate a valid memory transaction. |
| `addr` | **Input** | `ADDR_WIDTH` (8 bits) | **Address Bus**: Selects the target memory word index (`0` to `255`). |
| `wdata` | **Input** | `WIDTH` (32 bits) | **Write Data Bus**: Data word driven into the memory array during write cycles. |
| `rdata` | **Output** | `WIDTH` (32 bits) | **Read Data Bus**: Registered data word read from memory. Cleared to `0` when idle, during reset, or during write cycles. |
| `ready` | **Output** | `1` | **Acknowledge / Handshake**: Asserted high for 1 cycle when `valid == 1` to confirm completion of a read/write operation. |

---

## ⚙️ How It Works (Functional Operation)

### 1. Synchronous Reset (`rst == 1`)
* Evaluated synchronously on `posedge clk`.
* Clears all 256 words in the internal storage array `mem` to `0`.
* Clears `rdata` to `0` and pulls `ready` low (`0`).

### 2. Write Operation (`rst == 0`, `valid == 1`, `wr_rd == 1`)
* On `posedge clk`, `wdata` is written to `mem[addr]`.
* `ready` asserts high (`1'b1`) for that clock cycle to acknowledge write completion.
* `rdata` is driven to `0`.

### 3. Read Operation (`rst == 0`, `valid == 1`, `wr_rd == 0`)
* On `posedge clk`, data from `mem[addr]` is fetched into the output register `rdata`.
* `ready` asserts high (`1'b1`) for that clock cycle.

### 4. Idle State (`rst == 0`, `valid == 0`)
* `ready` stays deasserted (`0`).
* `rdata` defaults to `0`.
* No changes occur in the memory array.

---

## ⏱️ Operation Truth Table

| `rst` | `valid` | `wr_rd` | Operation | Memory Array Action | `rdata` Output | `ready` Output |
| :---: | :---: | :---: | :--- | :--- | :---: | :---: |
| `1` | `X` | `X` | **Reset** | `mem[0:255] <= 0` | `32'd0` | `1'b0` |
| `0` | `0` | `X` | **Idle** | Unchanged | `32'd0` | `1'b0` |
| `0` | `1` | `1` | **Write** | `mem[addr] <= wdata` | `32'd0` | `1'b1` |
| `0` | `1` | `0` | **Read** | Unchanged | `mem[addr]` | `1'b1` |
