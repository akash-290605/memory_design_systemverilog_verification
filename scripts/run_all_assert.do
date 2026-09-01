#======================================================================
# ASSERTION DEBUG + ASSERTION COVERAGE REGRESSION
#======================================================================

quit -sim

#======================================================================
# COMPILE
#
# No FCBEST code coverage is enabled here.
# Assertion debug is handled by vsim -assertdebug.
#======================================================================

vlog list.svh


#======================================================================
# TEST 1 : EMPTY TEST NAME
#======================================================================

transcript file log_assert_empty.log

vsim -assertdebug \
     -coverage \
     -wlf assert_empty.wlf \
     -suppress 12110 \
     -voptargs="+acc" \
     work.mem_tb \
     +test_name=""

add wave -r sim:/mem_tb/pif/*

run -all

coverage save -assert assert_empty.ucdb

quit -sim


#======================================================================
# TEST 2 : NWR_NRD
#======================================================================

transcript file log_assert_nwr_nrd.log

vsim -assertdebug \
     -coverage \
     -wlf assert_nwr_nrd.wlf \
     -suppress 12110 \
     -voptargs="+acc" \
     work.mem_tb \
     +test_name=NWR_NRD \
     +N=260

add wave -r sim:/mem_tb/pif/*

run -all

coverage save -assert assert_nwr_nrd.ucdb

quit -sim


#======================================================================
# TEST 3 : BOUNDARY_TEST
#======================================================================

transcript file log_assert_boundary.log

vsim -assertdebug \
     -coverage \
     -wlf assert_boundary.wlf \
     -suppress 12110 \
     -voptargs="+acc" \
     work.mem_tb \
     +test_name=BOUNDARY_TEST

add wave -r sim:/mem_tb/pif/*

run -all

coverage save -assert assert_boundary.ucdb

quit -sim


#======================================================================
# TEST 4 : INVALID_TEST
#======================================================================

transcript file log_assert_invalid.log

vsim -assertdebug \
     -coverage \
     -wlf assert_invalid.wlf \
     -suppress 12110 \
     -voptargs="+acc" \
     work.mem_tb \
     +test_name=INVALID_TEST

add wave -r sim:/mem_tb/pif/*

run -all

coverage save -assert assert_invalid.ucdb

quit -sim


#======================================================================
# TEST 5 : ADDR_SWEEP
#======================================================================

transcript file log_assert_addr_sweep.log

vsim -assertdebug \
     -coverage \
     -wlf assert_addr_sweep.wlf \
     -suppress 12110 \
     -voptargs="+acc" \
     work.mem_tb \
     +test_name=ADDR_SWEEP

add wave -r sim:/mem_tb/pif/*

run -all

coverage save -assert assert_addr_sweep.ucdb

quit -sim


#======================================================================
# TEST 6 : UNWRITTEN_READ_TEST
#======================================================================

transcript file log_assert_unwritten.log

vsim -assertdebug \
     -coverage \
     -wlf assert_unwritten.wlf \
     -suppress 12110 \
     -voptargs="+acc" \
     work.mem_tb \
     +test_name=UNWRITTEN_READ_TEST

add wave -r sim:/mem_tb/pif/*

run -all

coverage save -assert assert_unwritten.ucdb

quit -sim


#======================================================================
# TEST 7 : MISMATCH_TEST
#======================================================================

transcript file log_assert_mismatch.log

vsim -assertdebug \
     -coverage \
     -wlf assert_mismatch.wlf \
     -suppress 12110 \
     -voptargs="+acc" \
     work.mem_tb \
     +test_name=MISMATCH_TEST

add wave -r sim:/mem_tb/pif/*

run -all

coverage save -assert assert_mismatch.ucdb

quit -sim


#======================================================================
# TEST 8 : COMBINED_MATCH_MISMATCH_TEST
#======================================================================

transcript file log_assert_combined.log

vsim -assertdebug \
     -coverage \
     -wlf assert_combined.wlf \
     -suppress 12110 \
     -voptargs="+acc" \
     work.mem_tb \
     +test_name=COMBINED_MATCH_MISMATCH_TEST

add wave -r sim:/mem_tb/pif/*

run -all

coverage save -assert assert_combined.ucdb

quit -sim


#======================================================================
# TEST 9 : UNKNOWN_TEST
#======================================================================

transcript file log_assert_default.log

vsim -assertdebug \
     -coverage \
     -wlf assert_default.wlf \
     -suppress 12110 \
     -voptargs="+acc" \
     work.mem_tb \
     +test_name=UNKNOWN_TEST

add wave -r sim:/mem_tb/pif/*

run -all

coverage save -assert assert_default.ucdb

quit -sim


#======================================================================
# MERGE ASSERTION UCDB FILES
#======================================================================

vcover merge assertion_coverage.ucdb \
    assert_empty.ucdb \
    assert_nwr_nrd.ucdb \
    assert_boundary.ucdb \
    assert_invalid.ucdb \
    assert_addr_sweep.ucdb \
    assert_unwritten.ucdb \
    assert_mismatch.ucdb \
    assert_combined.ucdb \
    assert_default.ucdb


#======================================================================
# ASSERTION REPORT
#======================================================================

vcover report \
    -assert \
    -details \
    -output assertion_coverage_report.txt \
    assertion_coverage.ucdb


#======================================================================
# END
#======================================================================

puts ""
puts "=============================================================="
puts "        ASSERTION DEBUG REGRESSION COMPLETED"
puts "=============================================================="
puts "Merged UCDB : assertion_coverage.ucdb"
puts "Report      : assertion_coverage_report.txt"
puts "=============================================================="
