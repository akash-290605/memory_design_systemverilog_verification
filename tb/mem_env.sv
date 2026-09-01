//========================================================================================================================
// Environment:
// Top-level verification component that connects agents components. It builds the environment to run the Test Bench architecture
//========================================================================================================================
class mem_env;
	mem_agent agent;
	mem_sbd   sbd;

	function new();
		agent = new();
		sbd   = new();
	endfunction

	task run();
		fork 
			agent.run();
			sbd.run();
		join
	endtask
	
endclass
