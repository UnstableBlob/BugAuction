# Bug Description

**Error:** The script fails with a `TypeError` when it attempts to perform a bitwise XOR (`^`) between a `bytes` object and an integer. This occurs because Step 8 returns a byte sequence while Step 9 expects an integer input.

**Hint:** Type mismatch.

### Changes to be made in main.py to fix the bug:
- In the `step8` function, change the return statement to unpack the rearranged bytes back into a 64-bit integer:
  ```python
  return struct.unpack(">Q", struct.pack(">BBBBBBBB", *rearranged))[0]
  ```
