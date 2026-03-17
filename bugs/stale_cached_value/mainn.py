import hashlib, struct

def skein_mix(x0, x1, rot):
    x0 = (x0 + x1) & 0xFFFFFFFFFFFFFFFF
    x1 = (((x1 << rot) | (x1 >> (64 - rot))) & 0xFFFFFFFFFFFFFFFF) ^ x0
    return x0, x1

def skein_permute(words):
    n = len(words)
    return [words[(i * 3 + 1) % n] for i in range(n)]

def skein_round(words, rots):
    pairs = [(0,1),(2,3),(4,5),(6,7)]
    for idx, (a, b) in enumerate(pairs):
        words[a], words[b] = skein_mix(words[a], words[b], rots[idx % len(rots)])
    return skein_permute(words)

def tweak_schedule(tweak, round_num):
    t0, t1 = tweak
    t2 = t0 ^ t1
    tweaks = [t0, t1, t2]
    return tweaks[round_num % 3]

def build_key(seed):
    words = []
    v = seed
    for i in range(8):
        v = (v ^ (v >> 30)) & 0xFFFFFFFFFFFFFFFF
        v = (v * 0xBF58476D1CE4E5B9) & 0xFFFFFFFFFFFFFFFF
        v = (v ^ (v >> 27)) & 0xFFFFFFFFFFFFFFFF
        v = (v * 0x94D049BB133111EB) & 0xFFFFFFFFFFFFFFFF
        words.append(v)
    return words

def pipeline(seed):
    key = build_key(seed)
    tweak = (seed ^ 0xFACEFEED, (seed >> 32) | 0xC0FFEE00)
    rots = [46, 36, 19, 37]
    words = [key[i] ^ key[(i + 4) % 8] for i in range(8)]
    cache = {}
    for r in range(12):
        t = tweak_schedule(tweak, r)
        words = [(w + key[i % 8] + t) & 0xFFFFFFFFFFFFFFFF for i, w in enumerate(words)]
        words = skein_round(words, rots)
        cache[r] = words[:]
    checksum = 0
    for r in range(12):
        block = cache[r]
        checksum ^= struct.unpack('>Q', hashlib.md5(
            struct.pack('>8Q', *block)
        ).digest()[:8])[0]
    payload = struct.pack('>Q', checksum) + struct.pack('>8Q', *words)
    return hashlib.blake2b(payload, digest_size=8).hexdigest()

print(pipeline(0xB1A2F3E4D5C6B7A8))