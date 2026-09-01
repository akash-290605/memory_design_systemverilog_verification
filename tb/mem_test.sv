class mem_test;
	mem_env env;

	function new();
		env = new();
	endfunction

	task run();

		$display("[TEST] Starting Test: %s with N = %0d", mem_common::test_name, mem_common::N);
		
		env.run();
	endtask
endclass
