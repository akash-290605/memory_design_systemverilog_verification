//========================================================================================================================
// Memory Interface (mem_interf):
//
// The interface provides a common communication channel between the DUT and
// verification components. It encapsulates all memory transaction signals and
// provides clocking blocks to synchronize stimulus driving and signal monitoring.
//
// Signals:
// - wr_rd : Indicates memory operation type (Write/Read).
// - addr  : Memory address for access.
// - wdata : Data written into memory.
// - rdata : Data read from memory.
// - valid : Indicate data is valid or not
// - ready : Indicates a memory is ready for transaction.
// Clocking Blocks:
// 1. bfm_cb:
//    - Used by BFM/driver to drive input signals to DUT and sample DUT outputs.
//    - Provides proper timing synchronization with the clock.
//
// 2. mon_cb:
//    - Used by monitor to sample DUT interface signals safely.
//    - Prevents race conditions between DUT and testbench.
//
// Purpose:
// Provides clean and synchronized communication between DUT, BFM, and Monitor.
//========================================================================================================================

interface mem_interf(input clk,input rst);
	bit                     wr_rd;
	bit  [`ADDR_WIDTH-1:0] addr;
	bit  [`WIDTH-1:0]       wdata;
	bit  [`WIDTH-1:0]       rdata;
	bit                     valid;
	bit                     ready;

	clocking bfm_cb @(posedge clk );
		default input #1 output #1;
			input rdata ,ready;
			output wr_rd,addr,wdata,valid;
	endclocking

	clocking mon_cb @(posedge clk );
		default input #1 output #1;
			input rdata ,valid,wr_rd,addr,wdata,ready;
	endclocking

endinterface
