# Bug Description

**Error:** The script caches the state of the `words` array *before* performing the transformation round. This results in the final checksum being calculated from stale, unmodified data rather than the processed blocks.

**Hint:** Stale data logic.

### Changes to be made in main.py to fix the bug:
- In the `pipeline` function's loop, move the caching line `cache[r] = words[:]` to AFTER the `words` transformation and `skein_round` call.
