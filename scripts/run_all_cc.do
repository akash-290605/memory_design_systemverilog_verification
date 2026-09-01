#======================================================================
# FCBEST CODE COVERAGE REGRESSION
#======================================================================

quit -sim

#======================================================================
# COMPILE WITH FCBEST
#======================================================================

vlog +cover=bcesft list.svh


#======================================================================
# TEST 1 : EMPTY TEST NAME
#======================================================================

transcript file log_fcbest_empty.log

vsim -coverage \
     -wlf fcbest_empty.wlf \
     -suppress 12110 \
     -voptargs="+acc" \
     work.mem_tb \
     +test_name=""

add wave -r sim:/mem_tb/pif/*

coverage exclude -du mem_tb -toggle rst

run -all

coverage save -codeAll fcbest_empty.ucdb

quit -sim


#======================================================================
# TEST 2 : NWR_NRD
#======================================================================

transcript file log_fcbest_nwr_nrd.log

vsim -coverage \
     -wlf fcbest_nwr_nrd.wlf \
     -suppress 12110 \
     -voptargs="+acc" \
     work.mem_tb \
     +test_name=NWR_NRD \
     +N=260

add wave -r sim:/mem_tb/pif/*

coverage exclude -du mem_tb -toggle rst

run -all

coverage save -codeAll fcbest_nwr_nrd.ucdb

quit -sim


#======================================================================
# TEST 3 : BOUNDARY_TEST
#======================================================================

transcript file log_fcbest_boundary.log

vsim -coverage \
     -wlf fcbest_boundary.wlf \
     -suppress 12110 \
     -voptargs="+acc" \
     work.mem_tb \
     +test_name=BOUNDARY_TEST

add wave -r sim:/mem_tb/pif/*

coverage exclude -du mem_tb -toggle rst

run -all

coverage save -codeAll fcbest_boundary.ucdb

quit -sim


#======================================================================
# TEST 4 : INVALID_TEST
#======================================================================

transcript file log_fcbest_invalid.log

vsim -coverage \
     -wlf fcbest_invalid.wlf \
     -suppress 12110 \
     -voptargs="+acc" \
     work.mem_tb \
     +test_name=INVALID_TEST

add wave -r sim:/mem_tb/pif/*

coverage exclude -du mem_tb -toggle rst

run -all

coverage save -codeAll fcbest_invalid.ucdb

quit -sim


#======================================================================
# TEST 5 : ADDR_SWEEP
#======================================================================

transcript file log_fcbest_addr_sweep.log

vsim -coverage \
     -wlf fcbest_addr_sweep.wlf \
     -suppress 12110 \
     -voptargs="+acc" \
     work.mem_tb \
     +test_name=ADDR_SWEEP

add wave -r sim:/mem_tb/pif/*

coverage exclude -du mem_tb -toggle rst

run -all

coverage save -codeAll fcbest_addr_sweep.ucdb

quit -sim


#======================================================================
# TEST 6 : UNWRITTEN_READ_TEST
#======================================================================

transcript file log_fcbest_unwritten.log

vsim -coverage \
     -wlf fcbest_unwritten.wlf \
     -suppress 12110 \
     -voptargs="+acc" \
     work.mem_tb \
     +test_name=UNWRITTEN_READ_TEST

add wave -r sim:/mem_tb/pif/*

coverage exclude -du mem_tb -toggle rst

run -all

coverage save -codeAll fcbest_unwritten.ucdb

quit -sim


#======================================================================
# TEST 7 : MISMATCH_TEST
#======================================================================

transcript file log_fcbest_mismatch.log

vsim -coverage \
     -wlf fcbest_mismatch.wlf \
     -suppress 12110 \
     -voptargs="+acc" \
     work.mem_tb \
     +test_name=MISMATCH_TEST

add wave -r sim:/mem_tb/pif/*

coverage exclude -du mem_tb -toggle rst

run -all

coverage save -codeAll fcbest_mismatch.ucdb

quit -sim


#======================================================================
# TEST 8 : COMBINED_MATCH_MISMATCH_TEST
#======================================================================

transcript file log_fcbest_combined.log

vsim -coverage \
     -wlf fcbest_combined.wlf \
     -suppress 12110 \
     -voptargs="+acc" \
     work.mem_tb \
     +test_name=COMBINED_MATCH_MISMATCH_TEST

add wave -r sim:/mem_tb/pif/*

coverage exclude -du mem_tb -toggle rst

run -all

coverage save -codeAll fcbest_combined.ucdb

quit -sim


#======================================================================
# TEST 9 : UNKNOWN_TEST
#======================================================================

transcript file log_fcbest_default.log

vsim -coverage \
     -wlf fcbest_default.wlf \
     -suppress 12110 \
     -voptargs="+acc" \
     work.mem_tb \
     +test_name=UNKNOWN_TEST

add wave -r sim:/mem_tb/pif/*

coverage exclude -du mem_tb -toggle rst

run -all

coverage save -codeAll fcbest_default.ucdb

quit -sim


#======================================================================
# MERGE ALL FCBEST UCDB FILES
#======================================================================

vcover merge fcbest_coverage.ucdb \
    fcbest_empty.ucdb \
    fcbest_nwr_nrd.ucdb \
    fcbest_boundary.ucdb \
    fcbest_invalid.ucdb \
    fcbest_addr_sweep.ucdb \
    fcbest_unwritten.ucdb \
    fcbest_mismatch.ucdb \
    fcbest_combined.ucdb \
    fcbest_default.ucdb


#======================================================================
# FCBEST REPORT
#======================================================================

vcover report \
    -details \
    -output fcbest_coverage_report.txt \
    fcbest_coverage.ucdb


#======================================================================
# END
#======================================================================

puts ""
puts "=============================================================="
puts "             FCBEST REGRESSION COMPLETED"
puts "=============================================================="
puts "Merged UCDB : fcbest_coverage.ucdb"
puts "Report      : fcbest_coverage_report.txt"
puts "=============================================================="
