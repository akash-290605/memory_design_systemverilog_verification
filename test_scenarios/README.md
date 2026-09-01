# Memory Verification Test Scenarios

This directory contains the documentation for the test scenarios used to verify the 1 KB synchronous memory design.

## Test Scenarios

| Test Scenario | Purpose |
|---|---|
| `NWR_NRD` | Verify multiple write and read operations |
| `BOUNDARY_TEST` | Verify minimum and maximum memory addresses |
| `INVALID_TEST` | Verify invalid transaction handling |
| `ADDR_SWEEP` | Exercise the complete memory address range |
| `UNWRITTEN_READ_TEST` | Verify reading from an unwritten address |
| `MISMATCH_TEST` | Verify scoreboard mismatch detection |
| `COMBINED_MATCH_MISMATCH_TEST` | Verify both match and mismatch conditions |

## Verification Areas

The test scenarios collectively verify:

- Memory write operation
- Memory read operation
- Address handling
- Boundary addresses
- Invalid transactions
- Unwritten memory locations
- Data comparison
- Scoreboard functionality
- Functional coverage
- Assertion checking