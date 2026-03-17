# Bug Description

**Error:** The code uses an incorrect initial value for the `reduce_chunk` accumulator. Instead of starting with a standard hash offset or a neutral value, it uses a fixed large constant that affects the entire downstream cryptographic chain.

**Hint:** Bad starting value.

### Changes to be made in main.py to fix the bug:
- Replace the implementation in `main.py` with the one in `mainn.py`. The updated code uses a different state building mechanism (`build_state`, `expand_state`) and avoids using an incorrect initial value for the accumulator.
