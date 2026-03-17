# Bug Description

**Error:** The variable `state` is referenced before assignment within the `pipeline` function. It is passed as an argument to `build_blocks` but is only defined later in the function body, leading to an `UnboundLocalError`.

**Hint:** Early reference.

### Changes to be made in main.py to fix the bug:
- In the `pipeline` function, move the initialization of `state` (`state = lfsr64(seed)`) to the beginning of the function, before it is passed to `build_blocks(state)`.
