//========================================================================================================================
// Bus Functional Model (BFM):
// Responsible for converting high-level transactions received from the generator
// into pin-level DUT interface signals. It drives read/write operations to the
// DUT through the virtual interface and handles communication timing according
// to the memory protocol.
//========================================================================================================================

class mem_bfm;
	mem_tx tx;

	task run();
	
	    //------------------------------------------------------
		// Get the data from the generator through the mailbox.
		//------------------------------------------------------
		forever begin 
			mem_common::gen2bfm.get(tx);
			//tx.print("bfm");
			driver(tx);
			mem_common::bfm_count++;
		end
        //-------------------------------------------------------

	endtask
	//-----------------------------------------------------------------------
	// Drive the generated data to the interface to communicate with the DUT.
    //-----------------------------------------------------------------------
	task driver (input mem_tx tx);
		@(mem_common::vif.bfm_cb);
		mem_common::vif.bfm_cb.wr_rd<=tx.wr_rd;
		mem_common::vif.bfm_cb.addr <=tx.addr;
		mem_common::vif.bfm_cb.valid <=tx.valid;

		if(tx.wr_rd==1)
			mem_common::vif.bfm_cb.wdata<=tx.wdata;
		else
			mem_common::vif.bfm_cb.wdata<='0;
		
		@(mem_common::vif.bfm_cb);

		if (tx.valid &&tx.wr_rd==0) begin
			tx.rdata=mem_common::vif.bfm_cb.rdata;
		end

			tx.ready= mem_common::vif.ready;
		@(mem_common::vif.bfm_cb);
			mem_common::vif.bfm_cb.wr_rd<=0;
			mem_common::vif.bfm_cb.addr <=0;
			mem_common::vif.bfm_cb.wdata<=0;
			mem_common::vif.bfm_cb.valid<=0;

	//--------------------------------------------------------------------------
	endtask
endclass
