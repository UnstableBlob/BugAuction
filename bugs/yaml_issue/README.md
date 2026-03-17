# Bug Description

**Error:** The code fails because of an improperly structured YAML property leading to an indentation error or a shape mismatch in the transformation matrix, resulting in a type or value error during execution.

**Hint:** YAML

### Changes to be made in main.py to fix the bug:
- Ensure the configuration path in `main.py` points to `configCorrect.yaml`.
- In the configuration file, ensure the `transform` matrix has a consistent shape (4x4) and that all properties like `key_stream` are correctly indented under their respective parent keys (e.g., `xor_diffusion`).
  - Error in `config.yaml`: `key_stream` is not indented under `xor_diffusion`.
  - Error in `config.yaml`: One row in the `transform` matrix had only 3 elements.
