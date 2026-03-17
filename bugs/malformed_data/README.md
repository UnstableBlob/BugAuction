# Bug Description

**Error:** The code fails with a `ValueError` during integer conversion. It attempts to parse hexadecimal strings using the default base 10 in `int()`, which is incompatible with characters like 'f' or 'e'.

**Hint:** Hex conversion.

### Changes to be made in main.py to fix the bug:
- In the `parse_input` function, change `values.append(int(p))` to `values.append(int(p, 16))` to correctly parse hexadecimal strings.
