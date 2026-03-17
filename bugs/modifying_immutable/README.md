# Bug Description

**Error:** The script attempts to modify a tuple, which is an immutable data structure in Python. Specifically, it tries to assign a value to `state[12]`, triggering a `TypeError`.

**Hint:** Immutable modification.

### Changes to be made in main.py to fix the bug:
- In `build_state`, change `SIGMA` from a tuple to a list: `SIGMA = [0x61707865, 0x3320646E, 0x79622D32, 0x6B206574]`.
- Change the return value of `build_state` to return a list instead of a tuple concatenation.
- Remove the assignment `state[12] = 1` in the `pipeline` function, as the value is already correctly set during list creation in `build_state`.
