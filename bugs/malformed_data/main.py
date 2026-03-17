import hashlib
import struct
import base64
import re

RAW_DATA = "493a7f|2b:88:e1|0044:ab12|19;3d;f7|cc-11-85"

def parse_segments(raw):
    segments = raw.split("|")
    result = []
    for seg in segments:
        parts = re.split(r'[:\-;,]', seg)
        values = []
        for p in parts:
            p = p.strip()
            if re.match(r'^[0-9a-fA-F]+$', p):
                values.append(int(p))
        result.append(values)
    return result

def build_vector(segments):
    vector = []
    for seg in segments:
        acc = 0
        for v in seg:
            acc = (acc << 4) ^ v
        vector.append(acc & 0xFFFF)
    return vector

def convolve(vec, kernel):
    result = []
    klen = len(kernel)
    for i in range(len(vec)):
        val = sum(vec[(i + j) % len(vec)] * kernel[j] for j in range(klen))
        result.append(val & 0xFFFFFFFF)
    return result

def pack_vector(vec):
    return b''.join(struct.pack(">I", v) for v in vec)

def permute(data):
    arr = bytearray(data)
    n = len(arr)
    for i in range(n):
        j = (i * 7 + 11) % n
        arr[i], arr[j] = arr[j], arr[i]
    return bytes(arr)

def final_hash(data):
    h = hashlib.sha3_256()
    h.update(data)
    d = h.digest()
    val = struct.unpack(">Q", d[:8])[0]
    return base64.b64encode(struct.pack(">Q", val)).decode()

KERNEL = [3, 7, 13, 5]

segments = parse_segments(RAW_DATA)
vector = build_vector(segments)
convolved = convolve(vector, KERNEL)
packed = pack_vector(convolved)
permuted = permute(packed)
print(final_hash(permuted))