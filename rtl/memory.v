// -----------------------------------------------------------------------------
// Module      : memory
// Description : 1 KB Single-Port Synchronous Memory
//
// Memory Size : 1 KB (1024 Bytes)
// Data Width  : 32 bits (4 Bytes per word)
// Depth       : 256 Words
// Address Width : 8 bits (log2(256) = 8)
//
// Operations:
//   - Write : Synchronous write on positive edge of clock.
//   - Read  : Synchronous read on positive edge of clock.
//   - Reset : Clears rdata and valid signal.
//   - Valid : Asserted for one clock cycle after successful read/write.
//----------------------------------------------------------------------------------

//`define WIDTH 32
//`define DEPTH 256
//`define ADDR_WIDTH $clog2(`DEPTH)

module memory(clk,rst,wr_rd,addr,wdata,rdata,valid,ready);
	input clk,rst,wr_rd,valid;
	input [`ADDR_WIDTH-1:0] addr;
	input [`WIDTH-1:0] wdata;
	output reg [`WIDTH-1:0] rdata;
	output reg ready;
	
	reg [`WIDTH-1:0]mem[`DEPTH-1:0];

	always @(posedge clk)begin
		if(rst==1'b1)begin
			rdata<=`WIDTH'd0;
			ready<=1'b0;
			for(integer i=0;i<`DEPTH;i=i+1)
				mem[i]<=`WIDTH'd0;
		end

		else begin 
			rdata<=`WIDTH'd0;
			ready<=1'b0;
			if(valid==1) begin
				ready<=1'b1;
				if(wr_rd==1) mem[addr]<=wdata;
				else         rdata<=mem[addr];
			end
			else ready<=1'b0;
			
		end
	end
	
endmodule

