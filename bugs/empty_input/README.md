# Bug Description

**Error:** The code attempts to perform a floor division by zero. This occurs because the divisor is calculated as `pivot - pivot`, which always evaluates to zero.

**Hint:** Division by zero.

### Changes to be made in main.py to fix the bug:
- In `process_sequence`, change `values = []` to `values = [0]` to ensure `acc` is calculated correctly for empty inputs.
- Change `divisor = pivot - pivot` to `divisor = pivot - 0` (or simply `divisor = pivot`) to prevent division by zero.
