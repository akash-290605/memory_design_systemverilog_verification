/**
 * Hardware-accurate Simulation Engine for Verilog Synchronous Single-Port Memory
 * 
 * Verilog Specification:
 * `define WIDTH 32
 * `define DEPTH 256
 * `define ADDR_WIDTH $clog2(`DEPTH) // 8 bits (0 to 255)
 */

class MemorySimulator {
    constructor(depth = 256, width = 32, addrWidth = 8) {
        this.DEPTH = depth;
        this.WIDTH = width;
        this.ADDR_WIDTH = addrWidth;
        this.MAX_ADDR = depth - 1; // 255
        this.MAX_DATA = 0xFFFFFFFF; // 32-bit unsigned

        // Internal Memory Array (256 words x 32-bit)
        this.mem = new Uint32Array(this.DEPTH);

        // Current Input Signals (held stable before clock edge)
        this.inputs = {
            rst: 0,
            wr_rd: 0, // 0 = READ, 1 = WRITE
            valid: 0, // 0 = Idle, 1 = Accept operation
            addr: 0,  // 0 to 255 (8-bit)
            wdata: 0  // 32-bit unsigned
        };

        // Current Output Registers (updated strictly on posedge clk)
        this.outputs = {
            rdata: 0,
            ready: 0
        };

        // Clock State (0 = Low, 1 = High)
        this.clk = 0;
        this.cycle = 0;

        // Metadata Tracking
        this.modifiedAddresses = new Set();
        this.addressLastModifiedCycle = new Map();
        this.lastAction = {
            type: 'INIT',
            description: 'Simulator initialized (256 words x 32-bit, 8-bit ADDR)',
            cycle: 0,
            addr: 0,
            wdata: 0,
            rdata: 0,
            ready: 0
        };

        // Simulation History for Time Travel & Waveform
        this.history = [];
        this.listeners = [];

        // Save initial cycle 0 snapshot
        this.recordSnapshot('INIT');
    }

    /**
     * Subscribe to simulation state changes
     */
    addListener(fn) {
        this.listeners.push(fn);
    }

    notify(eventType, data = {}) {
        for (const fn of this.listeners) {
            try {
                fn(eventType, this.getState(), data);
            } catch (e) {
                console.error("Simulation listener error:", e);
            }
        }
    }

    /**
     * Set Input Signals (validates bounds for 8-bit address 0..255)
     */
    setInput(name, value) {
        let cleanVal = Number(value);
        if (isNaN(cleanVal)) cleanVal = 0;

        switch (name) {
            case 'rst':
                this.inputs.rst = cleanVal ? 1 : 0;
                break;
            case 'wr_rd':
                this.inputs.wr_rd = cleanVal ? 1 : 0;
                break;
            case 'valid':
                this.inputs.valid = cleanVal ? 1 : 0;
                break;
            case 'addr':
                this.inputs.addr = Math.max(0, Math.min(this.MAX_ADDR, Math.floor(cleanVal) >>> 0));
                break;
            case 'wdata':
                this.inputs.wdata = cleanVal >>> 0; // Ensure 32-bit unsigned
                break;
            default:
                console.warn(`Unknown input port: ${name}`);
                return;
        }

        this.notify('INPUT_CHANGE', { port: name, value: this.inputs[name] });
    }

    /**
     * Toggle Clock State (0 -> 1 triggers posedge_clk)
     */
    toggleClk() {
        if (this.clk === 0) {
            this.posedgeClk();
        } else {
            this.negedgeClk();
        }
    }

    /**
     * Perform Negative Clock Edge (1 -> 0)
     */
    negedgeClk() {
        this.clk = 0;
        this.notify('NEGEDGE', { clk: 0, cycle: this.cycle });
    }

    /**
     * Perform Positive Clock Edge (0 -> 1)
     * Models exact Verilog:
     * always @(posedge clk) begin
     *     if(rst==1) begin
     *         rdata <= `WIDTH'd0;
     *         ready <= 1'b0;
     *         for(integer i=0;i<`DEPTH;i=i+1) mem[i] <= 8'd0;
     *     end
     *     else begin
     *         rdata <= `WIDTH'd0;
     *         ready <= 1'b0;
     *         if(valid==1) begin
     *             ready <= 1'b1;
     *             if(wr_rd==1)
     *                 mem[addr] <= wdata;
     *             else
     *                 rdata <= mem[addr];
     *         end
     *         else
     *             ready <= 1'b0;
     *     end
     * end
     */
    posedgeClk() {
        this.clk = 1;
        this.cycle += 1;

        // Sample inputs prior to clock edge (Verilog nonblocking semantics)
        const { rst, wr_rd, valid, addr, wdata } = this.inputs;

        let nextRdata = 0;
        let nextReady = 0;
        let actionType = 'NOP';
        let actionDesc = '';
        let modifiedAddr = null;
        let prevMemVal = 0;
        let readVal = 0;

        if (rst === 1) {
            // Synchronous Reset Branch
            nextRdata = 0;
            nextReady = 0;
            
            // Clear entire 256-word memory
            this.mem.fill(0);
            this.modifiedAddresses.clear();
            this.addressLastModifiedCycle.clear();

            actionType = 'RESET';
            actionDesc = `RESET active: All 256 memory words cleared to 0x0, RDATA <= 0, READY <= 0`;
        } else {
            // Normal Operation
            nextRdata = 0;
            nextReady = 0;

            if (valid === 1) {
                nextReady = 1;

                if (wr_rd === 1) {
                    // WRITE Operation
                    prevMemVal = this.mem[addr];
                    this.mem[addr] = wdata;
                    this.modifiedAddresses.add(addr);
                    this.addressLastModifiedCycle.set(addr, this.cycle);
                    modifiedAddr = addr;
                    actionType = 'WRITE';
                    actionDesc = `WRITE: MEM[0x${addr.toString(16).toUpperCase().padStart(2, '0')} (${addr})] <= 0x${wdata.toString(16).toUpperCase().padStart(8, '0')}`;
                } else {
                    // READ Operation
                    readVal = this.mem[addr];
                    nextRdata = readVal;
                    actionType = 'READ';
                    actionDesc = `READ: RDATA <= MEM[0x${addr.toString(16).toUpperCase().padStart(2, '0')} (${addr})] = 0x${readVal.toString(16).toUpperCase().padStart(8, '0')}`;
                }
            } else {
                // VALID == 0 (Idle / No Operation)
                nextReady = 0;
                actionType = 'NOP';
                actionDesc = `NOP (VALID=0): No operation performed, READY <= 0, RDATA <= 0`;
            }
        }

        // Apply nonblocking updates to output registers
        this.outputs.rdata = nextRdata >>> 0;
        this.outputs.ready = nextReady ? 1 : 0;

        this.lastAction = {
            type: actionType,
            description: actionDesc,
            cycle: this.cycle,
            addr,
            wdata,
            rdata: this.outputs.rdata,
            ready: this.outputs.ready,
            modifiedAddr,
            prevMemVal,
            readVal
        };

        // Snapshot state for waveform and time travel
        this.recordSnapshot(actionType);

        // Notify UI components
        this.notify('POSEDGE', {
            cycle: this.cycle,
            clk: 1,
            action: this.lastAction
        });
    }

    /**
     * Execute a full clock pulse (Low -> Posedge -> High -> Negedge -> Low)
     */
    stepCycle() {
        this.clk = 0;
        this.posedgeClk();
        this.negedgeClk();
    }

    /**
     * Record immutable snapshot for cycle history & waveform
     */
    recordSnapshot(actionType) {
        const snapshot = {
            cycle: this.cycle,
            clk: this.clk,
            inputs: { ...this.inputs },
            outputs: { ...this.outputs },
            action: { ...this.lastAction },
            modifiedAddresses: Array.from(this.modifiedAddresses),
            memDelta: this.getNonZeroMemMap(),
            timestamp: Date.now()
        };

        this.history.push(snapshot);
        if (this.history.length > 2000) {
            this.history.shift();
        }
    }

    /**
     * Returns a sparse map of all non-zero memory entries
     */
    getNonZeroMemMap() {
        const map = new Map();
        for (const addr of this.modifiedAddresses) {
            const val = this.mem[addr];
            if (val !== 0) {
                map.set(addr, val);
            }
        }
        return map;
    }

    /**
     * Jump / Time Travel to a specific cycle snapshot
     */
    jumpToCycle(targetCycle) {
        const snap = this.history.find(h => h.cycle === targetCycle);
        if (!snap) return false;

        this.cycle = snap.cycle;
        this.clk = snap.clk;
        this.inputs = { ...snap.inputs };
        this.outputs = { ...snap.outputs };
        this.lastAction = { ...snap.action };

        // Reconstruct memory from snapshot
        this.mem.fill(0);
        this.modifiedAddresses = new Set(snap.modifiedAddresses);
        if (snap.memDelta) {
            for (const [addr, val] of snap.memDelta.entries()) {
                this.mem[addr] = val;
            }
        }

        this.notify('TIME_TRAVEL', { cycle: this.cycle, snapshot: snap });
        return true;
    }

    /**
     * Direct memory read (inspect without side effects)
     */
    inspectMemory(addr) {
        if (addr < 0 || addr >= this.DEPTH) return 0;
        return this.mem[addr] >>> 0;
    }

    /**
     * Direct memory write for testbench / preload
     */
    preloadMemory(addr, value) {
        if (addr >= 0 && addr < this.DEPTH) {
            this.mem[addr] = value >>> 0;
            if (value !== 0) {
                this.modifiedAddresses.add(addr);
            } else {
                this.modifiedAddresses.delete(addr);
            }
            this.notify('MEMORY_DIRECT_WRITE', { addr, value });
        }
    }

    /**
     * Reset the entire simulation state back to Cycle 0
     */
    resetSimulator() {
        this.mem.fill(0);
        this.inputs = { rst: 0, wr_rd: 0, valid: 0, addr: 0, wdata: 0 };
        this.outputs = { rdata: 0, ready: 0 };
        this.clk = 0;
        this.cycle = 0;
        this.modifiedAddresses.clear();
        this.addressLastModifiedCycle.clear();
        this.lastAction = {
            type: 'INIT',
            description: 'Simulator reset (DEPTH=256, WIDTH=32, ADDR_WIDTH=8)',
            cycle: 0,
            addr: 0,
            wdata: 0,
            rdata: 0,
            ready: 0
        };
        this.history = [];
        this.recordSnapshot('INIT');
        this.notify('SIMULATOR_RESET', {});
    }

    /**
     * Get Complete State Object
     */
    getState() {
        return {
            DEPTH: this.DEPTH,
            WIDTH: this.WIDTH,
            ADDR_WIDTH: this.ADDR_WIDTH,
            clk: this.clk,
            cycle: this.cycle,
            inputs: { ...this.inputs },
            outputs: { ...this.outputs },
            lastAction: { ...this.lastAction },
            modifiedCount: this.modifiedAddresses.size,
            historyLength: this.history.length
        };
    }
}

if (typeof window !== 'undefined') {
    window.MemorySimulator = MemorySimulator;
}
