//========================================================================================================================
// Testbench Top Module
//
// Description:
//   Top-level simulation module for the memory DUT.
//   This module:
//   1. Generates clock and reset
//   2. Instantiates the interface
//   3. Instantiates the memory DUT
//   4. Instantiates assertions
//   5. Connects the virtual interface
//   6. Reads test name and N from plusargs
//   7. Creates and runs the test
//   8. Prints TEST PASSED / TEST FAILED
//========================================================================================================================

module mem_tb;

    //====================================================================================================================
    // Clock and Reset
    //====================================================================================================================
    reg clk;
    reg rst;

    // Test object
    mem_test test;


    //====================================================================================================================
    // Physical Interface
    //====================================================================================================================
    // Interface connects the testbench components with the DUT.
    mem_interf pif(clk, rst);


    //====================================================================================================================
    // DUT - Memory
    //====================================================================================================================
    memory dut (
        .clk   (pif.clk),
        .rst   (pif.rst),
        .wr_rd (pif.wr_rd),
        .addr  (pif.addr),
        .wdata (pif.wdata),
        .rdata (pif.rdata),
        .valid (pif.valid),
        .ready (pif.ready)
    );


    //====================================================================================================================
    // Assertions
    //====================================================================================================================
    mem_assert uut (
        .clk   (pif.clk),
        .rst   (pif.rst),
        .wr_rd (pif.wr_rd),
        .addr  (pif.addr),
        .wdata (pif.wdata),
        .rdata (pif.rdata),
        .valid (pif.valid),
        .ready (pif.ready)
    );


    //====================================================================================================================
    // Clock Generation
    //====================================================================================================================
    // Clock period = 10 ns
    always #5 clk = ~clk;


    //====================================================================================================================
    // Test Initialization and Execution
    //====================================================================================================================
    initial begin

        // Initialize clock and reset
        clk = 0;
		rst = 1;


        //---------------------------------------------------------------------------------------------------------------
        // Connect physical interface to virtual interface
        //---------------------------------------------------------------------------------------------------------------
        mem_common::vif = pif;


        //---------------------------------------------------------------------------------------------------------------
        // Hold reset for 3 clock cycles
        //---------------------------------------------------------------------------------------------------------------
        repeat (3) @(posedge clk);
        rst = 0;


        //---------------------------------------------------------------------------------------------------------------
        // Read test parameters from command line
        //
        // Example:
        //   +test_name=NWR_NRD
        //   +N=260
        //---------------------------------------------------------------------------------------------------------------
        void'($value$plusargs("N=%d", mem_common::N));
        void'($value$plusargs("test_name=%s", mem_common::test_name));


        //---------------------------------------------------------------------------------------------------------------
        // Create and run the test
        //---------------------------------------------------------------------------------------------------------------
        test = new();
        test.run();

    end


    //====================================================================================================================
    // Test Result
    //
    // This block checks the scoreboard result and prints whether
    // the current testcase PASSED or FAILED.
    //
    // Coverage is disabled for this result-checking code so that
    // these if/else conditions do not create unwanted coverage
    // points.
    //====================================================================================================================

    // pragma coverage off

    initial begin

        // Allow the testbench to start processing
        #50;


        // Wait until generator and BFM process the same number
        // of transactions.
        wait(mem_common::gen_count == mem_common::bfm_count);


        // Allow scoreboard/BFM to complete
        #20;


        //---------------------------------------------------------------------------------------------------------------
        // COMBINED_MATCH_MISMATCH_TEST
        //
        // Expected:
        //   At least one matching transaction
        //   At least one mismatching transaction
        //---------------------------------------------------------------------------------------------------------------
        if (mem_common::test_name.compare("COMBINED_MATCH_MISMATCH_TEST") == 0) begin

            if ((mem_common::matching > 0) &&
                (mem_common::mismatching > 0)) begin

                $display("[TEST PASSED] %s",
                         mem_common::test_name);

            end
            else begin

                $display("[TEST FAILED] %s",
                         mem_common::test_name);

            end

        end


        //---------------------------------------------------------------------------------------------------------------
        // MISMATCH_TEST
        //
        // Expected:
        //   At least one mismatching transaction
        //---------------------------------------------------------------------------------------------------------------
        else if (mem_common::test_name.compare("MISMATCH_TEST") == 0) begin

            if (mem_common::mismatching > 0) begin

                $display("[TEST PASSED] %s",
                         mem_common::test_name);

            end
            else begin

                $display("[TEST FAILED] %s",
                         mem_common::test_name);

            end

        end


        //---------------------------------------------------------------------------------------------------------------
        // All Other Tests
        //
        // Expected:
        //   At least one matching transaction
        //   No mismatching transaction
        //---------------------------------------------------------------------------------------------------------------
        else begin

            if ((mem_common::matching > 0) &&
                (mem_common::mismatching == 0)) begin

                $display("[TEST PASSED] %s",
                         mem_common::test_name);

            end
            else begin

                $display("[TEST FAILED] %s",
                         mem_common::test_name);

            end

        end


        //---------------------------------------------------------------------------------------------------------------
        // Display transaction count
        //---------------------------------------------------------------------------------------------------------------
        $display("gen_count = %0d | bfm_count = %0d",
                 mem_common::gen_count,
                 mem_common::bfm_count);
					rst=1;

		repeat (2) @(posedge clk);

        //---------------------------------------------------------------------------------------------------------------
        // End simulation
        //---------------------------------------------------------------------------------------------------------------
        $finish;

    end

    // pragma coverage on


endmodule
