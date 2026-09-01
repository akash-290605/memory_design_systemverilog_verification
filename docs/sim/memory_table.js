/**
 * High-Performance Virtualized 256-Row Memory Matrix Table & Heatmap Inspector
 * Parameterized for DEPTH=256, WIDTH=32, ADDR_WIDTH=8 ($clog2(256))
 */

class MemoryTableView {
    constructor(containerId, heatmapId, sim) {
        this.container = document.getElementById(containerId);
        this.heatmapCanvas = document.getElementById(heatmapId);
        this.sim = sim;

        this.filterMode = 'all'; // 'modified' or 'all'
        this.searchQuery = '';
        this.rowHeight = 36;
        this.visibleRows = [];
        this.scrollTop = 0;

        this.initDOM();
        this.initHeatmap();

        this.sim.addListener((evt, state, data) => {
            this.updateDataList();
            this.renderHeatmap();
            this.render();
        });

        this.updateDataList();
        this.renderHeatmap();
        this.render();
    }

    initDOM() {
        this.container.innerHTML = `
            <div class="mem-toolbar">
                <div class="mem-filter-group">
                    <button class="btn-filter" id="mem-filter-mod" data-mode="modified">
                        <span class="dot-indicator dot-yellow"></span> Modified (<span id="mod-count">0</span>)
                    </button>
                    <button class="btn-filter active" id="mem-filter-all" data-mode="all">
                        <span class="dot-indicator dot-blue"></span> All ${this.sim.DEPTH} Locations
                    </button>
                </div>
                <div class="mem-search-box">
                    <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
                    </svg>
                    <input type="text" id="mem-search-input" placeholder="Search address (5, 0x05) or data (0xDEADBEEF)..." />
                    <button id="mem-search-clear" class="btn-icon" title="Clear search">×</button>
                </div>
                <div class="mem-action-btns">
                    <button class="btn-secondary btn-sm" id="btn-export-hex" title="Export in Verilog $readmemh format">
                        <span>⬇ Export .hex</span>
                    </button>
                    <button class="btn-secondary btn-sm" id="btn-clear-mem" title="Clear all memory to zero">
                        <span>🗑 Clear RAM</span>
                    </button>
                </div>
            </div>
            <div class="mem-table-wrapper">
                <div class="mem-table-header">
                    <div class="th th-addr-hex">ADDR (HEX)</div>
                    <div class="th th-addr-dec">DEC</div>
                    <div class="th th-data-hex">DATA (HEX)</div>
                    <div class="th th-data-dec">DATA (DEC)</div>
                    <div class="th th-data-bin">DATA (32-BIT BINARY)</div>
                    <div class="th th-ascii">ASCII</div>
                    <div class="th th-status">STATUS</div>
                    <div class="th th-action">ACTION</div>
                </div>
                <div class="mem-virtual-scroll" id="mem-scroll-pane">
                    <div class="mem-virtual-spacer" id="mem-spacer"></div>
                    <div class="mem-rows-container" id="mem-rows"></div>
                </div>
            </div>
        `;

        this.scrollPane = this.container.querySelector('#mem-scroll-pane');
        this.spacer = this.container.querySelector('#mem-spacer');
        this.rowsContainer = this.container.querySelector('#mem-rows');
        this.modCountBadge = this.container.querySelector('#mod-count');
        this.searchInput = this.container.querySelector('#mem-search-input');

        // Event bindings
        this.container.querySelector('#mem-filter-mod').addEventListener('click', () => {
            this.setFilterMode('modified');
        });
        this.container.querySelector('#mem-filter-all').addEventListener('click', () => {
            this.setFilterMode('all');
        });

        this.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.trim().toLowerCase();
            this.updateDataList();
            this.render();
        });

        this.container.querySelector('#mem-search-clear').addEventListener('click', () => {
            this.searchInput.value = '';
            this.searchQuery = '';
            this.updateDataList();
            this.render();
        });

        this.container.querySelector('#btn-export-hex').addEventListener('click', () => {
            this.exportHex();
        });

        this.container.querySelector('#btn-clear-mem').addEventListener('click', () => {
            if (confirm(`Clear all ${this.sim.DEPTH} memory locations to 0x00000000?`)) {
                this.sim.mem.fill(0);
                this.sim.modifiedAddresses.clear();
                this.sim.notify('SIMULATOR_RESET');
            }
        });

        this.scrollPane.addEventListener('scroll', () => {
            this.scrollTop = this.scrollPane.scrollTop;
            this.renderRows();
        });
    }

    initHeatmap() {
        if (!this.heatmapCanvas) return;
        this.heatmapCtx = this.heatmapCanvas.getContext('2d');

        const resizeHeatmap = () => {
            const rect = this.heatmapCanvas.parentElement.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const w = rect.width || 600;
            const h = 24;

            this.heatmapCanvas.width = w * dpr;
            this.heatmapCanvas.height = h * dpr;
            this.heatmapCanvas.style.width = `${w}px`;
            this.heatmapCanvas.style.height = `${h}px`;
            this.renderHeatmap();
        };

        window.addEventListener('resize', resizeHeatmap);
        setTimeout(resizeHeatmap, 50);

        this.heatmapCanvas.addEventListener('click', (e) => {
            const rect = this.heatmapCanvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, clickX / rect.width));
            const targetAddr = Math.floor(ratio * (this.sim.DEPTH - 1));

            // Select this address in input controls
            this.sim.setInput('addr', targetAddr);
            this.scrollToAddress(targetAddr);
        });
    }

    setFilterMode(mode) {
        this.filterMode = mode;
        this.container.querySelector('#mem-filter-mod').classList.toggle('active', mode === 'modified');
        this.container.querySelector('#mem-filter-all').classList.toggle('active', mode === 'all');
        this.updateDataList();
        this.render();
    }

    updateDataList() {
        const query = this.searchQuery;
        const mode = this.filterMode;
        const list = [];
        const modifiedSet = this.sim.modifiedAddresses;

        this.modCountBadge.textContent = modifiedSet.size;

        for (let addr = 0; addr < this.sim.DEPTH; addr++) {
            const val = this.sim.mem[addr];
            const isMod = modifiedSet.has(addr);
            const isNonZero = val !== 0;

            if (mode === 'modified' && !isMod && !isNonZero) {
                continue;
            }

            // Search filter
            if (query) {
                const hexAddr = addr.toString(16).toLowerCase();
                const decAddr = addr.toString();
                const hexVal = val.toString(16).toLowerCase();
                const decVal = val.toString();

                const match = hexAddr.includes(query) ||
                              decAddr === query ||
                              `0x${hexAddr}`.includes(query) ||
                              hexVal.includes(query) ||
                              `0x${hexVal}`.includes(query) ||
                              decVal.includes(query);

                if (!match) continue;
            }

            list.push(addr);
        }

        this.visibleRows = list;
    }

    scrollToAddress(addr) {
        const idx = this.visibleRows.indexOf(addr);
        if (idx >= 0) {
            this.scrollPane.scrollTop = idx * this.rowHeight;
        } else if (this.filterMode === 'modified') {
            this.setFilterMode('all');
            const newIdx = this.visibleRows.indexOf(addr);
            if (newIdx >= 0) {
                this.scrollPane.scrollTop = newIdx * this.rowHeight;
            }
        }
    }

    render() {
        const totalRows = this.visibleRows.length;
        const totalHeight = totalRows * this.rowHeight;
        this.spacer.style.height = `${totalHeight}px`;

        this.renderRows();
    }

    renderRows() {
        const paneHeight = this.scrollPane.clientHeight || 400;
        const startIndex = Math.max(0, Math.floor(this.scrollTop / this.rowHeight) - 4);
        const endIndex = Math.min(this.visibleRows.length - 1, Math.ceil((this.scrollTop + paneHeight) / this.rowHeight) + 4);

        this.rowsContainer.style.transform = `translateY(${startIndex * this.rowHeight}px)`;

        let html = '';
        const curSimAddr = this.sim.inputs.addr;
        const lastAction = this.sim.lastAction;

        if (this.visibleRows.length === 0) {
            html = `
                <div class="mem-empty-state">
                    <p>No memory locations match your filter/search.</p>
                    <button class="btn-secondary btn-sm" onclick="document.querySelector('#mem-filter-all').click()">Show All ${this.sim.DEPTH} Locations</button>
                </div>
            `;
            this.rowsContainer.innerHTML = html;
            return;
        }

        for (let i = startIndex; i <= endIndex; i++) {
            const addr = this.visibleRows[i];
            if (addr === undefined) continue;

            const val = this.sim.mem[addr];
            const isMod = this.sim.modifiedAddresses.has(addr);
            const isSelected = addr === curSimAddr;
            const isLastAction = lastAction && lastAction.addr === addr && lastAction.type !== 'INIT' && lastAction.type !== 'NOP';

            const hexAddr = '0x' + addr.toString(16).toUpperCase().padStart(2, '0');
            const hexData = '0x' + val.toString(16).toUpperCase().padStart(8, '0');
            const binData = this.formatBinary32(val);
            const asciiPreview = this.formatAscii32(val);

            let statusBadge = '<span class="badge badge-zero">0x0</span>';
            if (isLastAction) {
                statusBadge = lastAction.type === 'WRITE' 
                    ? `<span class="badge badge-write">JUST WRITTEN</span>`
                    : `<span class="badge badge-read">JUST READ</span>`;
            } else if (isMod) {
                statusBadge = `<span class="badge badge-mod">MODIFIED</span>`;
            }

            html += `
                <div class="mem-row ${isSelected ? 'selected' : ''} ${isMod ? 'is-modified' : ''}" data-addr="${addr}">
                    <div class="td th-addr-hex"><span class="code-font text-cyan">${hexAddr}</span></div>
                    <div class="td th-addr-dec"><span class="code-font text-muted">${addr}</span></div>
                    <div class="td th-data-hex"><span class="code-font ${val !== 0 ? 'text-green bold' : 'text-slate'}">${hexData}</span></div>
                    <div class="td th-data-dec"><span class="code-font text-muted">${val}</span></div>
                    <div class="td th-data-bin"><span class="code-font text-xs text-bin">${binData}</span></div>
                    <div class="td th-ascii"><span class="code-font text-xs text-amber">${asciiPreview}</span></div>
                    <div class="td th-status">${statusBadge}</div>
                    <div class="td th-action">
                        <button class="btn-cell-action btn-select-addr" title="Load Address ${addr}" data-addr="${addr}">Select</button>
                        <button class="btn-cell-action btn-edit-cell" title="Edit 32-bit Value" data-addr="${addr}">Edit</button>
                    </div>
                </div>
            `;
        }

        this.rowsContainer.innerHTML = html;

        // Attach quick row click listeners
        this.rowsContainer.querySelectorAll('.btn-select-addr').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const a = parseInt(e.currentTarget.dataset.addr, 10);
                this.sim.setInput('addr', a);
            });
        });

        this.rowsContainer.querySelectorAll('.btn-edit-cell').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const a = parseInt(e.currentTarget.dataset.addr, 10);
                const curVal = '0x' + this.sim.mem[a].toString(16).toUpperCase().padStart(8, '0');
                const newVal = prompt(`Directly enter 32-bit Hex or Dec value for Mem[${a}] (0x${a.toString(16).toUpperCase()}):`, curVal);
                if (newVal !== null) {
                    let parsed = 0;
                    if (newVal.startsWith('0x') || newVal.startsWith('0X')) {
                        parsed = parseInt(newVal, 16);
                    } else {
                        parsed = parseInt(newVal, 10);
                    }
                    if (!isNaN(parsed)) {
                        this.sim.preloadMemory(a, parsed >>> 0);
                    }
                }
            });
        });
    }

    renderHeatmap() {
        if (!this.heatmapCtx || !this.heatmapCanvas) return;
        const ctx = this.heatmapCtx;
        const w = this.heatmapCanvas.width;
        const h = this.heatmapCanvas.height;

        ctx.clearRect(0, 0, w, h);

        // Base dark background
        ctx.fillStyle = '#112240';
        ctx.fillRect(0, 0, w, h);

        const totalWords = this.sim.DEPTH;
        const currentAddr = this.sim.inputs.addr;

        // Draw occupancy bins
        const numBins = Math.min(w, totalWords);
        const wordsPerBin = totalWords / numBins;

        for (let b = 0; b < numBins; b++) {
            const startWord = Math.floor(b * wordsPerBin);
            const endWord = Math.min(totalWords, Math.floor((b + 1) * wordsPerBin));

            let nonZeroCount = 0;
            for (let i = startWord; i < endWord; i++) {
                if (this.sim.mem[i] !== 0) nonZeroCount++;
            }

            const bx = (b / numBins) * w;
            const bw = (1 / numBins) * w + 1;

            if (nonZeroCount > 0) {
                const intensity = Math.min(1.0, 0.3 + (nonZeroCount / (endWord - startWord)) * 0.7);
                ctx.fillStyle = `rgba(0, 245, 160, ${intensity})`;
                ctx.fillRect(bx, 0, bw, h);
            }
        }

        // Active Pointer Line
        const curRatio = currentAddr / (totalWords - 1);
        const curX = curRatio * w;
        ctx.fillStyle = '#00f2fe';
        ctx.fillRect(curX - 1.5, 0, 3, h);

        // Border
        ctx.strokeStyle = '#233554';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, w, h);
    }

    formatBinary32(val) {
        const bin = (val >>> 0).toString(2).padStart(32, '0');
        return `${bin.slice(0,8)} ${bin.slice(8,16)} ${bin.slice(16,24)} ${bin.slice(24,32)}`;
    }

    formatAscii32(val) {
        const b3 = (val >> 24) & 0xFF;
        const b2 = (val >> 16) & 0xFF;
        const b1 = (val >> 8) & 0xFF;
        const b0 = val & 0xFF;

        const toChr = (b) => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '·';
        return `${toChr(b3)}${toChr(b2)}${toChr(b1)}${toChr(b0)}`;
    }

    exportHex() {
        let hexContent = `// Verilog $readmemh Memory Dump\n// 1 KB (256 x 32-bit, ADDR_WIDTH=8)\n`;
        for (let i = 0; i < this.sim.DEPTH; i++) {
            const hex = this.sim.mem[i].toString(16).toUpperCase().padStart(8, '0');
            hexContent += `@${i.toString(16).toUpperCase().padStart(2, '0')} ${hex}\n`;
        }

        const blob = new Blob([hexContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memory_dump_256words_cycle_${this.sim.cycle}.hex`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

if (typeof window !== 'undefined') {
    window.MemoryTableView = MemoryTableView;
}
