import hashlib, struct, itertools

def build_sbox(seed):
    box = list(range(256))
    k = seed & 0xFF
    for i in range(255, 0, -1):
        k = (k * 1664525 + 1013904223) & 0xFFFFFFFF
        j = k % (i + 1)
        box[i], box[j] = box[j], box[i]
    return box

def substitution_permutation(data, sbox, rounds=6):
    state = bytearray(data)
    for r in range(rounds):
        state = bytearray(sbox[b] for b in state)
        rotated = bytearray(8)
        for i in range(8):
            rotated[i] = state[(i * 3 + r) % 8]
        state = rotated
        key_byte = (r * 0x9B + 0x37) & 0xFF
        state = bytearray(b ^ key_byte for b in state)
    return bytes(state)

def merkle_damgard(blocks, iv):
    h = iv
    for block in blocks:
        combined = struct.pack('>Q', h) + block
        h = struct.unpack('>Q', hashlib.sha256(combined).digest()[:8])[0]
    return h

def pipeline(seed):
    sbox = build_sbox(seed)
    base = hashlib.md5(seed.to_bytes(8, 'big')).digest()
    blocks = [base[i:i+8] for i in range(0, 16, 8)]
    iv = seed ^ 0xFEDCBA9876543210
    chained = merkle_damgard(blocks, iv)
    permuted = substitution_permutation(chained.to_bytes(8, 'big'), sbox)
    result = hashlib.sha3_256(permuted).digest()[:8].hex()
    return result

print(pipeline(0x3C2B1A0F9E8D7C6B))