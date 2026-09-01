vlog list.svh

vsim -novopt -suppress 12110  mem_tb +test_name=NWR_NRD +N=250
add wave -r sim:/mem_tb/dut/*
run -all

