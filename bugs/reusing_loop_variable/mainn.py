import hashlib, struct

def whirlpool_mix(block_words):
    MDS = [0x18186018C07830D8, 0x23238C2305AF4626, 0xC6C63FC67EF991B8, 0xE8E887E8136FCDFB]
    out = []
    for i in range(len(block_words)):
        v = 0
        for j, w in enumerate(block_words):
            v ^= (MDS[j % 4] * w * (i + 1)) & 0xFFFFFFFFFFFFFFFF
        v ^= v >> 32
        out.append(v & 0xFFFFFFFFFFFFFFFF)
    return out

def rotate_words(words, shift):
    n = len(words)
    return [words[(i + shift) % n] for i in range(n)]

def add_round_key(words, round_keys):
    return [(w ^ rk) & 0xFFFFFFFFFFFFFFFF for w, rk in zip(words, round_keys)]

def key_expand(seed, num_rounds):
    keys = []
    v = seed
    for r in range(num_rounds):
        round_key = []
        for i in range(4):
            v = (v * 0x6C62272E07BB0142 + r * 0xFF + i) & 0xFFFFFFFFFFFFFFFF
            v ^= v >> 27
            round_key.append(v)
        keys.append(round_key)
    return keys

def pipeline(seed):
    num_rounds = 8
    round_keys = key_expand(seed, num_rounds)
    words = [(seed >> (i * 16)) ^ round_keys[0][i % 4] for i in range(4)]
    for r in range(num_rounds):
        words = whirlpool_mix(words)
        words = rotate_words(words, r % 4 + 1)
        words = add_round_key(words, round_keys[r])
        for i in range(4):
            words[i] = (words[i] ^ (r * 0xAB + i * 0xCD)) & 0xFFFFFFFFFFFFFFFF
    last_round = num_rounds - 1
    final_key = round_keys[last_round]
    digest_in = struct.pack('>4Q', *words) + struct.pack('>4Q', *final_key)
    return hashlib.sha3_256(digest_in).digest()[:8].hex()

print(pipeline(0x2468ACE013579BDF))