/**
 * LMC-Style Hardware Architecture & Bus Simulation Engine
 * Synchronous Single-Port Memory: DEPTH=256, WIDTH=32, ADDR_WIDTH=8
 * 
 * Features:
 * - DYNAMIC ADAPTIVE FULL-SPACE LAYOUT: Automatically expands to fill 100% of available canvas space
 * - ALL 256 MEMORY BOXES in a 16x16 Matrix with Row & Column Coordinate Headers
 * - Row Headers: 0x00, 0x10, ..., 0xF0 | Column Headers: +0, +1, ..., +F
 * - Ultra-Smooth Slow-Motion Data Transfer Animations (Detailed Bus Glide & Particle Trails)
 * - Crystal-Clear Monospace Typography & Hex Data Tags
 * - Hardware Registers: Control Unit, MAR [7:0], MDR_IN [31:0], MDR_OUT [31:0]
 * - Interactive Click: Click any of the 256 boxes to select that address
 */

class MemorySchematicView {
    constructor(canvasId, containerId, sim) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.container = document.getElementById(containerId);
        this.sim = sim;

        // Animated Data Packets traveling on buses
        this.dataPackets = [];
        this.animFrameId = null;

        // Exactly 16 Columns x 16 Rows = ALL 256 Memory Boxes
        this.gridCols = 16;
        this.gridRows = 16;
        this.totalWords = 256;

        this.dpr = window.devicePixelRatio || 1;
        this.cssWidth = 900;
        this.cssHeight = 700;

        // Initialize layout with default dimensions
        this.updateLayout(this.cssWidth, this.cssHeight);

        if (this.canvas) {
            this.initCanvasResize();
            this.initClickInteraction();
            this.sim.addListener((evt, state, data) => this.onSimEvent(evt, state, data));
            this.startAnimLoop();
        }
    }

    /**
     * Compute dynamic responsive geometry to fill 100% of the canvas
     */
    updateLayout(w, h) {
        this.cssWidth = Math.max(600, w);
        this.cssHeight = Math.max(500, h);

        const leftW = Math.min(220, Math.max(180, Math.round(this.cssWidth * 0.22)));
        const boxX = 64;
        const ramX = boxX + leftW + 36;
        const ramW = Math.max(460, this.cssWidth - ramX - 58);
        const ramY = 10;
        const ramH = Math.max(480, this.cssHeight - 20);

        // Distribute left 4 boxes evenly across ramH
        const totalAvailH = ramH;
        const unitH = (totalAvailH - 30) / 4.25;
        const ctrlH = Math.round(unitH * 1.25);
        const regH = Math.round(unitH);
        const gap = Math.round((totalAvailH - ctrlH - 3 * regH) / 3);

        const ctrlY = ramY;
        const marY = ctrlY + ctrlH + gap;
        const mdrInY = marY + regH + gap;
        const mdrOutY = mdrInY + regH + gap;

        this.layout = {
            width: this.cssWidth,
            height: this.cssHeight,
            pins: {
                clk:   { x: 16, y: ctrlY + 22, name: 'CLK',   bits: 1 },
                rst:   { x: 16, y: ctrlY + 52, name: 'RST',   bits: 1 },
                valid: { x: 16, y: ctrlY + 82, name: 'VALID', bits: 1 },
                wr_rd: { x: 16, y: ctrlY + 112, name: 'WR_RD', bits: 1 },
                addr:  { x: 16, y: marY + regH / 2, name: 'ADDR',  bits: 8 },
                wdata: { x: 16, y: mdrInY + regH / 2, name: 'WDATA', bits: 32 }
            },
            outPins: {
                rdata: { x: ramX + ramW + 14, y: mdrOutY + regH / 2, name: 'RDATA', bits: 32 },
                ready: { x: ramX + ramW + 14, y: ctrlY + 35, name: 'READY', bits: 1 }
            },
            ctrlBox:   { x: boxX, y: ctrlY,   w: leftW, h: ctrlH },
            marBox:    { x: boxX, y: marY,    w: leftW, h: regH },
            mdrInBox:  { x: boxX, y: mdrInY,  w: leftW, h: regH },
            mdrOutBox: { x: boxX, y: mdrOutY, w: leftW, h: regH },
            ramBox:    { x: ramX, y: ramY,    w: ramW,  h: ramH }
        };
    }

    initCanvasResize() {
        const resize = () => {
            if (!this.canvas) return;
            const container = this.canvas.parentElement;
            const rect = container ? container.getBoundingClientRect() : null;
            this.dpr = window.devicePixelRatio || 1;

            const w = (rect && rect.width > 50) ? rect.width : (this.canvas.clientWidth || 880);
            const h = (rect && rect.height > 50) ? rect.height : (this.canvas.clientHeight || 750);

            this.canvas.width = Math.round(w * this.dpr);
            this.canvas.height = Math.round(h * this.dpr);

            this.updateLayout(w, h);
        };

        window.addEventListener('resize', resize);
        resize();
        setTimeout(resize, 40);
        setTimeout(resize, 200);
    }

    initClickInteraction() {
        if (!this.canvas) return;
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            const ram = this.layout.ramBox;
            const headerH = 28;
            const colHeaderH = 18;
            const rowHeaderW = 36;

            const gridX = ram.x + rowHeaderW + 4;
            const gridY = ram.y + headerH + colHeaderH + 2;
            const gridW = ram.w - rowHeaderW - 10;
            const gridH = ram.h - headerH - colHeaderH - 8;

            if (clickX >= gridX && clickX <= gridX + gridW && clickY >= gridY && clickY <= gridY + gridH) {
                const cellW = gridW / this.gridCols;
                const cellH = gridH / this.gridRows;
                const col = Math.floor((clickX - gridX) / cellW);
                const row = Math.floor((clickY - gridY) / cellH);

                if (col >= 0 && col < this.gridCols && row >= 0 && row < this.gridRows) {
                    const targetAddr = row * this.gridCols + col;
                    if (targetAddr < 256) {
                        this.sim.setInput('addr', targetAddr);
                    }
                }
            }
        });
    }

    onSimEvent(eventType, state, data) {
        if (eventType === 'POSEDGE' && data && data.action) {
            this.triggerDataTransferAnimation(data.action, state);
        }
    }

    /**
     * Ultra-Slow Smooth Animated Data Flow along Address and Data Buses
     */
    triggerDataTransferAnimation(action, state) {
        if (!action) return;
        const addr = (action.addr !== undefined) ? action.addr : (state ? state.inputs.addr : 0);
        const wdata = (action.wdata !== undefined) ? action.wdata : (state ? state.inputs.wdata : 0);
        const rdata = (action.rdata !== undefined) ? action.rdata : (state ? state.outputs.rdata : 0);
        const type = action.type || 'NOP';

        const hexWdata = '0x' + (wdata >>> 0).toString(16).toUpperCase().padStart(8, '0');
        const hexRdata = '0x' + (rdata >>> 0).toString(16).toUpperCase().padStart(8, '0');
        const hexAddr = '0x' + (addr & 0xFF).toString(16).toUpperCase().padStart(2, '0');

        const { marBox, mdrInBox, mdrOutBox, ctrlBox, ramBox, pins, outPins } = this.layout;
        const cellCoord = this.getCellCenter(addr);

        // Clear any lingering packets so the new transaction glides cleanly
        this.dataPackets = [];

        // Ultra slow-motion travel speed for detailed human observation
        const slowSpeed = 0.0035;

        if (type === 'WRITE') {
            // 1. Address Packet: Input Pin -> MAR -> Address Bus -> Target Cell in 256 Matrix
            this.spawnPacket({
                text: `ADDR: ${hexAddr} (#${addr})`,
                subtext: '8-bit Address Bus',
                color: '#00f2fe',
                glow: 'rgba(0, 242, 254, 0.85)',
                path: [
                    { x: pins.addr.x + 32, y: pins.addr.y },
                    { x: marBox.x + marBox.w / 2, y: pins.addr.y },
                    { x: marBox.x + marBox.w, y: marBox.y + marBox.h / 2 },
                    { x: ramBox.x, y: marBox.y + marBox.h / 2 },
                    { x: cellCoord.x, y: cellCoord.y }
                ],
                speed: slowSpeed,
                delay: 0
            });

            // 2. Data Packet: Input Pin -> MDR_IN -> Data Write Bus -> Target Cell in 256 Matrix
            this.spawnPacket({
                text: `WDATA: ${hexWdata}`,
                subtext: '32-bit Data Write Bus',
                color: '#00f5a0',
                glow: 'rgba(0, 245, 160, 0.9)',
                path: [
                    { x: pins.wdata.x + 32, y: pins.wdata.y },
                    { x: mdrInBox.x + mdrInBox.w / 2, y: pins.wdata.y },
                    { x: mdrInBox.x + mdrInBox.w, y: mdrInBox.y + mdrInBox.h / 2 },
                    { x: ramBox.x, y: mdrInBox.y + mdrInBox.h / 2 },
                    { x: cellCoord.x, y: cellCoord.y }
                ],
                speed: slowSpeed * 0.95,
                delay: 0.35
            });

            // 3. Control Unit drives READY Strobe
            this.spawnPacket({
                text: 'READY = 1',
                subtext: 'Write Complete',
                color: '#00f5a0',
                glow: 'rgba(0, 245, 160, 0.85)',
                path: [
                    { x: ctrlBox.x + ctrlBox.w, y: ctrlBox.y + 35 },
                    { x: outPins.ready.x, y: outPins.ready.y }
                ],
                speed: slowSpeed * 1.3,
                delay: 0.75
            });

        } else if (type === 'READ') {
            // 1. Address Packet: Input Pin -> MAR -> Address Bus -> Target Cell
            this.spawnPacket({
                text: `ADDR: ${hexAddr} (#${addr})`,
                subtext: '8-bit Address Bus',
                color: '#00f2fe',
                glow: 'rgba(0, 242, 254, 0.85)',
                path: [
                    { x: pins.addr.x + 32, y: pins.addr.y },
                    { x: marBox.x + marBox.w / 2, y: pins.addr.y },
                    { x: marBox.x + marBox.w, y: marBox.y + marBox.h / 2 },
                    { x: ramBox.x, y: marBox.y + marBox.h / 2 },
                    { x: cellCoord.x, y: cellCoord.y }
                ],
                speed: slowSpeed,
                delay: 0
            });

            // 2. Read Data emerges from Target Cell in 256 Matrix -> Data Read Bus -> MDR_OUT
            this.spawnPacket({
                text: `RDATA: ${hexRdata}`,
                subtext: '32-bit Data Read Bus',
                color: '#4facfe',
                glow: 'rgba(79, 172, 254, 0.9)',
                path: [
                    { x: cellCoord.x, y: cellCoord.y },
                    { x: ramBox.x, y: mdrOutBox.y + mdrOutBox.h / 2 },
                    { x: mdrOutBox.x + mdrOutBox.w, y: mdrOutBox.y + mdrOutBox.h / 2 },
                    { x: mdrOutBox.x + mdrOutBox.w / 2, y: mdrOutBox.y + mdrOutBox.h / 2 }
                ],
                speed: slowSpeed * 0.92,
                delay: 0.38
            });

            // 3. MDR_OUT -> RDATA Output Pin
            this.spawnPacket({
                text: hexRdata,
                subtext: 'RDATA Output',
                color: '#4facfe',
                glow: 'rgba(79, 172, 254, 0.9)',
                path: [
                    { x: mdrOutBox.x + mdrOutBox.w / 2, y: mdrOutBox.y + mdrOutBox.h },
                    { x: mdrOutBox.x + mdrOutBox.w / 2, y: outPins.rdata.y },
                    { x: outPins.rdata.x, y: outPins.rdata.y }
                ],
                speed: slowSpeed * 1.2,
                delay: 0.78
            });

            // 4. READY Pulse
            this.spawnPacket({
                text: 'READY = 1',
                subtext: 'Read Ready',
                color: '#00f5a0',
                glow: 'rgba(0, 245, 160, 0.85)',
                path: [
                    { x: ctrlBox.x + ctrlBox.w, y: ctrlBox.y + 35 },
                    { x: outPins.ready.x, y: outPins.ready.y }
                ],
                speed: slowSpeed * 1.3,
                delay: 0.85
            });

        } else if (type === 'RESET') {
            for (let r = 0; r < 4; r++) {
                this.spawnPacket({
                    text: '0x00000000 [CLEAR]',
                    subtext: 'Memory Reset',
                    color: '#ff4b4b',
                    glow: 'rgba(255, 75, 75, 0.85)',
                    path: [
                        { x: ctrlBox.x + ctrlBox.w, y: ctrlBox.y + ctrlBox.h / 2 },
                        { x: ramBox.x, y: ramBox.y + (r * 4 + 2) * 32 },
                        { x: ramBox.x + ramBox.w - 25, y: ramBox.y + (r * 4 + 2) * 32 }
                    ],
                    speed: slowSpeed * 1.1,
                    delay: r * 0.1
                });
            }
        } else if (type === 'NOP') {
            this.spawnPacket({
                text: 'VALID=0 (NOP / GATED)',
                subtext: 'No Bus Activity',
                color: '#ffd200',
                glow: 'rgba(255, 210, 0, 0.7)',
                path: [
                    { x: pins.valid.x + 32, y: pins.valid.y },
                    { x: ctrlBox.x, y: pins.valid.y }
                ],
                speed: slowSpeed * 1.2,
                delay: 0
            });
        }
    }

    spawnPacket(config) {
        this.dataPackets.push({
            text: config.text,
            subtext: config.subtext || '',
            color: config.color || '#00f2fe',
            glow: config.glow || 'rgba(0, 242, 254, 0.6)',
            path: config.path,
            progress: - (config.delay || 0),
            speed: config.speed || 0.009
        });
    }

    getCellCenter(addr) {
        const { ramBox } = this.layout;
        const headerH = 28;
        const colHeaderH = 18;
        const rowHeaderW = 36;

        const gridX = ramBox.x + rowHeaderW + 4;
        const gridY = ramBox.y + headerH + colHeaderH + 2;
        const gridW = ramBox.w - rowHeaderW - 10;
        const gridH = ramBox.h - headerH - colHeaderH - 8;

        const row = Math.floor((addr % 256) / this.gridCols);
        const col = (addr % 256) % this.gridCols;

        const cellW = gridW / this.gridCols;
        const cellH = gridH / this.gridRows;

        return {
            x: gridX + (col + 0.5) * cellW,
            y: gridY + (row + 0.5) * cellH
        };
    }

    startAnimLoop() {
        const loop = (timestamp) => {
            this.render(timestamp);
            this.animFrameId = requestAnimationFrame(loop);
        };
        this.animFrameId = requestAnimationFrame(loop);
    }

    render(timestamp) {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;

        try {
            ctx.save();
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Scale by DPR to render in 1:1 CSS pixels
            ctx.scale(this.dpr, this.dpr);

            const state = this.sim.getState();

            // 1. Draw Background Grid
            this.drawBackground(ctx);

            // 2. Draw Wide Interconnecting Hardware Buses (Address Bus, Data Bus, Control Bus)
            this.drawSystemBuses(ctx, state);

            // 3. Draw Hardware Registers & Blocks (Control Unit, MAR, MDR_IN, MDR_OUT)
            this.drawHardwareRegisters(ctx, state);

            // 4. Draw ALL 256 RAM Memory Mailbox Boxes (with Col/Row Headers)
            this.drawAll256RAMGrid(ctx, state);

            // 5. Draw External Input & Output Signal Pins
            this.drawExternalPins(ctx, state);

            // 6. Update and Render Flying Data Packets
            this.drawDataPackets(ctx);

            ctx.restore();
        } catch (err) {
            console.error('Schematic render error:', err);
            try { ctx.restore(); } catch (e) {}
        }
    }

    drawBackground(ctx) {
        const { width, height } = this.layout;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 20) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += 20) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }
    }

    drawSystemBuses(ctx, state) {
        const { marBox, mdrInBox, mdrOutBox, ctrlBox, ramBox } = this.layout;
        const isValid = state.inputs.valid === 1;
        const isWrite = state.inputs.wr_rd === 1 && isValid;
        const isRead = state.inputs.wr_rd === 0 && isValid;

        ctx.save();

        // 1. ADDRESS BUS (Wide Cyan Conduit) from MAR -> RAM
        const addrBusY = marBox.y + marBox.h / 2;
        ctx.strokeStyle = isValid ? '#00f2fe' : '#234567';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(marBox.x + marBox.w, addrBusY);
        ctx.lineTo(ramBox.x, addrBusY);
        ctx.stroke();

        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillStyle = isValid ? '#00f2fe' : '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText('ADDRESS BUS [8-bit]', (marBox.x + marBox.w + ramBox.x) / 2, addrBusY - 7);

        // 2. DATA WRITE BUS (Wide Green Conduit) from MDR_IN -> RAM
        const dataWriteY = mdrInBox.y + mdrInBox.h / 2;
        ctx.strokeStyle = isWrite ? '#00f5a0' : '#234567';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(mdrInBox.x + mdrInBox.w, dataWriteY);
        ctx.lineTo(ramBox.x, dataWriteY);
        ctx.stroke();

        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillStyle = isWrite ? '#00f5a0' : '#64748b';
        ctx.fillText('DATA WRITE BUS [32-bit]', (mdrInBox.x + mdrInBox.w + ramBox.x) / 2, dataWriteY - 7);

        // 3. DATA READ BUS (Wide Blue Conduit) from RAM -> MDR_OUT
        const dataReadY = mdrOutBox.y + mdrOutBox.h / 2;
        ctx.strokeStyle = isRead ? '#4facfe' : '#234567';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(ramBox.x, dataReadY);
        ctx.lineTo(mdrOutBox.x + mdrOutBox.w, dataReadY);
        ctx.stroke();

        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillStyle = isRead ? '#4facfe' : '#64748b';
        ctx.fillText('DATA READ BUS [32-bit]', (mdrOutBox.x + mdrOutBox.w + ramBox.x) / 2, dataReadY - 7);

        // 4. CONTROL BUS from Control Unit -> RAM & Registers
        ctx.strokeStyle = isValid ? '#ffd200' : '#234567';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(ctrlBox.x + ctrlBox.w, ctrlBox.y + Math.min(100, ctrlBox.h - 20));
        ctx.lineTo(ramBox.x, ctrlBox.y + Math.min(100, ctrlBox.h - 20));
        ctx.stroke();

        ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
        ctx.fillStyle = isValid ? '#ffd200' : '#64748b';
        ctx.fillText('CONTROL BUS (VALID, WR_RD, CLK, RST)', (ctrlBox.x + ctrlBox.w + ramBox.x) / 2, ctrlBox.y + Math.min(100, ctrlBox.h - 20) - 7);

        ctx.restore();
    }

    drawHardwareRegisters(ctx, state) {
        const { ctrlBox, marBox, mdrInBox, mdrOutBox } = this.layout;
        const inputs = state.inputs;
        const outputs = state.outputs;
        const isValid = inputs.valid === 1;

        ctx.save();

        // 1. CONTROL UNIT (CTRL)
        ctx.fillStyle = '#0c1a2e';
        ctx.strokeStyle = isValid ? '#ffd200' : '#234567';
        ctx.lineWidth = 1.8;
        this.roundRect(ctx, ctrlBox.x, ctrlBox.y, ctrlBox.w, ctrlBox.h, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffd200';
        ctx.textAlign = 'center';
        ctx.fillText('CONTROL UNIT', ctrlBox.x + ctrlBox.w / 2, ctrlBox.y + 20);

        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#8892b0';
        ctx.fillText('Timing & Micro-Sequencer', ctrlBox.x + ctrlBox.w / 2, ctrlBox.y + 34);

        // State Pill inside Control Unit
        ctx.fillStyle = inputs.rst ? 'rgba(255, 75, 75, 0.2)' : (isValid ? (inputs.wr_rd ? 'rgba(0, 245, 160, 0.2)' : 'rgba(0, 242, 254, 0.2)') : 'rgba(255, 255, 255, 0.05)');
        this.roundRect(ctx, ctrlBox.x + 10, ctrlBox.y + 42, ctrlBox.w - 20, 26, 4);
        ctx.fill();

        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillStyle = inputs.rst ? '#ff4b4b' : (isValid ? (inputs.wr_rd ? '#00f5a0' : '#00f2fe') : '#64748b');
        const stateText = inputs.rst ? 'RESET ACTIVE' : (isValid ? (inputs.wr_rd ? 'WRITE IN PROGRESS' : 'READ IN PROGRESS') : 'IDLE / VALID=0');
        ctx.fillText(stateText, ctrlBox.x + ctrlBox.w / 2, ctrlBox.y + 59);

        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#a0aec0';
        ctx.fillText(`CLK: ${state.clk ? 'HIGH (1)' : 'LOW (0)'} | READY: ${outputs.ready}`, ctrlBox.x + ctrlBox.w / 2, ctrlBox.y + 86);
        ctx.fillText(`Sync Cycle #${state.cycle}`, ctrlBox.x + ctrlBox.w / 2, ctrlBox.y + 104);

        // 2. MEMORY ADDRESS REGISTER (MAR / ADDR [7:0])
        ctx.fillStyle = '#0c1a2e';
        ctx.strokeStyle = isValid ? '#00f2fe' : '#234567';
        ctx.lineWidth = 1.8;
        this.roundRect(ctx, marBox.x, marBox.y, marBox.w, marBox.h, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillStyle = '#00f2fe';
        ctx.fillText('ADDRESS REGISTER (MAR)', marBox.x + marBox.w / 2, marBox.y + 18);

        ctx.font = '8.5px "JetBrains Mono", monospace';
        ctx.fillStyle = '#8892b0';
        ctx.fillText('ADDR [7:0] (0 to 255)', marBox.x + marBox.w / 2, marBox.y + 31);

        // Register Content Box
        const marContentH = Math.max(36, marBox.h - 48);
        ctx.fillStyle = 'rgba(0, 242, 254, 0.1)';
        this.roundRect(ctx, marBox.x + 10, marBox.y + 38, marBox.w - 20, marContentH, 4);
        ctx.fill();

        ctx.font = 'bold 13.5px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`0x${inputs.addr.toString(16).toUpperCase().padStart(2, '0')} (${inputs.addr})`, marBox.x + marBox.w / 2, marBox.y + 58);

        if (marContentH > 40) {
            ctx.font = '8px "JetBrains Mono", monospace';
            ctx.fillStyle = '#00f2fe';
            ctx.fillText(`Bin: ${inputs.addr.toString(2).padStart(8, '0')}`, marBox.x + marBox.w / 2, marBox.y + 74);
        }

        // 3. WRITE DATA REGISTER (MDR_IN / WDATA [31:0])
        ctx.fillStyle = '#0c1a2e';
        ctx.strokeStyle = (isValid && inputs.wr_rd) ? '#00f5a0' : '#234567';
        ctx.lineWidth = 1.8;
        this.roundRect(ctx, mdrInBox.x, mdrInBox.y, mdrInBox.w, mdrInBox.h, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillStyle = '#00f5a0';
        ctx.fillText('WRITE DATA REG (MDR_IN)', mdrInBox.x + mdrInBox.w / 2, mdrInBox.y + 18);

        ctx.font = '8.5px "JetBrains Mono", monospace';
        ctx.fillStyle = '#8892b0';
        ctx.fillText('WDATA [31:0] Input Latch', mdrInBox.x + mdrInBox.w / 2, mdrInBox.y + 31);

        // Register Content Box
        const mdrInContentH = Math.max(36, mdrInBox.h - 48);
        ctx.fillStyle = (isValid && inputs.wr_rd) ? 'rgba(0, 245, 160, 0.12)' : 'rgba(255, 255, 255, 0.04)';
        this.roundRect(ctx, mdrInBox.x + 10, mdrInBox.y + 38, mdrInBox.w - 20, mdrInContentH, 4);
        ctx.fill();

        ctx.font = 'bold 11.5px "JetBrains Mono", monospace';
        ctx.fillStyle = (isValid && inputs.wr_rd) ? '#00f5a0' : '#64748b';
        const hexWdata = '0x' + (inputs.wdata >>> 0).toString(16).toUpperCase().padStart(8, '0');
        ctx.fillText(hexWdata, mdrInBox.x + mdrInBox.w / 2, mdrInBox.y + 58);

        if (mdrInContentH > 40) {
            ctx.font = '8px "JetBrains Mono", monospace';
            ctx.fillStyle = '#a0aec0';
            ctx.fillText(`Dec: ${inputs.wdata}`, mdrInBox.x + mdrInBox.w / 2, mdrInBox.y + 74);
        }

        // 4. READ DATA REGISTER (MDR_OUT / RDATA [31:0])
        ctx.fillStyle = '#0c1a2e';
        ctx.strokeStyle = (isValid && !inputs.wr_rd) ? '#4facfe' : '#234567';
        ctx.lineWidth = 1.8;
        this.roundRect(ctx, mdrOutBox.x, mdrOutBox.y, mdrOutBox.w, mdrOutBox.h, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillStyle = '#4facfe';
        ctx.fillText('READ DATA REG (MDR_OUT)', mdrOutBox.x + mdrOutBox.w / 2, mdrOutBox.y + 18);

        ctx.font = '8.5px "JetBrains Mono", monospace';
        ctx.fillStyle = '#8892b0';
        ctx.fillText('RDATA [31:0] Synchronous Reg', mdrOutBox.x + mdrOutBox.w / 2, mdrOutBox.y + 31);

        // Register Content Box
        const mdrOutContentH = Math.max(36, mdrOutBox.h - 48);
        ctx.fillStyle = (isValid && !inputs.wr_rd) ? 'rgba(79, 172, 254, 0.12)' : 'rgba(255, 255, 255, 0.04)';
        this.roundRect(ctx, mdrOutBox.x + 10, mdrOutBox.y + 38, mdrOutBox.w - 20, mdrOutContentH, 4);
        ctx.fill();

        ctx.font = 'bold 11.5px "JetBrains Mono", monospace';
        ctx.fillStyle = outputs.ready && state.lastAction.type === 'READ' ? '#4facfe' : '#ffffff';
        const hexRdata = '0x' + (outputs.rdata >>> 0).toString(16).toUpperCase().padStart(8, '0');
        ctx.fillText(hexRdata, mdrOutBox.x + mdrOutBox.w / 2, mdrOutBox.y + 58);

        if (mdrOutContentH > 40) {
            ctx.font = '8px "JetBrains Mono", monospace';
            ctx.fillStyle = '#a0aec0';
            ctx.fillText(`Dec: ${outputs.rdata}`, mdrOutBox.x + mdrOutBox.w / 2, mdrOutBox.y + 74);
        }

        ctx.restore();
    }

    drawAll256RAMGrid(ctx, state) {
        const ram = this.layout.ramBox;
        const currentAddr = state.inputs.addr;
        const isValid = state.inputs.valid === 1;

        ctx.save();

        // 1. RAM Matrix Outer Enclosure
        ctx.fillStyle = '#081220';
        ctx.strokeStyle = '#1e3a5f';
        ctx.lineWidth = 1.8;
        this.roundRect(ctx, ram.x, ram.y, ram.w, ram.h, 7);
        ctx.fill();
        ctx.stroke();

        // 2. RAM Header Banner
        ctx.fillStyle = '#0d1f38';
        this.roundRect(ctx, ram.x + 2, ram.y + 2, ram.w - 4, 26, 5);
        ctx.fill();

        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText('MAIN RAM CORE: ALL 256 MEMORY BOXES (16 × 16 MATRIX)', ram.x + 10, ram.y + 17);

        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#00f2fe';
        ctx.textAlign = 'right';
        ctx.fillText(`Active Box: 0x${currentAddr.toString(16).toUpperCase().padStart(2, '0')} (#${currentAddr})`, ram.x + ram.w - 10, ram.y + 17);

        // 3. Matrix Coordinates Geometry
        const headerH = 28;
        const colHeaderH = 18;
        const rowHeaderW = 36;

        const gridX = ram.x + rowHeaderW + 4;
        const gridY = ram.y + headerH + colHeaderH + 2;
        const gridW = ram.w - rowHeaderW - 10;
        const gridH = ram.h - headerH - colHeaderH - 8;
        const cellW = gridW / this.gridCols;
        const cellH = gridH / this.gridRows;

        // 4. Render Column Headers (+0 .. +F)
        ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        const hexCols = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
        for (let c = 0; c < 16; c++) {
            const cx = gridX + c * cellW + cellW / 2;
            const isCurCol = (currentAddr % 16 === c) && isValid;
            ctx.fillStyle = isCurCol ? '#00f2fe' : '#64748b';
            ctx.fillText(`+${hexCols[c]}`, cx, ram.y + headerH + 13);
        }

        // 5. Render Row Headers (0x00 .. 0xF0)
        ctx.textAlign = 'right';
        for (let r = 0; r < 16; r++) {
            const cy = gridY + r * cellH + cellH / 2 + 3;
            const rowBaseAddr = (r * 16).toString(16).toUpperCase().padStart(2, '0');
            const isCurRow = (Math.floor(currentAddr / 16) === r) && isValid;
            ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
            ctx.fillStyle = isCurRow ? '#00f2fe' : '#64748b';
            ctx.fillText(`0x${rowBaseAddr}`, gridX - 5, cy);
        }

        // 6. Render ALL 16x16 = 256 Memory Mailbox Cells
        for (let r = 0; r < this.gridRows; r++) {
            for (let c = 0; c < this.gridCols; c++) {
                const cellAddr = r * this.gridCols + c;
                if (cellAddr >= 256) continue;

                const cx = gridX + c * cellW;
                const cy = gridY + r * cellH;
                const isSelected = cellAddr === currentAddr && isValid;
                const cellVal = this.sim.inspectMemory(cellAddr);
                const isModified = this.sim.modifiedAddresses.has(cellAddr);

                ctx.save();

                // Mailbox Box Container
                if (isSelected) {
                    ctx.fillStyle = state.inputs.wr_rd === 1 ? 'rgba(0, 245, 160, 0.45)' : 'rgba(0, 242, 254, 0.45)';
                    ctx.strokeStyle = state.inputs.wr_rd === 1 ? '#00f5a0' : '#00f2fe';
                    ctx.lineWidth = 2;
                } else if (isModified) {
                    ctx.fillStyle = 'rgba(255, 210, 0, 0.16)';
                    ctx.strokeStyle = '#ffd200';
                    ctx.lineWidth = 1.2;
                } else {
                    ctx.fillStyle = '#091526';
                    ctx.strokeStyle = '#182c44';
                    ctx.lineWidth = 1;
                }

                this.roundRect(ctx, cx + 1, cy + 1, cellW - 2, cellH - 2, 2.5);
                ctx.fill();
                ctx.stroke();

                // Top Line: 2-digit Hex Address Badge (00 to FF)
                const hexAddr = cellAddr.toString(16).toUpperCase().padStart(2, '0');
                ctx.font = 'bold 7.5px "JetBrains Mono", monospace';
                ctx.fillStyle = isSelected ? '#ffffff' : (isModified ? '#ffd200' : '#00f2fe');
                ctx.textAlign = 'left';
                ctx.fillText(`0x${hexAddr}`, cx + 2.5, cy + Math.min(10, cellH * 0.32));

                // Right: Dec Index
                ctx.font = '6.5px "JetBrains Mono", monospace';
                ctx.fillStyle = '#64748b';
                ctx.textAlign = 'right';
                ctx.fillText(`#${cellAddr}`, cx + cellW - 2.5, cy + Math.min(10, cellH * 0.32));

                // Center: 32-bit Hex Data (High-Clarity Rendering)
                const hexData = (cellVal >>> 0).toString(16).toUpperCase().padStart(8, '0');
                ctx.font = 'bold 7.5px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';

                const midY1 = cy + cellH * 0.62;
                const midY2 = cy + cellH * 0.90;

                if (cellH >= 28) {
                    if (isSelected) {
                        ctx.fillStyle = state.inputs.wr_rd === 1 ? '#00f5a0' : '#4facfe';
                        ctx.fillText(hexData.slice(0, 4), cx + cellW / 2, midY1);
                        ctx.fillText(hexData.slice(4), cx + cellW / 2, midY2);
                    } else if (cellVal !== 0) {
                        ctx.fillStyle = '#64ffda';
                        ctx.fillText(hexData.slice(0, 4), cx + cellW / 2, midY1);
                        ctx.fillText(hexData.slice(4), cx + cellW / 2, midY2);
                    } else {
                        ctx.fillStyle = '#475569';
                        ctx.fillText('0000', cx + cellW / 2, midY1);
                        ctx.fillText('0000', cx + cellW / 2, midY2);
                    }
                } else {
                    // Compact rendering for small cell heights
                    if (isSelected) ctx.fillStyle = '#00f5a0';
                    else if (cellVal !== 0) ctx.fillStyle = '#64ffda';
                    else ctx.fillStyle = '#475569';
                    ctx.fillText(hexData.slice(0, 4), cx + cellW / 2, cy + cellH / 2 + 3);
                }

                ctx.restore();
            }
        }

        ctx.restore();
    }

    drawExternalPins(ctx, state) {
        const { pins, outPins, ctrlBox, marBox, mdrInBox, mdrOutBox } = this.layout;
        const inputs = state.inputs;
        const outputs = state.outputs;

        // Input Ports (Left)
        for (const [key, p] of Object.entries(pins)) {
            const isClkActive = key === 'clk' && state.clk === 1;
            const isRstActive = key === 'rst' && inputs.rst === 1;
            const isValidActive = key === 'valid' && inputs.valid === 1;

            let strokeColor = '#334e68';
            if (key === 'clk') strokeColor = isClkActive ? '#00f5a0' : '#334e68';
            else if (key === 'rst') strokeColor = isRstActive ? '#ff4b4b' : '#334e68';
            else if (key === 'wr_rd') strokeColor = inputs.wr_rd ? '#ffd200' : '#4facfe';
            else if (key === 'valid') strokeColor = isValidActive ? '#00f5a0' : '#334e68';
            else if (key === 'addr') strokeColor = isValidActive ? '#00f2fe' : '#334e68';
            else if (key === 'wdata') strokeColor = (isValidActive && inputs.wr_rd) ? '#00f5a0' : '#334e68';

            ctx.save();
            ctx.fillStyle = '#0f1c33';
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1.4;
            this.roundRect(ctx, p.x - 16, p.y - 11, 48, 22, 3.5);
            ctx.fill();
            ctx.stroke();

            ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
            ctx.fillStyle = strokeColor === '#334e68' ? '#94a3b8' : strokeColor;
            ctx.textAlign = 'center';
            ctx.fillText(p.name, p.x + 8, p.y + 3.5);

            // Wire from pin to destination register
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = p.bits > 1 ? 2.5 : 1.8;
            ctx.beginPath();
            ctx.moveTo(p.x + 32, p.y);

            if (key === 'addr') {
                ctx.lineTo(marBox.x, p.y);
            } else if (key === 'wdata') {
                ctx.lineTo(mdrInBox.x, p.y);
            } else {
                ctx.lineTo(ctrlBox.x, p.y);
            }
            ctx.stroke();

            ctx.restore();
        }

        // Output Ports (Right)
        for (const [key, p] of Object.entries(outPins)) {
            const isReadActive = key === 'rdata' && state.lastAction.type === 'READ' && outputs.ready;
            const isReadyActive = key === 'ready' && outputs.ready === 1;

            let strokeColor = '#334e68';
            if (isReadActive) strokeColor = '#4facfe';
            else if (isReadyActive) strokeColor = '#00f5a0';

            ctx.save();
            ctx.fillStyle = '#0f1c33';
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1.4;
            this.roundRect(ctx, p.x - 18, p.y - 11, 50, 22, 3.5);
            ctx.fill();
            ctx.stroke();

            ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
            ctx.fillStyle = strokeColor === '#334e68' ? '#94a3b8' : strokeColor;
            ctx.textAlign = 'center';
            ctx.fillText(p.name, p.x + 7, p.y + 3.5);

            ctx.restore();
        }
    }

    /**
     * Draw Flying Data Capsules with Slow-Motion Glowing Particle Effect
     */
    drawDataPackets(ctx) {
        for (let i = this.dataPackets.length - 1; i >= 0; i--) {
            const pkt = this.dataPackets[i];
            pkt.progress += pkt.speed;

            if (pkt.progress > 1.0) {
                this.dataPackets.splice(i, 1);
                continue;
            }
            if (pkt.progress < 0) continue;

            const pos = this.interpolatePath(pkt.path, pkt.progress);

            ctx.save();
            ctx.shadowColor = pkt.glow;
            ctx.shadowBlur = 12;

            // Glowing Capsule
            const textWidth = ctx.measureText(pkt.text).width + 24;
            const capW = Math.max(88, textWidth);
            const capH = 22;

            ctx.fillStyle = '#070f1e';
            ctx.strokeStyle = pkt.color;
            ctx.lineWidth = 1.8;
            this.roundRect(ctx, pos.x - capW / 2, pos.y - capH / 2, capW, capH, 11);
            ctx.fill();
            ctx.stroke();

            // Text Readout
            ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
            ctx.fillStyle = pkt.color;
            ctx.textAlign = 'center';
            ctx.fillText(pkt.text, pos.x, pos.y + 3.5);

            if (pkt.subtext) {
                ctx.font = '7.5px "JetBrains Mono", monospace';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(pkt.subtext, pos.x, pos.y - 14);
            }

            // Trailing Energy Sparkles
            for (let s = 1; s <= 3; s++) {
                const trailProgress = Math.max(0, pkt.progress - s * 0.04);
                const trailPos = this.interpolatePath(pkt.path, trailProgress);
                ctx.fillStyle = pkt.color;
                ctx.globalAlpha = 0.4 / s;
                ctx.beginPath();
                ctx.arc(trailPos.x, trailPos.y, 4 - s, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    interpolatePath(path, progress) {
        if (!path || path.length === 0) return { x: 0, y: 0 };
        if (path.length === 1) return path[0];

        let totalLen = 0;
        const segLens = [];
        for (let i = 0; i < path.length - 1; i++) {
            const dx = path[i + 1].x - path[i].x;
            const dy = path[i + 1].y - path[i].y;
            const len = Math.sqrt(dx * dx + dy * dy);
            segLens.push(len);
            totalLen += len;
        }

        const targetDist = progress * totalLen;
        let accum = 0;

        for (let i = 0; i < segLens.length; i++) {
            if (accum + segLens[i] >= targetDist || i === segLens.length - 1) {
                const segT = segLens[i] > 0 ? (targetDist - accum) / segLens[i] : 0;
                const clampedT = Math.max(0, Math.min(1, segT));
                return {
                    x: path[i].x + (path[i + 1].x - path[i].x) * clampedT,
                    y: path[i].y + (path[i + 1].y - path[i].y) * clampedT
                };
            }
            accum += segLens[i];
        }

        return path[path.length - 1];
    }

    roundRect(ctx, x, y, width, height, radius = 4) {
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, radius);
            return;
        }
        let r = { tl: 4, tr: 4, br: 4, bl: 4 };
        if (typeof radius === 'number') {
            r = { tl: radius, tr: radius, br: radius, bl: radius };
        } else if (Array.isArray(radius)) {
            r = {
                tl: radius[0] !== undefined ? radius[0] : 4,
                tr: radius[1] !== undefined ? radius[1] : 4,
                br: radius[2] !== undefined ? radius[2] : 4,
                bl: radius[3] !== undefined ? radius[3] : 4
            };
        } else if (radius && typeof radius === 'object') {
            r = {
                tl: radius.tl || 0,
                tr: radius.tr || 0,
                br: radius.br || 0,
                bl: radius.bl || 0
            };
        }
        ctx.beginPath();
        ctx.moveTo(x + r.tl, y);
        ctx.lineTo(x + width - r.tr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r.tr);
        ctx.lineTo(x + width, y + height - r.br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r.br, y + height);
        ctx.lineTo(x + r.bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r.bl);
        ctx.lineTo(x, y + r.tl);
        ctx.quadraticCurveTo(x, y, x + r.tl, y);
        ctx.closePath();
    }
}

if (typeof window !== 'undefined') {
    window.MemorySchematicView = MemorySchematicView;
}
