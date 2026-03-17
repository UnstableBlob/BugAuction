import hashlib
import struct
import base64

COUNTER_START = 1
STEP = 16
ROUNDS = 12

def build_state(start, step, rounds):
    state = []
    val = start
    for _ in range(rounds):
        val = (val + step) & 0xFFFF
        state.append(val)
    return state

def expand_state(state):
    out = []
    for v in state:
        out.append((v >> 8) & 0xFF)
        out.append(v & 0xFF)
    return bytes(out)

def sponge_absorb(data, rate=8):
    capacity = [0] * rate
    for i, b in enumerate(data):
        capacity[i % rate] = (capacity[i % rate] + b * (i + 1)) & 0xFF
    return bytes(capacity)

def diffuse(data):
    result = bytearray(data)
    for i in range(1, len(result)):
        result[i] ^= result[i - 1]
    return bytes(result)

def kdf(data, iterations):
    key = data
    for i in range(iterations):
        h = hashlib.sha256()
        h.update(key + struct.pack(">I", i))
        key = h.digest()
    return key

def weave(a, b):
    length = min(len(a), len(b))
    result = bytearray(length)
    for i in range(length):
        result[i] = (a[i] * 3 + b[i] * 5) & 0xFF
    return bytes(result)

def encode_final(data):
    h = hashlib.sha256()
    h.update(data)
    digest = h.digest()
    val = struct.unpack(">Q", digest[:8])[0]
    return base64.b64encode(struct.pack(">Q", val)).decode()

state = build_state(COUNTER_START, STEP, ROUNDS)
expanded = expand_state(state)
absorbed = sponge_absorb(expanded)
diffused = diffuse(absorbed)
derived = kdf(diffused, 7)
woven = weave(derived, expanded[:8])

tail_index = (woven[0] + woven[1] + woven[2]) % len(expanded)
anchor = expanded[tail_index]

print(encode_final(woven + bytes([anchor])))