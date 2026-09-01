/**
 * High-Precision Logic Analyzer Digital Waveform Canvas Engine
 * Displays digital traces and bus transition envelopes for synchronous memory.
 */

class WaveformViewer {
    constructor(canvasId, containerId, sim) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById(containerId);
        this.sim = sim;

        // Visual Signals configuration
        this.signals = [
            { id: 'clk',   name: 'CLK',        type: 'digital', color: '#00f5a0', bits: 1 },
            { id: 'rst',   name: 'RST',        type: 'digital', color: '#ff4b4b', bits: 1 },
            { id: 'valid', name: 'VALID',      type: 'digital', color: '#00f2fe', bits: 1 },
            { id: 'wr_rd', name: 'WR_RD',      type: 'digital', color: '#ffd200', bits: 1 },
            { id: 'addr',  name: 'ADDR[10:0]', type: 'bus',     color: '#38bdf8', bits: 11 },
            { id: 'wdata', name: 'WDATA[31:0]',type: 'bus',     color: '#a855f7', bits: 32 },
            { id: 'ready', name: 'READY',      type: 'digital', color: '#00f5a0', bits: 1 },
            { id: 'rdata', name: 'RDATA[31:0]',type: 'bus',     color: '#4facfe', bits: 32 }
        ];

        // Zoom and Pan settings
        this.cycleWidth = 50; // pixels per clock cycle
        this.minCycleWidth = 20;
        this.maxCycleWidth = 120;
        this.scrollOffset = 0;
        this.autoScroll = true;

        // Cursor inspection
        this.cursorCycle = null;
        this.hoveredCycle = null;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragScrollStart = 0;

        // Row metrics
        this.labelWidth = 120;
        this.rulerHeight = 28;
        this.rowHeight = 36;
        this.wavePadding = 6;

        this.initCanvasResize();
        this.initInteractions();

        this.sim.addListener((evt, state, data) => {
            if (evt === 'POSEDGE' || evt === 'NEGEDGE' || evt === 'SIMULATOR_RESET' || evt === 'TIME_TRAVEL') {
                if (this.autoScroll) {
                    this.scrollToLatest();
                }
                this.render();
            }
        });

        this.render();
    }

    initCanvasResize() {
        const resize = () => {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const w = rect.width || 800;
            const h = this.rulerHeight + this.signals.length * this.rowHeight + 20;

            this.canvas.width = w * dpr;
            this.canvas.height = h * dpr;
            this.canvas.style.width = `${w}px`;
            this.canvas.style.height = `${h}px`;

            this.dpr = dpr;
            this.viewWidth = w;
            this.viewHeight = h;
            this.render();
        };

        window.addEventListener('resize', resize);
        setTimeout(resize, 60);
        resize();
    }

    initInteractions() {
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            
            if (mouseX > this.labelWidth) {
                const timeX = mouseX - this.labelWidth + this.scrollOffset;
                const cycle = Math.floor(timeX / this.cycleWidth);
                this.cursorCycle = Math.max(0, cycle);
                this.sim.jumpToCycle(this.cursorCycle);
            }

            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragScrollStart = this.scrollOffset;
            this.render();
        });

        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (mouseX >= 0 && mouseX <= rect.width && mouseY >= 0 && mouseY <= rect.height) {
                if (mouseX > this.labelWidth) {
                    const timeX = mouseX - this.labelWidth + this.scrollOffset;
                    this.hoveredCycle = Math.max(0, Math.floor(timeX / this.cycleWidth));
                } else {
                    this.hoveredCycle = null;
                }
            } else {
                this.hoveredCycle = null;
            }

            if (this.isDragging) {
                const dx = e.clientX - this.dragStartX;
                this.scrollOffset = Math.max(0, this.dragScrollStart - dx);
                this.autoScroll = false;
            }
            this.render();
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.ctrlKey || e.metaKey) {
                // Zoom
                const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
                this.setZoom(this.cycleWidth * zoomFactor);
            } else {
                // Horizontal scroll
                this.scrollOffset = Math.max(0, this.scrollOffset + e.deltaY * 0.5);
                this.autoScroll = false;
                this.render();
            }
        }, { passive: false });
    }

    setZoom(newWidth) {
        this.cycleWidth = Math.max(this.minCycleWidth, Math.min(this.maxCycleWidth, newWidth));
        this.render();
    }

    zoomIn() {
        this.setZoom(this.cycleWidth * 1.25);
    }

    zoomOut() {
        this.setZoom(this.cycleWidth * 0.8);
    }

    scrollToLatest() {
        const totalCycles = this.sim.history.length;
        const totalWidth = totalCycles * this.cycleWidth;
        const availableWidth = (this.viewWidth || 800) - this.labelWidth;
        if (totalWidth > availableWidth) {
            this.scrollOffset = totalWidth - availableWidth + this.cycleWidth;
        } else {
            this.scrollOffset = 0;
        }
    }

    render() {
        if (!this.ctx || !this.dpr) return;
        const ctx = this.ctx;
        const dpr = this.dpr;
        const w = this.viewWidth;
        const h = this.viewHeight;

        ctx.save();
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.scale(dpr, dpr);

        const history = this.sim.history;
        const maxCycles = Math.max(history.length, 20);

        // 1. Draw Background
        ctx.fillStyle = '#0b1326';
        ctx.fillRect(0, 0, w, h);

        // 2. Draw Time Grid & Cycle Ruler
        this.drawTimelineGrid(ctx, maxCycles, w, h);

        // 3. Draw Waveform Traces
        this.drawSignals(ctx, history);

        // 4. Draw Label Column Background & Text
        this.drawSignalLabels(ctx, h);

        // 5. Draw Cursors & Readout Box
        this.drawCursors(ctx, history, h);

        ctx.restore();
    }

    drawTimelineGrid(ctx, maxCycles, w, h) {
        const { labelWidth, rulerHeight, cycleWidth, scrollOffset } = this;

        // Top Ruler Bar
        ctx.fillStyle = '#112240';
        ctx.fillRect(0, 0, w, rulerHeight);

        ctx.strokeStyle = '#1e2d4a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, rulerHeight);
        ctx.lineTo(w, rulerHeight);
        ctx.stroke();

        // Cycle Markers
        const startCycle = Math.max(0, Math.floor(scrollOffset / cycleWidth));
        const endCycle = Math.ceil((scrollOffset + w - labelWidth) / cycleWidth) + 1;

        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';

        for (let c = startCycle; c <= endCycle; c++) {
            const x = labelWidth + c * cycleWidth - scrollOffset;
            if (x < labelWidth) continue;

            // Vertical grid line down the canvas
            ctx.strokeStyle = c % 5 === 0 ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.04)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, rulerHeight);
            ctx.lineTo(x, h);
            ctx.stroke();

            // Ruler tick and cycle label
            ctx.strokeStyle = '#3b82f6';
            ctx.beginPath();
            ctx.moveTo(x, rulerHeight - 8);
            ctx.lineTo(x, rulerHeight);
            ctx.stroke();

            ctx.fillStyle = c === this.sim.cycle ? '#00f5a0' : '#8892b0';
            ctx.fillText(`C${c}`, x + cycleWidth / 2, rulerHeight - 10);
        }
    }

    drawSignals(ctx, history) {
        const { labelWidth, rulerHeight, rowHeight, cycleWidth, scrollOffset, wavePadding } = this;
        const numCycles = history.length;

        this.signals.forEach((sig, rowIdx) => {
            const rowY = rulerHeight + rowIdx * rowHeight;
            const baselineY = rowY + rowHeight - wavePadding;
            const highY = rowY + wavePadding + 4;
            const midY = (baselineY + highY) / 2;

            // Row separator line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(labelWidth, rowY + rowHeight);
            ctx.lineTo(this.viewWidth, rowY + rowHeight);
            ctx.stroke();

            if (numCycles === 0) return;

            if (sig.type === 'digital') {
                ctx.strokeStyle = sig.color;
                ctx.lineWidth = 2;
                ctx.beginPath();

                for (let c = 0; c < numCycles; c++) {
                    const snap = history[c];
                    const x0 = labelWidth + c * cycleWidth - scrollOffset;
                    const x1 = x0 + cycleWidth;

                    if (x1 < labelWidth || x0 > this.viewWidth) continue;

                    let val = 0;
                    if (sig.id === 'clk') {
                        // Clock alternates Low in 1st half, High on posedge
                        const xMid = x0 + cycleWidth / 2;
                        // Low half
                        ctx.moveTo(x0, baselineY);
                        ctx.lineTo(xMid, baselineY);
                        // Rising edge
                        ctx.lineTo(xMid, highY);
                        // High half
                        ctx.lineTo(x1, highY);
                        // Falling edge
                        ctx.lineTo(x1, baselineY);

                        // Draw tiny posedge arrow
                        if (cycleWidth > 35) {
                            ctx.fillStyle = '#00f5a0';
                            ctx.beginPath();
                            ctx.moveTo(xMid, highY - 2);
                            ctx.lineTo(xMid - 3, highY + 4);
                            ctx.lineTo(xMid + 3, highY + 4);
                            ctx.fill();
                        }
                        continue;
                    } else if (sig.id in snap.inputs) {
                        val = snap.inputs[sig.id];
                    } else if (sig.id in snap.outputs) {
                        val = snap.outputs[sig.id];
                    }

                    const targetY = val ? highY : baselineY;

                    if (c === 0) {
                        ctx.moveTo(x0, targetY);
                        ctx.lineTo(x1, targetY);
                    } else {
                        const prevSnap = history[c - 1];
                        let prevVal = (sig.id in prevSnap.inputs) ? prevSnap.inputs[sig.id] : prevSnap.outputs[sig.id];
                        const prevY = prevVal ? highY : baselineY;

                        if (prevY !== targetY) {
                            ctx.lineTo(x0, targetY);
                        }
                        ctx.lineTo(x1, targetY);
                    }
                }
                ctx.stroke();

            } else if (sig.type === 'bus') {
                // Multi-bit Bus with hex value inside polygon
                for (let c = 0; c < numCycles; c++) {
                    const snap = history[c];
                    const x0 = labelWidth + c * cycleWidth - scrollOffset;
                    const x1 = x0 + cycleWidth;

                    if (x1 < labelWidth || x0 > this.viewWidth) continue;

                    let rawVal = 0;
                    if (sig.id in snap.inputs) rawVal = snap.inputs[sig.id];
                    else if (sig.id in snap.outputs) rawVal = snap.outputs[sig.id];

                    const hexStr = '0x' + rawVal.toString(16).toUpperCase().padStart(sig.bits === 11 ? 3 : 8, '0');

                    // Bus envelope shape (hexagonal ends on change)
                    ctx.save();
                    ctx.strokeStyle = sig.color;
                    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
                    ctx.lineWidth = 1.5;

                    const bevel = Math.min(6, cycleWidth * 0.15);
                    ctx.beginPath();
                    ctx.moveTo(x0 + bevel, highY);
                    ctx.lineTo(x1 - bevel, highY);
                    ctx.lineTo(x1, midY);
                    ctx.lineTo(x1 - bevel, baselineY);
                    ctx.lineTo(x0 + bevel, baselineY);
                    ctx.lineTo(x0, midY);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // Text value inside bus if wide enough
                    if (cycleWidth > 45) {
                        ctx.font = '9px "JetBrains Mono", monospace';
                        ctx.fillStyle = '#ffffff';
                        ctx.textAlign = 'center';
                        const displayStr = cycleWidth < 75 && sig.bits === 32 ? hexStr.slice(0, 6) + '..' : hexStr;
                        ctx.fillText(displayStr, (x0 + x1) / 2, midY + 3);
                    }
                    ctx.restore();
                }
            }
        });
    }

    drawSignalLabels(ctx, h) {
        const { labelWidth, rulerHeight, rowHeight } = this;

        // Opaque left column background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, labelWidth, h);

        // Border separating labels from waves
        ctx.strokeStyle = '#1e3a5f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(labelWidth, 0);
        ctx.lineTo(labelWidth, h);
        ctx.stroke();

        // Header
        ctx.fillStyle = '#64ffda';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('SIGNAL NAME', 10, rulerHeight - 10);

        // Labels
        this.signals.forEach((sig, idx) => {
            const rowY = rulerHeight + idx * rowHeight;
            const midY = rowY + rowHeight / 2;

            // Signal color bullet
            ctx.fillStyle = sig.color;
            ctx.beginPath();
            ctx.arc(14, midY, 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Text
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '11px "JetBrains Mono", monospace';
            ctx.fillText(sig.name, 26, midY + 4);
        });
    }

    drawCursors(ctx, history, h) {
        const { labelWidth, rulerHeight, cycleWidth, scrollOffset } = this;

        const targetCycle = this.cursorCycle !== null ? this.cursorCycle : this.sim.cycle;
        const cursorX = labelWidth + targetCycle * cycleWidth - scrollOffset;

        if (cursorX >= labelWidth && cursorX <= this.viewWidth) {
            // Vertical yellow cursor line
            ctx.save();
            ctx.strokeStyle = '#ffd200';
            ctx.lineWidth = 1.8;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(cursorX, rulerHeight);
            ctx.lineTo(cursorX, h);
            ctx.stroke();
            ctx.restore();

            // Cursor badge on top
            ctx.fillStyle = '#ffd200';
            ctx.fillRect(cursorX - 22, 2, 44, 16);
            ctx.font = 'bold 10px "JetBrains Mono", monospace';
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';
            ctx.fillText(`T=${targetCycle}`, cursorX, 14);
        }
    }

    exportVCD() {
        let vcd = `$date\n   ${new Date().toUTCString()}\n$end\n`;
        vcd += `$version\n   Memory Simulator VCD Exporter\n$end\n`;
        vcd += `$timescale 1ns $end\n`;
        vcd += `$scope module memory $end\n`;
        this.signals.forEach(s => {
            vcd += `$var wire ${s.bits} ${s.id} ${s.name} $end\n`;
        });
        vcd += `$upscope $end\n$enddefinitions $end\n#0\n$dumpvars\n`;

        this.sim.history.forEach((snap, idx) => {
            vcd += `#${idx * 10}\n`;
            vcd += `b${(snap.inputs.rst || 0)} rst\n`;
            vcd += `b${(snap.inputs.valid || 0)} valid\n`;
            vcd += `b${(snap.inputs.wr_rd || 0)} wr_rd\n`;
            vcd += `b${(snap.inputs.addr || 0).toString(2)} addr\n`;
            vcd += `b${(snap.inputs.wdata || 0).toString(2)} wdata\n`;
            vcd += `b${(snap.outputs.ready || 0)} ready\n`;
            vcd += `b${(snap.outputs.rdata || 0).toString(2)} rdata\n`;
        });

        const blob = new Blob([vcd], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memory_sim_cycle_${this.sim.cycle}.vcd`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

if (typeof window !== 'undefined') {
    window.WaveformViewer = WaveformViewer;
}

