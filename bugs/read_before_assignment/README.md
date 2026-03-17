# Bug Description

**Error:** The variable `chained` is referenced before it has been assigned a value. This happens because the assignment occurs inside an `if` block whose condition is not met for the provided input.

**Hint:** Not yet defined.

### Changes to be made in main.py to fix the bug:
- In the `pipeline` function, remove the `if iv > 0xFFFFFFFFFFFFFFFF:` guard so that the `chained` variable is always assigned by the `merkle_damgard` function call.
