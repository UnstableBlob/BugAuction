# Bug Description

**Error:** The script encounters an `UnboundLocalError`. The variable `lanes` is defined in the global scope, but within the `pipeline` function, it is assigned a value, making it local. However, it is referenced on the right side of the assignment before the local variable is fully initialized.

**Hint:** Scope confusion.

### Changes to be made in main.py to fix the bug:
- Remove the global definition of `lanes = [0x0, 0x0, 0x0, 0x0]`.
- Inside the `pipeline` function, initialize `lanes` locally before use: `lanes = [ROUND_CONSTANTS[i] for i in range(4)]`.
