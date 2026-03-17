import hashlib, struct

def lfsr64(state, taps=0xD800000000000000):
    for _ in range(128):
        bit = bin(state & taps).count('1') % 2
        state = ((state >> 1) | (bit << 63)) & 0xFFFFFFFFFFFFFFFF
    return state

def feistel(left, right, rounds=8):
    for i in range(rounds):
        f = ((right * 0x6C62272E07BB0142) ^ (right >> 17) ^ (i * 0xDEAD)) & 0xFFFFFFFFFFFFFFFF
        left, right = right, (left ^ f) & 0xFFFFFFFFFFFFFFFF
    return left, right

def compress(blocks):
    h = 0xCBF29CE484222325
    for b in blocks:
        h ^= b
        h = (h * 0x100000001B3) & 0xFFFFFFFFFFFFFFFF
        h ^= h >> 32
    return h

def build_blocks(seed):
    raw = hashlib.sha512(seed.to_bytes(8, 'big')).digest()
    return [struct.unpack_from('>Q', raw, i*8)[0] for i in range(8)]

def pipeline(seed):
    state = lfsr64(seed)
    blocks = build_blocks(state)
    h = compress(blocks)
    L, R = feistel(h & 0xFFFFFFFF, h >> 32)
    final = ((L << 32) | R) & 0xFFFFFFFFFFFFFFFF
    result = hashlib.blake2b(final.to_bytes(8, 'big'), digest_size=8).hexdigest()
    return result

print(pipeline(0xABCDEF0123456789))