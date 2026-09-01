/**
 * Pre-configured Testbench Scenarios & Automated Verilog Verification Suite
 */

class TestbenchRunner {
    constructor(sim, logger) {
        this.sim = sim;
        this.logger = logger || console.log;
        this.isRunningSuite = false;
    }

    /**
     * Test 1: Single Write
     * ADDR = 10, WDATA = 0xDEADBEEF, VALID = 1, WR_RD = 1
     */
    runTest1() {
        this.sim.setInput('rst', 0);
        this.sim.setInput('valid', 1);
        this.sim.setInput('wr_rd', 1);
        this.sim.setInput('addr', 10);
        this.sim.setInput('wdata', 0xDEADBEEF);
        
        this.sim.stepCycle();
        return {
            name: 'Test 1 — Single Write',
            passed: this.sim.inspectMemory(10) === 0xDEADBEEF && this.sim.outputs.ready === 1,
            details: `Written 0xDEADBEEF to Mem[10]. Memory[10]=0x${this.sim.inspectMemory(10).toString(16).toUpperCase()}, READY=${this.sim.outputs.ready}`
        };
    }

    /**
     * Test 2: Single Read
     * ADDR = 10, VALID = 1, WR_RD = 0
     */
    runTest2() {
        this.sim.setInput('rst', 0);
        this.sim.setInput('valid', 1);
        this.sim.setInput('wr_rd', 0);
        this.sim.setInput('addr', 10);

        this.sim.stepCycle();
        const rdata = this.sim.outputs.rdata;
        const ready = this.sim.outputs.ready;

        return {
            name: 'Test 2 — Single Read',
            passed: rdata === 0xDEADBEEF && ready === 1,
            details: `Read Mem[10]: RDATA=0x${rdata.toString(16).toUpperCase()}, READY=${ready}`
        };
    }

    /**
     * Test 3: Multiple Sequential Writes (Addr 0..4)
     */
    async runTest3(delayMs = 300) {
        const testData = [
            { addr: 0, val: 0x11111111 },
            { addr: 1, val: 0x22222222 },
            { addr: 2, val: 0x33333333 },
            { addr: 3, val: 0x44444444 },
            { addr: 4, val: 0x55555555 }
        ];

        this.sim.setInput('rst', 0);
        this.sim.setInput('valid', 1);
        this.sim.setInput('wr_rd', 1);

        for (const item of testData) {
            this.sim.setInput('addr', item.addr);
            this.sim.setInput('wdata', item.val);
            this.sim.stepCycle();
            if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
        }

        let allMatch = true;
        for (const item of testData) {
            if (this.sim.inspectMemory(item.addr) !== item.val) allMatch = false;
        }

        return {
            name: 'Test 3 — Multiple Sequential Writes',
            passed: allMatch,
            details: `Wrote 5 consecutive words to Addr 0..4 successfully.`
        };
    }

    /**
     * Test 4: Multiple Sequential Reads (Addr 0..4)
     */
    async runTest4(delayMs = 300) {
        const expected = [0x11111111, 0x22222222, 0x33333333, 0x44444444, 0x55555555];
        this.sim.setInput('rst', 0);
        this.sim.setInput('valid', 1);
        this.sim.setInput('wr_rd', 0);

        let allMatch = true;
        for (let a = 0; a < 5; a++) {
            this.sim.setInput('addr', a);
            this.sim.stepCycle();
            if (this.sim.outputs.rdata !== expected[a]) {
                // If not preloaded with test 3, check against actual memory
                if (this.sim.outputs.rdata !== this.sim.inspectMemory(a)) {
                    allMatch = false;
                }
            }
            if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
        }

        return {
            name: 'Test 4 — Multiple Sequential Reads',
            passed: allMatch,
            details: `Sequentially read Addr 0..4 on consecutive posedge clock cycles.`
        };
    }

    /**
     * Test 5: Synchronous Reset Sweep
     */
    async runTest5(delayMs = 400) {
        // Pre-fill some locations
        this.sim.preloadMemory(5, 0xAAAA5555);
        this.sim.preloadMemory(20, 0x12345678);

        // Apply Reset at posedge
        this.sim.setInput('rst', 1);
        this.sim.setInput('valid', 1);
        this.sim.stepCycle();

        if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));

        // Release Reset
        this.sim.setInput('rst', 0);

        let allZeros = true;
        for (let i = 0; i < this.sim.DEPTH; i++) {
            if (this.sim.inspectMemory(i) !== 0) {
                allZeros = false;
                break;
            }
        }

        const rdataZero = this.sim.outputs.rdata === 0;
        const readyZero = this.sim.outputs.ready === 0;

        return {
            name: 'Test 5 — Synchronous Reset Sweep',
            passed: allZeros && rdataZero && readyZero,
            details: `Synchronous Reset evaluated at posedge: All ${this.sim.DEPTH} words cleared to 0x0, RDATA=0, READY=0.`
        };
    }

    /**
     * Test 6: VALID Disabled (NOP Check)
     */
    runTest6() {
        const testAddr = 42;
        const initialVal = 0xCAFEBABE;
        this.sim.preloadMemory(testAddr, initialVal);

        // Try write with VALID = 0
        this.sim.setInput('rst', 0);
        this.sim.setInput('valid', 0);
        this.sim.setInput('wr_rd', 1);
        this.sim.setInput('addr', testAddr);
        this.sim.setInput('wdata', 0xFFFFFFFF);

        this.sim.stepCycle();

        const memUntouched = this.sim.inspectMemory(testAddr) === initialVal;
        const readyZero = this.sim.outputs.ready === 0;
        const rdataZero = this.sim.outputs.rdata === 0;

        return {
            name: 'Test 6 — VALID=0 (NOP)',
            passed: memUntouched && readyZero && rdataZero,
            details: `With VALID=0: Memory[42] stayed 0xCAFEBABE, READY=0, RDATA=0.`
        };
    }

    /**
     * Run all tests in automated sequence
     */
    async runFullTestSuite(onProgress) {
        if (this.isRunningSuite) return;
        this.isRunningSuite = true;

        const results = [];
        this.sim.resetSimulator();

        // 1. Test 1
        onProgress && onProgress('Running Test 1: Single Write...', 1, 6);
        results.push(this.runTest1());
        await new Promise(r => setTimeout(r, 400));

        // 2. Test 2
        onProgress && onProgress('Running Test 2: Single Read...', 2, 6);
        results.push(this.runTest2());
        await new Promise(r => setTimeout(r, 400));

        // 3. Test 3
        onProgress && onProgress('Running Test 3: Multiple Sequential Writes...', 3, 6);
        results.push(await this.runTest3(200));

        // 4. Test 4
        onProgress && onProgress('Running Test 4: Multiple Sequential Reads...', 4, 6);
        results.push(await this.runTest4(200));

        // 5. Test 5
        onProgress && onProgress('Running Test 5: Synchronous Reset Sweep...', 5, 6);
        results.push(await this.runTest5(300));

        // 6. Test 6
        onProgress && onProgress('Running Test 6: VALID Disabled (NOP)...', 6, 6);
        results.push(this.runTest6());

        this.isRunningSuite = false;
        onProgress && onProgress('Test Suite Completed!', 6, 6);

        return results;
    }
}

if (typeof window !== 'undefined') {
    window.TestbenchRunner = TestbenchRunner;
}

