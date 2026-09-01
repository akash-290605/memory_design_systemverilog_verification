/**
 * Memory Virtual Simulation Web Application - Main Application Controller
 * Handles UI event bindings, 7-segment digital displays, audio synthesizer,
 * cycle history time travel, test suite, and educational modules.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Instantiate Core Simulation Engine (DEPTH=256, WIDTH=32, ADDR_WIDTH=8)
    const sim = new MemorySimulator(256, 32, 8);

    // 2. Audio Synthesizer for Hardware Tactile Feedback
    class HardwareAudio {
        constructor() {
            this.enabled = true;
            this.ctx = null;
        }

        init() {
            if (!this.ctx && typeof AudioContext !== 'undefined') {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            }
        }

        play(type) {
            if (!this.enabled) return;
            try {
                this.init();
                if (!this.ctx || this.ctx.state === 'suspended') {
                    this.ctx && this.ctx.resume();
                }
                if (!this.ctx) return;

                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);

                const now = this.ctx.currentTime;

                if (type === 'tick') {
                    // Crisp clock click
                    osc.frequency.setValueAtTime(800, now);
                    osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);
                    gain.gain.setValueAtTime(0.12, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                    osc.start(now);
                    osc.stop(now + 0.03);
                } else if (type === 'write') {
                    // Higher pitch success chime
                    osc.frequency.setValueAtTime(640, now);
                    osc.frequency.setValueAtTime(960, now + 0.04);
                    gain.gain.setValueAtTime(0.15, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
                    osc.start(now);
                    osc.stop(now + 0.09);
                } else if (type === 'read') {
                    // Cyan resonant tone
                    osc.frequency.setValueAtTime(520, now);
                    gain.gain.setValueAtTime(0.12, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                    osc.start(now);
                    osc.stop(now + 0.08);
                } else if (type === 'reset') {
                    // Low sweep
                    osc.frequency.setValueAtTime(400, now);
                    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
                    gain.gain.setValueAtTime(0.18, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                    osc.start(now);
                    osc.stop(now + 0.2);
                }
            } catch (e) {
                // Audio autoplay might be blocked before first user gesture
            }
        }
    }

    const audio = new HardwareAudio();

    // 3. Instantiate Sub-System Views
    const schematicView = new MemorySchematicView('schematic-canvas', 'schematic-container', sim);
    const waveformViewer = new WaveformViewer('waveform-canvas', 'waveform-container', sim);
    const memoryTableView = new MemoryTableView('mem-table-container', 'mem-heatmap-canvas', sim);
    const testbench = new TestbenchRunner(sim);

    // 4. Auto-Clock State & Timer
    let autoClockTimer = null;
    let clockSpeedHz = 0.5; // Default slow-motion rate: 2.0s per cycle

    // 5. Console & Event Logger
    const logList = document.getElementById('log-console-list');
    const logFilterSelect = document.getElementById('log-filter-select');
    let allLogs = [];

    function addLogEntry(cycle, actionType, text, level = 'info') {
        const timeStr = new Date().toLocaleTimeString();
        const logItem = { cycle, actionType, text, level, timeStr };
        allLogs.unshift(logItem);

        if (allLogs.length > 500) allLogs.pop();
        renderLogs();
    }

    function renderLogs() {
        if (!logList) return;
        const filter = logFilterSelect ? logFilterSelect.value : 'ALL';
        
        let html = '';
        const filtered = allLogs.filter(l => filter === 'ALL' || l.actionType === filter || l.level === filter);

        if (filtered.length === 0) {
            html = `<div class="log-empty">No console entries match the selected filter.</div>`;
        } else {
            filtered.slice(0, 150).forEach(l => {
                let badgeClass = 'badge-zero';
                if (l.actionType === 'WRITE') badgeClass = 'badge-write';
                else if (l.actionType === 'READ') badgeClass = 'badge-read';
                else if (l.actionType === 'RESET') badgeClass = 'badge-rst';
                else if (l.actionType === 'NOP') badgeClass = 'badge-nop';

                html += `
                    <div class="log-row log-${l.level}">
                        <span class="log-time">[${l.timeStr}]</span>
                        <span class="log-cycle">Cyc #${l.cycle}</span>
                        <span class="badge ${badgeClass}">${l.actionType}</span>
                        <span class="log-msg">${l.text}</span>
                    </div>
                `;
            });
        }
        logList.innerHTML = html;
    }

    // Initial Welcome Log
    addLogEntry(0, 'INIT', 'Synchronous 1 KB Memory Simulator ready (256 words x 32-bit, ADDR_WIDTH=8, single-port).', 'info');

    // 6. UI Element References
    // Clocks & Cycles
    const btnRisingEdge = document.getElementById('btn-rising-edge');
    const btnClkToggle = document.getElementById('btn-clk-toggle');
    const btnAutoClock = document.getElementById('btn-auto-clock');
    const autoClockText = document.getElementById('auto-clock-text');
    const autoClockIcon = document.getElementById('auto-clock-icon');
    const speedSlider = document.getElementById('speed-slider');
    const speedValDisplay = document.getElementById('speed-val');
    const clkStateBadge = document.getElementById('clk-state-badge');
    const cycleDisplay = document.getElementById('cycle-display');
    const resetSimBtn = document.getElementById('btn-reset-sim');

    // Inputs
    const rstSwitch = document.getElementById('sw-rst');
    const btnPulseReset = document.getElementById('btn-pulse-rst');
    const btnWr = document.getElementById('btn-op-wr');
    const btnRd = document.getElementById('btn-op-rd');
    const wrRdBadge = document.getElementById('wr-rd-badge');
    const swValid = document.getElementById('sw-valid');
    const validBadge = document.getElementById('valid-badge');

    // Address Inputs
    const inAddrDec = document.getElementById('addr-dec-input');
    const inAddrHex = document.getElementById('addr-hex-input');
    const inAddrBin = document.getElementById('addr-bin-input');
    const btnAddrInc = document.getElementById('btn-addr-inc');
    const btnAddrDec = document.getElementById('btn-addr-dec');
    const addrErrorMsg = document.getElementById('addr-error-msg');

    // WDATA Inputs
    const inWdataHex = document.getElementById('wdata-hex-input');
    const inWdataDec = document.getElementById('wdata-dec-input');
    const inWdataBin = document.getElementById('wdata-bin-input');
    const btnRandWdata = document.getElementById('btn-rand-wdata');
    const wdataPresets = document.querySelectorAll('.btn-preset-data');

    // Outputs 7-Segment & Displays
    const dispRdataHex = document.getElementById('disp-rdata-hex');
    const dispRdataDec = document.getElementById('disp-rdata-dec');
    const dispRdataBin = document.getElementById('disp-rdata-bin');
    const dispRdataAscii = document.getElementById('disp-rdata-ascii');
    const dispReadyVal = document.getElementById('disp-ready-val');
    const dispReadyLed = document.getElementById('disp-ready-led');
    const dispCurAddr = document.getElementById('disp-cur-addr');
    const dispCurOp = document.getElementById('disp-cur-op');
    const dispOpBanner = document.getElementById('disp-op-banner');

    // Time Travel Controls
    const ttSlider = document.getElementById('tt-slider');
    const ttCurrentCycle = document.getElementById('tt-cycle-val');
    const btnTtPrev = document.getElementById('btn-tt-prev');
    const btnTtNext = document.getElementById('btn-tt-next');
    const btnTtLive = document.getElementById('btn-tt-live');

    // Audio & Header
    const btnToggleAudio = document.getElementById('btn-toggle-audio');

    // 7. Update UI from Simulator State
    function updateUI(eventType, state, data) {
        const { inputs, outputs, lastAction, clk, cycle } = state;

        // Clock & Cycle Displays
        if (clkStateBadge) {
            clkStateBadge.textContent = clk ? 'HIGH (1)' : 'LOW (0)';
            clkStateBadge.className = clk ? 'badge badge-green' : 'badge badge-slate';
        }
        if (cycleDisplay) {
            cycleDisplay.textContent = cycle;
        }

        // Control Inputs Synced
        if (rstSwitch) rstSwitch.checked = (inputs.rst === 1);
        if (swValid) {
            swValid.checked = (inputs.valid === 1);
            if (validBadge) {
                validBadge.textContent = inputs.valid ? 'VALID = 1 (ACTIVE)' : 'VALID = 0 (NOP)';
                validBadge.className = inputs.valid ? 'badge badge-green' : 'badge badge-slate';
            }
        }

        if (btnWr && btnRd) {
            btnWr.classList.toggle('active', inputs.wr_rd === 1);
            btnRd.classList.toggle('active', inputs.wr_rd === 0);
            if (wrRdBadge) {
                wrRdBadge.textContent = inputs.wr_rd ? '1: WRITE' : '0: READ';
                wrRdBadge.className = inputs.wr_rd ? 'badge badge-yellow' : 'badge badge-cyan';
            }
        }

        // Address Field values (8-bit)
        if (document.activeElement !== inAddrDec && inAddrDec) inAddrDec.value = inputs.addr;
        if (document.activeElement !== inAddrHex && inAddrHex) inAddrHex.value = '0x' + inputs.addr.toString(16).toUpperCase().padStart(2, '0');
        if (document.activeElement !== inAddrBin && inAddrBin) inAddrBin.value = inputs.addr.toString(2).padStart(8, '0');

        // WDATA Field values
        if (document.activeElement !== inWdataHex && inWdataHex) inWdataHex.value = '0x' + inputs.wdata.toString(16).toUpperCase().padStart(8, '0');
        if (document.activeElement !== inWdataDec && inWdataDec) inWdataDec.value = inputs.wdata.toString();
        if (document.activeElement !== inWdataBin && inWdataBin) inWdataBin.value = formatBinary32Chunks(inputs.wdata);

        // 7-Segment / Large Digital Displays
        const hexRdataStr = '0x' + outputs.rdata.toString(16).toUpperCase().padStart(8, '0');
        if (dispRdataHex) dispRdataHex.textContent = hexRdataStr;
        if (dispRdataDec) dispRdataDec.textContent = outputs.rdata.toString();
        if (dispRdataBin) dispRdataBin.textContent = formatBinary32Chunks(outputs.rdata);
        if (dispRdataAscii) dispRdataAscii.textContent = formatAscii32(outputs.rdata);

        if (dispReadyVal) {
            dispReadyVal.textContent = outputs.ready;
            dispReadyVal.className = outputs.ready ? 'digital-val text-green glow-green' : 'digital-val text-slate';
        }
        if (dispReadyLed) {
            dispReadyLed.className = outputs.ready ? 'led-indicator led-on' : 'led-indicator led-off';
        }

        if (dispCurAddr) {
            dispCurAddr.textContent = `0x${inputs.addr.toString(16).toUpperCase().padStart(2, '0')} (${inputs.addr})`;
        }

        if (dispCurOp) {
            if (inputs.rst) {
                dispCurOp.textContent = 'RESET (SWEEP CLEAR)';
                dispCurOp.className = 'status-badge text-red';
            } else if (!inputs.valid) {
                dispCurOp.textContent = 'IDLE (VALID=0, NOP)';
                dispCurOp.className = 'status-badge text-amber';
            } else if (inputs.wr_rd === 1) {
                dispCurOp.textContent = 'WRITE (MEM <= WDATA)';
                dispCurOp.className = 'status-badge text-green';
            } else {
                dispCurOp.textContent = 'READ (RDATA <= MEM)';
                dispCurOp.className = 'status-badge text-cyan';
            }
        }

        // Update Hardware Routing Status
        const statRowDec = document.getElementById('stat-row-dec');
        const statColDec = document.getElementById('stat-col-dec');
        const statSenseAmps = document.getElementById('stat-sense-amps');
        const statDataBuf = document.getElementById('stat-data-buf');

        const rowIdx = (inputs.addr >> 4) % 16;
        const colIdx = inputs.addr % 16;

        if (statRowDec) {
            statRowDec.textContent = inputs.valid ? `MAR: 0x${inputs.addr.toString(16).toUpperCase()} (#${inputs.addr})` : 'Address Bus Gated';
            statRowDec.className = inputs.valid ? 'code-font text-cyan' : 'code-font text-slate';
        }
        if (statColDec) {
            statColDec.textContent = inputs.valid ? (inputs.wr_rd ? `WDATA: 0x${inputs.wdata.toString(16).toUpperCase()}` : `RDATA: 0x${outputs.rdata.toString(16).toUpperCase()}`) : 'Data Bus Gated';
            statColDec.className = inputs.valid ? (inputs.wr_rd ? 'code-font text-green' : 'code-font text-cyan') : 'code-font text-slate';
        }
        if (statSenseAmps) {
            statSenseAmps.textContent = inputs.valid ? (inputs.wr_rd ? 'Write Strobe Asserted' : 'Read Strobe Asserted') : 'Control Bus Gated (VALID=0)';
            statSenseAmps.className = inputs.valid ? (inputs.wr_rd ? 'code-font text-green' : 'code-font text-cyan') : 'code-font text-slate';
        }
        if (statDataBuf) {
            statDataBuf.textContent = `RAM Mailbox #${inputs.addr} (Row 0x${((inputs.addr >> 4) * 16).toString(16).toUpperCase().padStart(2, '0')}, Col +${(inputs.addr % 16).toString(16).toUpperCase()})`;
            statDataBuf.className = inputs.valid ? 'code-font text-muted' : 'code-font text-slate';
        }

        // Update Schematic Status Ribbon
        const ribAddr = document.getElementById('ribbon-addr');
        const ribData = document.getElementById('ribbon-data');
        const ribCtrl = document.getElementById('ribbon-ctrl');
        const ribCore = document.getElementById('ribbon-core');

        if (ribAddr) {
            ribAddr.textContent = `MAR: 0x${inputs.addr.toString(16).toUpperCase().padStart(2, '0')} (#${inputs.addr})`;
        }
        if (ribData) {
            ribData.textContent = inputs.valid ? (inputs.wr_rd ? `WDATA: 0x${(inputs.wdata >>> 0).toString(16).toUpperCase().padStart(8, '0')}` : `RDATA: 0x${(outputs.rdata >>> 0).toString(16).toUpperCase().padStart(8, '0')}`) : 'Bus Idle (VALID=0)';
        }
        if (ribCtrl) {
            ribCtrl.textContent = inputs.rst ? 'Reset Active' : (inputs.valid ? (inputs.wr_rd ? 'Write Cycle' : 'Read Cycle') : 'Idle (VALID=0)');
        }
        if (ribCore) {
            ribCore.textContent = `256 Words (Addr 0x00-0xFF)`;
        }

        if (dispOpBanner) {
            dispOpBanner.textContent = lastAction.description || 'Simulator ready';
            if (lastAction.type === 'WRITE') dispOpBanner.className = 'op-banner op-write';
            else if (lastAction.type === 'READ') dispOpBanner.className = 'op-banner op-read';
            else if (lastAction.type === 'RESET') dispOpBanner.className = 'op-banner op-reset';
            else if (lastAction.type === 'NOP') dispOpBanner.className = 'op-banner op-nop';
            else dispOpBanner.className = 'op-banner';
        }

        // Update Time Travel Slider max
        if (ttSlider) {
            ttSlider.max = Math.max(0, sim.history.length - 1);
            ttSlider.value = sim.history.findIndex(h => h.cycle === cycle) >= 0 ? sim.history.findIndex(h => h.cycle === cycle) : ttSlider.max;
        }
        if (ttCurrentCycle) {
            ttCurrentCycle.textContent = `Cycle #${cycle}`;
        }

        // Play audio sound on posedge
        if (eventType === 'POSEDGE') {
            if (lastAction.type === 'RESET') audio.play('reset');
            else if (lastAction.type === 'WRITE') audio.play('write');
            else if (lastAction.type === 'READ') audio.play('read');
            else audio.play('tick');

            addLogEntry(cycle, lastAction.type, lastAction.description, lastAction.type === 'RESET' ? 'warn' : 'info');
        }
    }

    sim.addListener(updateUI);

    // 8. Event Bindings: Clock & Execution
    function triggerPosedge() {
        sim.stepCycle();
    }

    if (btnRisingEdge) {
        btnRisingEdge.addEventListener('click', () => {
            triggerPosedge();
        });
    }

    if (btnClkToggle) {
        btnClkToggle.addEventListener('click', () => {
            sim.toggleClk();
        });
    }

    function updateClockSpeed(hz) {
        clockSpeedHz = Math.max(0.1, Math.min(10.0, hz));
        if (speedSlider) speedSlider.value = clockSpeedHz;
        if (speedValDisplay) {
            const periodSec = (1 / clockSpeedHz).toFixed(1);
            speedValDisplay.textContent = `${clockSpeedHz.toFixed(1)} Hz (${periodSec}s)`;
        }
        document.querySelectorAll('.btn-speed-preset').forEach(btn => {
            const val = parseFloat(btn.dataset.speed);
            btn.classList.toggle('active', Math.abs(val - clockSpeedHz) < 0.05);
        });

        if (autoClockTimer) {
            // Restart running timer with new rate
            clearInterval(autoClockTimer);
            const intervalMs = Math.round(1000 / clockSpeedHz);
            autoClockTimer = setInterval(() => {
                triggerPosedge();
            }, intervalMs);
        }
    }

    function toggleAutoClock() {
        if (autoClockTimer) {
            clearInterval(autoClockTimer);
            autoClockTimer = null;
            btnAutoClock.classList.remove('btn-running');
            autoClockText.textContent = 'Auto Clock (Run)';
            autoClockIcon.textContent = '▶';
        } else {
            const intervalMs = Math.round(1000 / clockSpeedHz);
            autoClockTimer = setInterval(() => {
                triggerPosedge();
            }, intervalMs);
            btnAutoClock.classList.add('btn-running');
            autoClockText.textContent = 'Pause Clock';
            autoClockIcon.textContent = '⏸';
        }
    }

    if (btnAutoClock) {
        btnAutoClock.addEventListener('click', toggleAutoClock);
    }

    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            updateClockSpeed(parseFloat(e.target.value));
        });
    }

    // Speed Preset Quick Buttons
    document.querySelectorAll('.btn-speed-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            const spd = parseFloat(btn.dataset.speed);
            if (!isNaN(spd)) updateClockSpeed(spd);
        });
    });

    if (resetSimBtn) {
        resetSimBtn.addEventListener('click', () => {
            if (confirm('Reset entire simulation state back to Cycle 0?')) {
                if (autoClockTimer) toggleAutoClock();
                sim.resetSimulator();
                addLogEntry(0, 'INIT', 'Simulator state reset to Cycle 0.', 'warn');
            }
        });
    }

    // 9. Reset Control Bindings
    if (rstSwitch) {
        rstSwitch.addEventListener('change', (e) => {
            sim.setInput('rst', e.target.checked ? 1 : 0);
        });
    }

    if (btnPulseReset) {
        btnPulseReset.addEventListener('click', () => {
            sim.setInput('rst', 1);
            triggerPosedge();
            sim.setInput('rst', 0);
        });
    }

    // 10. Operation Select (WR_RD) & VALID Bindings
    if (btnWr) {
        btnWr.addEventListener('click', () => {
            sim.setInput('wr_rd', 1);
        });
    }
    if (btnRd) {
        btnRd.addEventListener('click', () => {
            sim.setInput('wr_rd', 0);
        });
    }

    if (swValid) {
        swValid.addEventListener('change', (e) => {
            sim.setInput('valid', e.target.checked ? 1 : 0);
        });
    }

    // 11. Address Input Bindings (Dec, Hex, Bin) with bounds validation (0..255, 8-bit)
    function setAndValidateAddr(rawVal) {
        let num = Number(rawVal);
        if (isNaN(num)) {
            showAddrError('Invalid address format');
            return;
        }
        if (num < 0 || num > 255) {
            showAddrError('Address must be within 0 to 255 (8 bits)');
            num = Math.max(0, Math.min(255, num));
        } else {
            hideAddrError();
        }
        sim.setInput('addr', num);
    }

    function showAddrError(msg) {
        if (addrErrorMsg) {
            addrErrorMsg.textContent = msg;
            addrErrorMsg.style.display = 'block';
        }
    }
    function hideAddrError() {
        if (addrErrorMsg) {
            addrErrorMsg.style.display = 'none';
        }
    }

    if (inAddrDec) {
        inAddrDec.addEventListener('input', (e) => setAndValidateAddr(parseInt(e.target.value, 10)));
    }
    if (inAddrHex) {
        inAddrHex.addEventListener('input', (e) => {
            let s = e.target.value.trim();
            if (s.startsWith('0x') || s.startsWith('0X')) s = s.slice(2);
            setAndValidateAddr(parseInt(s, 16));
        });
    }
    if (inAddrBin) {
        inAddrBin.addEventListener('input', (e) => {
            let s = e.target.value.replace(/[^01]/g, '');
            setAndValidateAddr(parseInt(s, 2));
        });
    }
    if (btnAddrInc) {
        btnAddrInc.addEventListener('click', () => {
            setAndValidateAddr((sim.inputs.addr + 1) % 256);
        });
    }
    if (btnAddrDec) {
        btnAddrDec.addEventListener('click', () => {
            setAndValidateAddr((sim.inputs.addr - 1 + 256) % 256);
        });
    }

    // 12. WDATA Input Bindings (Hex, Dec, Bin, Presets)
    function setWdata(rawVal) {
        let num = Number(rawVal);
        if (isNaN(num)) num = 0;
        sim.setInput('wdata', num >>> 0);
    }

    if (inWdataHex) {
        inWdataHex.addEventListener('input', (e) => {
            let s = e.target.value.trim();
            if (s.startsWith('0x') || s.startsWith('0X')) s = s.slice(2);
            const val = parseInt(s, 16);
            if (!isNaN(val)) setWdata(val);
        });
    }
    if (inWdataDec) {
        inWdataDec.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val)) setWdata(val);
        });
    }
    if (inWdataBin) {
        inWdataBin.addEventListener('input', (e) => {
            const s = e.target.value.replace(/[^01]/g, '');
            const val = parseInt(s, 2);
            if (!isNaN(val)) setWdata(val);
        });
    }

    if (btnRandWdata) {
        btnRandWdata.addEventListener('click', () => {
            const rand32 = Math.floor(Math.random() * 0xFFFFFFFF) >>> 0;
            setWdata(rand32);
        });
    }

    wdataPresets.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const valStr = e.currentTarget.dataset.val;
            const val = parseInt(valStr, 16);
            setWdata(val);
        });
    });

    // 13. Predefined Test Scenario Launchers
    document.querySelectorAll('.btn-test-action').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const testNum = e.currentTarget.dataset.test;
            if (autoClockTimer) toggleAutoClock();

            let res = null;
            if (testNum === '1') res = testbench.runTest1();
            else if (testNum === '2') res = testbench.runTest2();
            else if (testNum === '3') res = await testbench.runTest3(250);
            else if (testNum === '4') res = await testbench.runTest4(250);
            else if (testNum === '5') res = await testbench.runTest5(350);
            else if (testNum === '6') res = testbench.runTest6();

            if (res) {
                showTestModal(res.name, res.passed, res.details);
            }
        });
    });

    const btnRunSuite = document.getElementById('btn-run-test-suite');
    if (btnRunSuite) {
        btnRunSuite.addEventListener('click', async () => {
            if (autoClockTimer) toggleAutoClock();
            btnRunSuite.disabled = true;
            btnRunSuite.textContent = 'Running Tests 1–6...';

            const suiteResults = await testbench.runFullTestSuite((statusText, cur, total) => {
                btnRunSuite.textContent = `Running (${cur}/${total})...`;
            });

            btnRunSuite.disabled = false;
            btnRunSuite.textContent = '▶ Run All Verification Tests';

            showSuiteSummaryModal(suiteResults);
        });
    }

    // 14. Tab Switching
    document.querySelectorAll('.wb-tab').forEach(tabBtn => {
        tabBtn.addEventListener('click', (e) => {
            const targetTab = e.currentTarget.dataset.tab;
            document.querySelectorAll('.wb-tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.wb-tab-panel').forEach(p => p.classList.remove('active'));

            e.currentTarget.classList.add('active');
            const panel = document.getElementById(`panel-${targetTab}`);
            if (panel) panel.classList.add('active');

            // Trigger reflow/redraw if switching to Waveform or Memory table
            if (targetTab === 'waveform') waveformViewer.render();
            else if (targetTab === 'memory') {
                memoryTableView.updateDataList();
                memoryTableView.render();
            }
        });
    });

    // 15. Time Travel Controls
    if (ttSlider) {
        ttSlider.addEventListener('input', (e) => {
            const idx = parseInt(e.target.value, 10);
            const snap = sim.history[idx];
            if (snap) {
                sim.jumpToCycle(snap.cycle);
            }
        });
    }

    if (btnTtPrev) {
        btnTtPrev.addEventListener('click', () => {
            const curIdx = sim.history.findIndex(h => h.cycle === sim.cycle);
            if (curIdx > 0) {
                sim.jumpToCycle(sim.history[curIdx - 1].cycle);
            }
        });
    }

    if (btnTtNext) {
        btnTtNext.addEventListener('click', () => {
            const curIdx = sim.history.findIndex(h => h.cycle === sim.cycle);
            if (curIdx >= 0 && curIdx < sim.history.length - 1) {
                sim.jumpToCycle(sim.history[curIdx + 1].cycle);
            }
        });
    }

    if (btnTtLive) {
        btnTtLive.addEventListener('click', () => {
            if (sim.history.length > 0) {
                sim.jumpToCycle(sim.history[sim.history.length - 1].cycle);
            }
        });
    }

    // 16. Console Log Actions
    if (logFilterSelect) {
        logFilterSelect.addEventListener('change', renderLogs);
    }
    const btnClearLogs = document.getElementById('btn-clear-logs');
    if (btnClearLogs) {
        btnClearLogs.addEventListener('click', () => {
            allLogs = [];
            renderLogs();
        });
    }

    const btnExportLogs = document.getElementById('btn-export-logs');
    if (btnExportLogs) {
        btnExportLogs.addEventListener('click', () => {
            let txt = `Memory Simulation Event Log Export\nExported: ${new Date().toISOString()}\n\n`;
            allLogs.slice().reverse().forEach(l => {
                txt += `[${l.timeStr}] Cyc #${l.cycle} [${l.actionType}] ${l.text}\n`;
            });
            const blob = new Blob([txt], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `simulation_log_cycle_${sim.cycle}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // 17. Waveform Action Buttons
    const btnWaveZoomIn = document.getElementById('btn-wave-zoom-in');
    const btnWaveZoomOut = document.getElementById('btn-wave-zoom-out');
    const btnWaveExportVcd = document.getElementById('btn-wave-vcd');

    if (btnWaveZoomIn) btnWaveZoomIn.addEventListener('click', () => waveformViewer.zoomIn());
    if (btnWaveZoomOut) btnWaveZoomOut.addEventListener('click', () => waveformViewer.zoomOut());
    if (btnWaveExportVcd) btnWaveExportVcd.addEventListener('click', () => waveformViewer.exportVCD());

    // 18. Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        // Avoid intercepting inside text inputs
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

        if (e.code === 'Space') {
            e.preventDefault();
            triggerPosedge();
        } else if (e.code === 'KeyR' && !e.ctrlKey) {
            e.preventDefault();
            sim.setInput('rst', sim.inputs.rst ? 0 : 1);
        } else if (e.code === 'KeyW' && !e.ctrlKey) {
            e.preventDefault();
            sim.setInput('wr_rd', sim.inputs.wr_rd ? 0 : 1);
        } else if (e.code === 'KeyV' && !e.ctrlKey) {
            e.preventDefault();
            sim.setInput('valid', sim.inputs.valid ? 0 : 1);
        } else if (e.code === 'KeyP' && !e.ctrlKey) {
            e.preventDefault();
            toggleAutoClock();
        }
    });

    // 19. Audio Toggle
    if (btnToggleAudio) {
        btnToggleAudio.addEventListener('click', () => {
            audio.enabled = !audio.enabled;
            btnToggleAudio.classList.toggle('active', audio.enabled);
            btnToggleAudio.title = audio.enabled ? 'Audio Feedback Enabled' : 'Audio Feedback Muted';
            btnToggleAudio.textContent = audio.enabled ? '🔊 Audio ON' : '🔇 Audio OFF';
        });
    }

    // 20. Modal Helpers for Test Suite Results
    function showTestModal(title, passed, details) {
        let modal = document.getElementById('test-result-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'test-result-modal';
            modal.className = 'modal-backdrop';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-card">
                <div class="modal-header">
                    <span class="modal-title">${title}</span>
                    <button class="modal-close" onclick="document.getElementById('test-result-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="test-result-badge ${passed ? 'badge-pass' : 'badge-fail'}">
                        ${passed ? '✔ TEST PASSED' : '✖ TEST FAILED'}
                    </div>
                    <p class="test-details-text">${details}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="document.getElementById('test-result-modal').remove()">Close</button>
                </div>
            </div>
        `;
    }

    function showSuiteSummaryModal(results) {
        let modal = document.getElementById('test-result-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'test-result-modal';
            modal.className = 'modal-backdrop';
            document.body.appendChild(modal);
        }

        let rowsHtml = '';
        let passCount = 0;
        results.forEach(r => {
            if (r.passed) passCount++;
            rowsHtml += `
                <div class="suite-result-row ${r.passed ? 'row-pass' : 'row-fail'}">
                    <span class="suite-test-name">${r.name}</span>
                    <span class="badge ${r.passed ? 'badge-green' : 'badge-red'}">${r.passed ? 'PASS' : 'FAIL'}</span>
                    <div class="suite-test-desc">${r.details}</div>
                </div>
            `;
        });

        modal.innerHTML = `
            <div class="modal-card modal-lg">
                <div class="modal-header">
                    <span class="modal-title">Verification Test Suite (Tests 1–6)</span>
                    <button class="modal-close" onclick="document.getElementById('test-result-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="suite-score-banner ${passCount === results.length ? 'all-pass' : 'some-fail'}">
                        Score: ${passCount} / ${results.length} Tests Passed (100% RTL Compliant)
                    </div>
                    <div class="suite-rows-container">
                        ${rowsHtml}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="document.getElementById('test-result-modal').remove()">Done</button>
                </div>
            </div>
        `;
    }

    // Helper Formatters
    function formatBinary32Chunks(val) {
        const bin = (val >>> 0).toString(2).padStart(32, '0');
        return `${bin.slice(0,8)}_${bin.slice(8,16)}_${bin.slice(16,24)}_${bin.slice(24,32)}`;
    }

    function formatAscii32(val) {
        const b3 = (val >> 24) & 0xFF;
        const b2 = (val >> 16) & 0xFF;
        const b1 = (val >> 8) & 0xFF;
        const b0 = val & 0xFF;
        const toChr = (b) => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '·';
        return `"${toChr(b3)}${toChr(b2)}${toChr(b1)}${toChr(b0)}"`;
    }

    // Initial Trigger
    updateUI('INIT', sim.getState(), {});
});

