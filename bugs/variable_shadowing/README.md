# Bug Description

**Error:** The code shadows the input `seed` by masking it to 32 bits before passing it to the key expansion function. This loss of information leads to an incorrect internal state compared to the intended 64-bit logic.

**Hint:** Value masking.

### Changes to be made in main.py to fix the bug:
- In the `pipeline` function, remove the line `seed = seed & 0xFFFFFFFF` to prevent truncating the 64-bit input seed to 32 bits.
