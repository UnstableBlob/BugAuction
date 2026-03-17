# Bug Description

**Error:** The code incorrectly reuses a loop variable `i` outside its intended loop. This causes the final key selection to consistently pick the wrong round key index, deviating from the intended algorithm logic.

**Hint:** Reused index.

### Changes to be made in main.py to fix the bug:
- In the `pipeline` function, replace `final_key = round_keys[i]` with logic that explicitly picks the last round key:
  ```python
  last_round = num_rounds - 1
  final_key = round_keys[last_round]
  ```
