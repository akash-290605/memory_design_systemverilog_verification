//========================================================================================================================
// Coverage Class (mem_cov):
//
// The coverage class collects functional coverage information from monitored
// memory transactions. It verifies that different read/write operations,
// address ranges, and data patterns are exercised during simulation.
//
// Functionality:
// - Covers read and write transaction types.
// - Covers different memory address regions.
// - Covers write and read data patterns.
// - Performs cross coverage between operation type and address range.
//
// Purpose:
// Measures verification completeness and helps identify untested scenarios.
//========================================================================================================================

class mem_cov;

mem_tx tx;
	
	covergroup cg;
		
		WR_RD:coverpoint tx.wr_rd{
			
			bins WRITE ={1};
			bins READ  ={0};

		}

		ADDR:coverpoint tx.addr{

			bins Low_addr = {[0:63]};
			bins Mid_adde = {[64:127]};
			bins HIGH_adde = {[128:191]};
			bins Last_adde = {[192:255]};
		}
		
		WDATA:coverpoint tx.wdata{

			bins zeros    ={32'h00000000};
			ignore_bins all_onse ={32'hffffffff};
			bins others   =default;
		}

		RDATA:coverpoint tx.rdata{

			bins zeros    ={32'h00000000};
			ignore_bins all_onse ={32'hffffffff};
			bins others   =default;
		}

		WR_ADDR_CROSS: cross WR_RD,ADDR;
	endgroup
	function new();
		cg=new();
	endfunction

	task run();
		
		forever begin
			mem_common::mon2cov.get(tx);
			cg.sample();
		end

	endtask
endclass
