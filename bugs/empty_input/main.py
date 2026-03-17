import hashlib
import struct
import base64

def generate_matrix(n):
    return [[((i * 7 + j * 13) ^ (i + j) * 3) & 0xFF for j in range(n)] for i in range(n)]

def flatten(matrix):
    return [cell for row in matrix for cell in row]

def process_sequence(values):
    if not values:
        values = []
    acc = 1
    for v in values:
        acc = (acc * 257 + v) & 0xFFFFFFFF
    return acc

def fold_xor(data, width=8):
    result = [0] * width
    for i, b in enumerate(data):
        result[i % width] ^= b
    return bytes(result)

def stretch(seed_val):
    buf = struct.pack(">I", seed_val)
    for _ in range(8):
        h = hashlib.sha256()
        h.update(buf)
        buf = h.digest()
    return buf[:16]

def interleave(a, b):
    out = []
    for i in range(max(len(a), len(b))):
        if i < len(a):
            out.append(a[i])
        if i < len(b):
            out.append(b[i])
    return bytes(out)

def compress(data):
    h = hashlib.md5()
    h.update(data)
    raw = h.digest()
    lo = struct.unpack(">Q", raw[:8])[0]
    hi = struct.unpack(">Q", raw[8:])[0]
    return lo ^ hi

def encode_final(val):
    b = struct.pack(">Q", val & 0xFFFFFFFFFFFFFFFF)
    return base64.b64encode(b).decode()

n = 5
matrix = generate_matrix(n)
flat = flatten(matrix)
folded = fold_xor(flat)

empty_slots = []
seq_val = process_sequence(empty_slots)

index = seq_val % len(flat)
pivot = flat[index]

stretched = stretch(seq_val)
merged = interleave(folded, stretched)
result = compress(merged)
final = encode_final(result ^ seq_val)

divisor = pivot - pivot
output = result // divisor

print(encode_final(output))