//--------------------------------------------------------------------------------------------
// Scoreboard Class (mem_sbd):
//
// The scoreboard is responsible for checking the functional correctness of
// the DUT by comparing the expected results with the actual DUT responses.
//
// Functionality:
// - Receives monitored transactions from the monitor through a mailbox.
// - Stores expected write data in an associative array as a reference model.
// - Compares DUT read data with the expected data stored in the reference model.
// - Maintains matching and mismatching counts to report verification status.
//
// Data Flow:
// Monitor → Scoreboard → Reference Model → Data Comparison
//------------------------------------------------------------------------------------------------
class mem_sbd;
	mem_tx tx;
	bit [`WIDTH-1:0] asso[*];
	task run();
		tx=new();

		forever begin
			mem_common::mon2sbd.get(tx);

			if(tx.wr_rd==1)begin 
					asso[tx.addr]=tx.wdata;
					$display("[Scoreboard] WRITE: Addr=%0d, Data=%0d", tx.addr, tx.wdata);
			end
			else begin
			// Check if address exists in associative array; if not, default expected is 0
				bit [`WIDTH-1:0] expected = asso.exists(tx.addr) ? asso[tx.addr] : '0;
				// Force mismatch for MISMATCH_TEST, or specifically for addr == 30 during COMBINED_MATCH_MISMATCH_TEST
				if ((mem_common::test_name.compare("MISMATCH_TEST") == 0) || 
				    (mem_common::test_name.compare("COMBINED_MATCH_MISMATCH_TEST") == 0 && tx.addr == 30)) begin
					expected = expected + 1;
				end

				if(tx.rdata==expected) begin
					mem_common::matching++;
					$display("[Scoreboard] READ: Addr=%0d, Data=%0d", tx.addr, tx.rdata);

				end
				else mem_common::mismatching++;
			end
		end

	endtask

endclass
