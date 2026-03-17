# Bug Description

**Error:** The script's recursive function fails to terminate correctly because the termination condition is logically flawed or unreachable for certain inputs, potentially leading to a `RecursionError`.

**Hint:** Termination logic.

### Changes to be made in main.py to fix the bug:
- Ensure the recursion base case is mathematically reachable for all valid inputs.
- Verify that each recursive step reduces the problem size towards the base case.
