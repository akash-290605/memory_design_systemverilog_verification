//==================================================================
// Monitor Class (mem_mon):
//
// The monitor is responsible for observing DUT interface signals and converting
// pin-level activity into transaction-level data.
//
// Functionality:
// - Samples DUT signals through the virtual interface and clocking block.
// - Captures valid memory transactions from the DUT interface.
// - Collects read/write information, address, write data, and read data.
// - Sends captured transactions to scoreboard for checking and coverage
//   component for functional coverage collection.
//
// Data Flow:
// DUT Interface → Monitor → Scoreboard / Coverage
//
//===================================================================

class mem_mon;

	mem_tx tx;

	task run();

		forever begin
		 @(mem_common::vif.mon_cb);

		 if(mem_common::vif.mon_cb.valid && mem_common::vif.mon_cb.ready ) begin
			tx=new();
			tx.wr_rd = mem_common::vif.mon_cb.wr_rd;
			tx.addr = mem_common::vif.mon_cb.addr;
			tx.valid = mem_common::vif.mon_cb.valid;
			tx.ready = mem_common::vif.mon_cb.ready;
			if(mem_common::vif.mon_cb.wr_rd)begin
				tx.wdata = mem_common::vif.mon_cb.wdata;
			end

			if(!mem_common::vif.mon_cb.wr_rd)begin
				tx.rdata = mem_common::vif.mon_cb.rdata;
			end
			//tx.print("mon");
			mem_common::mon2cov.put(tx);
			mem_common::mon2sbd.put(tx);

		 end
		end
	endtask
endclass
