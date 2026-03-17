import hashlib
import struct
import base64
import json

def build_table(size):
    return [(i * 31337 + 0xDEAD) & 0xFFFF for i in range(size)]

def chunk_table(table, k):
    return [table[i:i+k] for i in range(0, len(table), k)]

def reduce_chunk(chunk):
    v = 0xFFFFFFFF
    for x in chunk:
        v = (v ^ x) * 1000003 & 0xFFFFFFFF
    return v

def serialize_values(values):
    return json.dumps(values)

def hash_payload(payload_str):
    h = hashlib.sha512()
    h.update(payload_str.encode())
    return h.digest()

def mix_digest(digest):
    parts = [struct.unpack(">Q", digest[i:i+8])[0] for i in range(0, 64, 8)]
    acc = parts[0]
    for p in parts[1:]:
        acc = (acc * 6364136223846793005 + p) & 0xFFFFFFFFFFFFFFFF
    return acc

def cascade(val, rounds):
    for _ in range(rounds):
        b = struct.pack(">Q", val)
        h = hashlib.blake2b(b, digest_size=8)
        val = struct.unpack(">Q", h.digest())[0]
    return val

def encode_final(val):
    b = struct.pack(">Q", val)
    return base64.b64encode(b).decode()

table = build_table(32)
chunks = chunk_table(table, 4)
reduced = [reduce_chunk(c) for c in chunks]

payload = serialize_values(reduced)
digest = hash_payload(payload)
mixed = mix_digest(digest)
cascaded = cascade(mixed, 10)

raw = struct.pack(">Q", cascaded)
reparsed = raw.decode("utf-8")

print(encode_final(int(reparsed)))