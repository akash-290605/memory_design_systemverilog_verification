//========================================================================================================================
// Agent:
// Verification component that encapsulates generator, BFM, and monitor.
// It manages transaction-level communication with the DUT interface by
// generating stimulus, driving signals, and monitoring DUT responses.
//========================================================================================================================

class mem_agent;

	mem_gen gen;
	mem_bfm bfm;
	mem_mon mon;
	mem_cov cov;
	
	function new ();
		gen =new();
		bfm =new();
		mon =new();
		cov =new();
	endfunction

	task run();

		fork 
			gen.run();
			bfm.run();
			mon.run();
			cov.run();
		join
			
	endtask
	
endclass
