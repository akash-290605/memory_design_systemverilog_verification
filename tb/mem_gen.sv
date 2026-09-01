//========================================================================================================================
// Generator Class (mem_gen):
//
// The generator is responsible for creating memory transactions and
// sending them to the BFM through a mailbox based on the selected test scenario.
//
// Functionality:
// - Supports configurable test scenarios via mem_common::test_name (e.g., NWR_NRD, BOUNDARY_TEST, INVALID_TEST, ADDR_SWEEP, UNWRITTEN_READ_TEST, MISMATCH_TEST).
// - Generates random write transactions with randomized address, data, and valid control.
// - Tracks written transactions in a temporary queue using copy constructors (temp = new tx) for read verification.
// - Generates matching read transactions or specialized edge cases (boundary addresses, invalid protocol tests, sweeps, unwritten reads, and mismatches).
// - Sends all generated transactions to the BFM for driving onto the DUT.
//
// Data Flow:
// Generator → Mailbox → BFM → DUT
//
// Purpose:
// Provides targeted and constrained random stimulus generation to verify memory read/write
// operations, boundary limits, scoreboard unwritten fallbacks, mismatch handling, and 100% code coverage.
//========================================================================================================================

class mem_gen;
	
	task run();
		mem_tx tx, temp, tempq[$];

		case (mem_common::test_name)
			
			"BOUNDARY_TEST": begin
				mem_common::gen_count = 4;
				
				// Write to min address (0)
				tx = new();
				assert(tx.randomize() with { wr_rd == 1; addr == 0; valid == 1; })
					else $fatal(1, "Boundary min write failed!");
				
				temp = new tx;
				tempq.push_back(temp);
				mem_common::gen2bfm.put(tx);

				// Write to max address (`DEPTH-1`)
				tx = new();
				assert(tx.randomize() with { wr_rd == 1; addr == `DEPTH-1; valid == 1; })
					else $fatal(1, "Boundary max write failed!");
				
				temp = new tx;
				tempq.push_back(temp);
				mem_common::gen2bfm.put(tx);

				// Read back min address
				tx = new();
				temp = tempq.pop_front();
				assert(tx.randomize() with { wr_rd == 0; addr == temp.addr; wdata == 0; valid == 1; })
					else $fatal(1, "Boundary min read failed!");
				mem_common::gen2bfm.put(tx);

				// Read back max address
				tx = new();
				temp = tempq.pop_front();
				assert(tx.randomize() with { wr_rd == 0; addr == temp.addr; wdata == 0; valid == 1; })
					else $fatal(1, "Boundary max read failed!");
				mem_common::gen2bfm.put(tx);
			end

			"INVALID_TEST": begin
				mem_common::gen_count = 5;
				repeat (5) begin
					tx = new();
					assert(tx.randomize() with { valid == 0; })
						else $fatal(1, "Invalid transaction randomization failed!");
					mem_common::gen2bfm.put(tx);
				end
			end

			"UNWRITTEN_READ_TEST": begin
				// Hits scoreboard asso.exists() false branch by reading an unwritten location[cite: 1]
				mem_common::gen_count = 1;
				tx = new();
				assert(tx.randomize() with { wr_rd == 0; addr == 150; valid == 1; })
					else $fatal(1, "Unwritten read randomization failed!");
				mem_common::gen2bfm.put(tx);
			end

			"MISMATCH_TEST": begin
				mem_common::gen_count = 2;
				
				tx = new();
				assert(tx.randomize() with { wr_rd == 1; addr == 10; wdata == 32'h5555; valid == 1; })
					else $fatal(1, "Mismatch write failed!");
				mem_common::gen2bfm.put(tx);

				tx = new();
				assert(tx.randomize() with { wr_rd == 0; addr == 10; wdata == 0; valid == 1; })
					else $fatal(1, "Mismatch read failed!");
				mem_common::gen2bfm.put(tx); 
			end

			"NWR_NRD": begin 
				mem_common::gen_count = 2 * mem_common::N;

				// Generating Writes 
				repeat (mem_common::N) begin
					tx = new();
					assert (tx.randomize() with { wr_rd == 1; valid == 1; })
						else $fatal(1, "Write transaction randomization failed!");
					
					temp = new tx; 
					tempq.push_back(temp);
					mem_common::gen2bfm.put(tx);
				end

				// Generating Reads matching written data
				repeat (mem_common::N) begin
					tx = new();
					temp = tempq.pop_front();
					assert(tx.randomize() with { wr_rd == 0; addr == temp.addr; wdata == 0; valid == 1; })
						else $fatal(1, "Read transaction randomization failed!");
					mem_common::gen2bfm.put(tx);
				end
			end

			"COMBINED_MATCH_MISMATCH_TEST": begin
				mem_common::gen_count = 4;

				// 1. Successful Write
				tx = new();
				assert(tx.randomize() with { wr_rd == 1; addr == 20; wdata == 32'h1234; valid == 1; })
					else $fatal(1, "Combined write failed!");
				temp = new tx;
				tempq.push_back(temp);
				mem_common::gen2bfm.put(tx);

				// 2. Matching Read (increments matching count)
				tx = new();
				temp = tempq.pop_front();
				assert(tx.randomize() with { wr_rd == 0; addr == temp.addr; wdata == 0; valid == 1; })
					else $fatal(1, "Combined matching read failed!");
				mem_common::gen2bfm.put(tx);

				// 3. Mismatch Write
				tx = new();
				assert(tx.randomize() with { wr_rd == 1; addr == 30; wdata == 32'hAAAA; valid == 1; })
					else $fatal(1, "Combined mismatch write failed!");
				mem_common::gen2bfm.put(tx);

				// 4. Mismatch Read (increments mismatching count via scoreboard override)
				tx = new();
				assert(tx.randomize() with { wr_rd == 0; addr == 30; wdata == 0; valid == 1; })
					else $fatal(1, "Combined mismatch read failed!");
				mem_common::gen2bfm.put(tx);
			end

			"ADDR_SWEEP": begin
				mem_common::gen_count = 512; 

				// Sequential write sweep across every single address from 0 to 255
				for (int i = 0; i < 256; i++) begin
					tx = new();
					assert(tx.randomize() with { wr_rd == 1; addr == i; valid == 1; })
						else $fatal(1, "Address sweep write failed at addr!");
					temp = new tx;
					tempq.push_back(temp);
					mem_common::gen2bfm.put(tx);
				end

				// Sequential read sweep matching every address from 0 to 255
				for (int i = 0; i < 256; i++) begin
					tx = new();
					temp = tempq.pop_front();
					assert(tx.randomize() with { wr_rd == 0; addr == temp.addr; wdata == 0; valid == 1; })
						else $fatal(1, "Address sweep read failed!");
					mem_common::gen2bfm.put(tx);
				end
			end

			default: begin
				// Hits the unvisited default case in mem_gen to complete 100% branch/statement coverage[cite: 1]
				mem_common::gen_count = 1;
				tx = new();
				assert(tx.randomize() with { wr_rd == 1; valid == 1; })
					else $fatal(1, "Default transaction randomization failed!");
				mem_common::gen2bfm.put(tx);
			end

		endcase

	endtask
endclass
