# Bug Description

**Error:** The script attempts to decode arbitrary binary data (from `struct.pack`) using UTF-8 encoding. This results in a `UnicodeDecodeError` because the binary data contains byte sequences that are invalid in UTF-8.

**Hint:** Encoding error.

### Changes to be made in main.py to fix the bug:
- In `serialize_values`, use compact JSON representation by adding `separators=(',', ':')` to `json.dumps`.
- Remove the problematic decoding logic:
  ```python
  raw = struct.pack(">Q", cascaded)
  reparsed = raw.decode("utf-8")
  print(encode_final(int(reparsed)))
  ```
- Replace it with a direct call to `encode_final`:
  ```python
  print(encode_final(cascaded))
  ```
