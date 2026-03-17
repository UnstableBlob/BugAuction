import hashlib, struct

def xorshift128(a, b, c, d):
    for _ in range(64):
        t = (d << 11) & 0xFFFFFFFF
        d, c, b = c, b, a
        a = (a ^ (a >> 19) ^ t ^ (t >> 8)) & 0xFFFFFFFF
    return a, b, c, d

def pearson_mix(data, table_seed):
    table = list(range(256))
    s = table_seed & 0xFF
    for i in range(255, 0, -1):
        j = (s + table[i] + i) % (i + 1)
        table[i], table[j] = table[j], table[i]
        s = (s * 31 + i) & 0xFF
    hash_val = 0
    for byte in data:
        hash_val = table[hash_val ^ byte]
    return hash_val

def expand_key(seed):
    words = []
    v = seed
    for i in range(8):
        v = (v * 0x6364136223846793 + 0x1442695040888963) & 0xFFFFFFFFFFFFFFFF
        words.append(v)
    return words

def pipeline(seed):
    seed = seed & 0xFFFFFFFF
    key_words = expand_key(seed)
    a = key_words[0] & 0xFFFFFFFF
    b = key_words[1] & 0xFFFFFFFF
    c = key_words[2] & 0xFFFFFFFF
    d = key_words[3] & 0xFFFFFFFF
    a, b, c, d = xorshift128(a, b, c, d)
    combined = struct.pack('>4I', a, b, c, d)
    table_seed = key_words[4]
    mix = pearson_mix(combined, table_seed)
    payload = struct.pack('>Q', (key_words[5] ^ key_words[6]) + mix)
    result = hashlib.sha3_256(payload).digest()[:8].hex()
    return result

print(pipeline(0x1A2B3C4D5E6F7089))