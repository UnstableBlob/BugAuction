# Bug Description

**Error:** The code fails with a `NameError` because the variable `tweak` is used in the `pipeline` function but is never defined in that scope. It exists only as a local variable within the `compute_tweak` function, and its return value is never captured.

**Hint:** Missing variable.

### Changes to be made in main.py to fix the bug:
- Capture the result of `compute_tweak(seed)` by assigning it to a variable named `tweak`: `tweak = compute_tweak(seed)`.
- Alternatively, inline the tweak calculation directly within the `pipeline` function.
