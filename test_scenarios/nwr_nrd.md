# NWR_NRD Test

## Purpose

The `NWR_NRD` test verifies normal memory write and read functionality.

## Test Flow

1. Generate multiple write transactions.
2. Store data at the selected addresses.
3. Generate read transactions for the same addresses.
4. Monitor the returned data.
5. Compare actual data with expected data using the scoreboard.

## Operation

```text
Write
  ↓
Address + Write Data
  ↓
Memory DUT
  ↓
Memory Array
  ↓
Read
  ↓
Read Data
  ↓
Scoreboard