/**
 * Live Verilog RTL Syntax Highlighter & Execution Path Tracer
 */

class VerilogTracer {
    constructor(containerId, sim) {
        this.container = document.getElementById(containerId);
        this.sim = sim;

        this.verilogLines = [
            { num: 1,  code: 'module memory(clk,rst,wr_rd,addr,wdata,rdata,valid,ready);' },
            { num: 2,  code: '' },
            { num: 3,  code: '    input clk,rst,wr_rd,valid;' },
            { num: 4,  code: '    input [`ADDR_WIDTH-1:0] addr;' },
            { num: 5,  code: '    input [`WIDTH-1:0] wdata;' },
            { num: 6,  code: '    output reg [`WIDTH-1:0] rdata;' },
            { num: 7,  code: '    output reg ready;' },
            { num: 8,  code: '' },
            { num: 9,  code: '    reg [`WIDTH-1:0] mem[`DEPTH-1:0];' },
            { num: 10, code: '' },
            { num: 11, code: '    always @(posedge clk) begin' },
            { num: 12, code: '        if(rst==1) begin' },
            { num: 13, code: '            rdata <= `WIDTH\'d0;' },
            { num: 14, code: '            ready <= 1\'b0;' },
            { num: 15, code: '' },
            { num: 16, code: '            for(integer i=0;i<`DEPTH;i=i+1)' },
            { num: 17, code: '                mem[i] <= 8\'d0;' },
            { num: 18, code: '        end' },
            { num: 19, code: '        else begin' },
            { num: 20, code: '            rdata <= `WIDTH\'d0;' },
            { num: 21, code: '            ready <= 1\'b0;' },
            { num: 22, code: '' },
            { num: 23, code: '            if(valid==1) begin' },
            { num: 24, code: '                ready <= 1\'b1;' },
            { num: 25, code: '' },
            { num: 26, code: '                if(wr_rd==1)' },
            { num: 27, code: '                    mem[addr] <= wdata;' },
            { num: 28, code: '                else' },
            { num: 29, code: '                    rdata <= mem[addr];' },
            { num: 30, code: '            end' },
            { num: 31, code: '            else' },
            { num: 32, code: '                ready <= 1\'b0;' },
            { num: 33, code: '        end' },
            { num: 34, code: '    end' },
            { num: 35, code: '' },
            { num: 36, code: 'endmodule' }
        ];

        this.initDOM();

        this.sim.addListener((evt, state, data) => {
            if (evt === 'POSEDGE' || evt === 'TIME_TRAVEL' || evt === 'SIMULATOR_RESET') {
                this.updateHighlight(state.lastAction);
            }
        });
    }

    initDOM() {
        let codeHtml = `
            <div class="verilog-viewer-header">
                <div class="verilog-title">
                    <span class="file-icon">📄</span>
                    <span class="file-name">memory.v</span>
                    <span class="badge badge-rtl">Verilog-2001 RTL</span>
                </div>
                <div class="verilog-active-branch" id="verilog-branch-tag">
                    <span class="branch-label">Execution:</span>
                    <span class="branch-val" id="verilog-branch-text">Waiting for posedge clk</span>
                </div>
            </div>
            <div class="verilog-code-body" id="verilog-code-list">
        `;

        this.verilogLines.forEach(l => {
            const formattedCode = this.syntaxHighlight(l.code);
            codeHtml += `
                <div class="code-line" id="v-line-${l.num}" data-line="${l.num}">
                    <span class="line-num">${l.num.toString().padStart(2, ' ')}</span>
                    <span class="line-arrow">›</span>
                    <span class="line-text">${formattedCode}</span>
                </div>
            `;
        });

        codeHtml += `</div>`;
        this.container.innerHTML = codeHtml;

        this.branchText = this.container.querySelector('#verilog-branch-text');
    }

    syntaxHighlight(code) {
        if (!code) return '&nbsp;';

        let escaped = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Keywords
        const keywords = ['module', 'endmodule', 'input', 'output', 'reg', 'wire', 'always', 'posedge', 'begin', 'end', 'if', 'else', 'for', 'integer'];
        keywords.forEach(kw => {
            const regex = new RegExp(`\\b(${kw})\\b`, 'g');
            escaped = escaped.replace(regex, `<span class="syn-kw">$1</span>`);
        });

        // Constants & Numbers (e.g. 1'b0, 8'd0, `WIDTH'd0)
        escaped = escaped.replace(/(\d+'[bdh][0-9a-fA-F_]+|`[A-Z_]+'\w+|\b\d+\b)/g, `<span class="syn-num">$1</span>`);

        // Macros (e.g. `ADDR_WIDTH, `WIDTH, `DEPTH)
        escaped = escaped.replace(/(`[A-Z_]+)/g, `<span class="syn-macro">$1</span>`);

        // Nonblocking assignment operator <=
        escaped = escaped.replace(/(&lt;=)/g, `<span class="syn-op bold">$1</span>`);

        // Comments if any
        escaped = escaped.replace(/(\/\/.*$)/g, `<span class="syn-comment">$1</span>`);

        return escaped;
    }

    updateHighlight(action) {
        if (!this.container) return;

        // Clear previous highlights
        this.container.querySelectorAll('.code-line').forEach(el => {
            el.classList.remove('line-active-exec', 'line-active-branch');
        });

        if (!action || action.type === 'INIT') {
            this.branchText.textContent = 'Idle / Ready';
            this.branchText.className = 'branch-val text-muted';
            return;
        }

        const lines = action.verilogLines || [];

        lines.forEach((lineNum, idx) => {
            const el = this.container.querySelector(`#v-line-${lineNum}`);
            if (el) {
                el.classList.add('line-active-exec');
            }
        });

        // Update branch header text
        if (action.type === 'RESET') {
            this.branchText.textContent = `RESET Branch (Lines 12–17) → Cleared 2048 words`;
            this.branchText.className = 'branch-val text-red';
        } else if (action.type === 'WRITE') {
            this.branchText.textContent = `WRITE Branch (Line 27) → mem[${action.addr}] <= 0x${action.wdata.toString(16).toUpperCase()}`;
            this.branchText.className = 'branch-val text-green';
        } else if (action.type === 'READ') {
            this.branchText.textContent = `READ Branch (Line 29) → rdata <= mem[${action.addr}]`;
            this.branchText.className = 'branch-val text-cyan';
        } else if (action.type === 'NOP') {
            this.branchText.textContent = `NOP Branch (Line 32) → VALID=0 (ready <= 0)`;
            this.branchText.className = 'branch-val text-amber';
        }

        // Auto-scroll the primary execution line into view
        if (lines.length > 0) {
            const targetEl = this.container.querySelector(`#v-line-${lines[lines.length - 1]}`);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.VerilogTracer = VerilogTracer;
}

