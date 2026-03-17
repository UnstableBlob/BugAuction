import hashlib, struct

def threefish_mix(a, b, rot):
    a = (a + b) & 0xFFFFFFFFFFFFFFFF
    b = ((b << rot) | (b >> (64 - rot))) & 0xFFFFFFFFFFFFFFFF
    b ^= a
    return a, b

def threefish_round(words, rot_schedule):
    for rot in rot_schedule:
        words[0], words[1] = threefish_mix(words[0], words[1], rot)
        words[2], words[3] = threefish_mix(words[2], words[3], rot ^ 13)
        words[1], words[2] = words[2], words[1]
    return words

def key_schedule(key_words, tweak, round_num):
    C240 = 0x1BD11BDAA9FC1A22
    ext = C240
    for w in key_words:
        ext ^= w
    schedule = [(key_words[(round_num + i) % 5] + tweak[i % 3]) & 0xFFFFFFFFFFFFFFFF
                for i in range(4)]
    schedule[3] = (schedule[3] + round_num) & 0xFFFFFFFFFFFFFFFF
    return schedule

def pipeline(seed):
    tweak = [seed ^ 0xDEAD, (seed >> 32) ^ 0xBEEF, 0]
    tweak[2] = tweak[0] ^ tweak[1]
    key_words = []
    v = seed
    for i in range(5):
        v = (v * 0x5851F42D4C957F2D + 0x14057B7EF767814F) & 0xFFFFFFFFFFFFFFFF
        key_words.append(v)
    rot_schedule = [14, 16, 52, 57, 23, 40, 5, 37]
    words = [key_words[i] for i in range(4)]
    for rnd in range(9):
        ks = key_schedule(key_words, tweak, rnd)
        words = [(words[i] + ks[i]) & 0xFFFFFFFFFFFFFFFF for i in range(4)]
        words = threefish_round(words, rot_schedule)
    digest_input = struct.pack('>4Q', *words)
    return hashlib.sha3_256(digest_input).digest()[:8].hex()

print(pipeline(0x5A4B3C2D1E0F9687))