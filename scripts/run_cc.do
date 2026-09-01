

# Compile design with FCBEST code coverage enabled
vlog +cover=bcesft list.svh

# --- Test Case 1: Empty Test Name ---
transcript file log_empty.log
vsim -wlf wlf_empty.wlf -suppress 12110 -voptargs="+acc" -coverage mem_tb +test_name=""
add wave -r sim:/mem_tb/pif/*
add wave -r sim:/mem_tb/dut/*
#coverage exclude -du mem_tb -toggle rst
run -all
coverage save -codeAll ucdb_empty.ucdb
quit -sim

