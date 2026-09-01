//========================================================================================================================
// Assertion Module:
// Verifies memory interface protocol by checking reset behavior,
// valid signal states, and read/write transaction integrity.
// Ensures that all interface signals remain free from unknown (X/Z) values during normal operation.
//=======================================================================================================================

module mem_assert(clk,rst,wr_rd,addr,wdata,rdata,valid,ready);
	input clk,rst,wr_rd,valid,ready;
	input [`ADDR_WIDTH-1:0] addr;
	input [`WIDTH-1:0] wdata,rdata;
//------------------------------------------------------------------------------------------------------------------------
// Assertion: During reset, all memory interface outputs must remain at default values.
//------------------------------------------------------------------------------------------------------------------------

property reset;
		@(posedge clk) (rst==1) |->(wr_rd==0 && addr==0 &&wdata==0 && rdata==0 && valid==0 && ready==0);
	endproperty

	RESET: assert property(reset);
//------------------------------------------------------------------------------------------------------------------------
//Assertion: After reset is decleared ,all memory interface signal must have known valid values
//and should not contain "X"and "Z" values
//------------------------------------------------------------------------------------------------------------------------
	property preset;
		@(posedge clk) (rst==0)|=> (!$isunknown(wr_rd) && !$isunknown(addr)&& !$isunknown(wdata) && !$isunknown(rdata) && !$isunknown(valid) && !$isunknown(ready) );
	endproperty

	PRESET: assert property(preset);

//------------------------------------------------------------------------------------------------------------------------
// Write Operation Assertion:
// Checks that after a write request, the address and write data signals
// contain valid known values (no X or Z states).
//------------------------------------------------------------------------------------------------------------------------
	property write;
		
		@(posedge clk) (wr_rd==1) |=> (!$isunknown(addr) && !$isunknown(wdata)); 
	endproperty

	WRITE: assert property(write);

//------------------------------------------------------------------------------------------------------------------------
// Read Operation Assertion:
// Checks that after a read request, the address and read data signals
// contain valid known values (no X or Z states).
//------------------------------------------------------------------------------------------------------------------------
	property read;
		@(posedge clk) (wr_rd==0) |=> (!$isunknown(addr) && !$isunknown(rdata));
	endproperty

	READ: assert property(read);

	//------------------------------------------------------------------------------------------------------------------------
// Address Boundary Assertion:
// Checks that whenever valid is asserted, the address does not exceed the maximum memory depth.
//------------------------------------------------------------------------------------------------------------------------
	property addr_range;
		@(posedge clk) disable iff (rst)
			(valid == 1) |-> (addr < `DEPTH);
	endproperty

	ADDR_RANGE: assert property(addr_range) else $error("[SVA FAIL] Address out of bounds violation");

//------------------------------------------------------------------------------------------------------------------------
// Ready Response Assertion:
// Checks that when a valid request is sent, the memory responds with ready on the next cycle (based on DUT logic).
//------------------------------------------------------------------------------------------------------------------------
	property ready_response;
		@(posedge clk) disable iff (rst)
			(valid == 1) |-> ##1 (ready == 1);
	endproperty

	READY_RESP: assert property(ready_response) else $error("[SVA FAIL] Ready signal did not assert after valid request");

//------------------------------------------------------------------------------------------------------------------------
// Default Rdata Assertion:
// Checks that rdata is cleared to zero when valid is low or during a write operation.
//------------------------------------------------------------------------------------------------------------------------
	property rdata_default;
		@(posedge clk) disable iff (rst)
			(valid == 0 || wr_rd == 1) |=> (rdata == 0);
	endproperty

	RDATA_DEF: assert property(rdata_default) else $error("[SVA FAIL] rdata is not zero during write or invalid state");

endmodule
