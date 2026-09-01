
### `test_scenarios/mismatch_test.md`

```markdown
# MISMATCH_TEST

## Purpose

The `MISMATCH_TEST` verifies that the scoreboard can detect an incorrect DUT result.

## Test Flow

```text
DUT Read Data
      ↓
   Monitor
      ↓
  Scoreboard
      ↓
Expected vs Actual
      ↓
   Mismatch