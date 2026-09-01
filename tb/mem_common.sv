//========================================================================================================================
// Common class containing shared mailboxes and variables used for communication
// between verification components and storing scoreboard comparison results.
//========================================================================================================================

`define WIDTH 32
`define DEPTH 256  
`define ADDR_WIDTH $clog2(`DEPTH)

class mem_common;
	static int N=20;
	static string test_name ="";

	static mailbox gen2bfm=new();
	static mailbox mon2cov=new();
	static mailbox mon2sbd=new();

	static int matching    = 0;
	static int mismatching = 0;
	
	static int gen_count = 0;
	static int bfm_count = 0;
	static int mon_count = 0;

	static virtual mem_interf vif;

endclass
