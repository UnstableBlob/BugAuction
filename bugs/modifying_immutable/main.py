import hashlib, struct

def chacha_qround(a, b, c, d):
    a = (a + b) & 0xFFFFFFFF; d ^= a; d = ((d << 16) | (d >> 16)) & 0xFFFFFFFF
    c = (c + d) & 0xFFFFFFFF; b ^= c; b = ((b << 12) | (b >> 20)) & 0xFFFFFFFF
    a = (a + b) & 0xFFFFFFFF; d ^= a; d = ((d << 8)  | (d >> 24)) & 0xFFFFFFFF
    c = (c + d) & 0xFFFFFFFF; b ^= c; b = ((b << 7)  | (b >> 25)) & 0xFFFFFFFF
    return a, b, c, d

def chacha_block(state):
    s = list(state)
    for _ in range(10):
        s[0],s[4],s[8], s[12] = chacha_qround(s[0],s[4],s[8], s[12])
        s[1],s[5],s[9], s[13] = chacha_qround(s[1],s[5],s[9], s[13])
        s[2],s[6],s[10],s[14] = chacha_qround(s[2],s[6],s[10],s[14])
        s[3],s[7],s[11],s[15] = chacha_qround(s[3],s[7],s[11],s[15])
        s[0],s[5],s[10],s[15] = chacha_qround(s[0],s[5],s[10],s[15])
        s[1],s[6],s[11],s[12] = chacha_qround(s[1],s[6],s[11],s[12])
        s[2],s[7],s[8], s[13] = chacha_qround(s[2],s[7],s[8], s[13])
        s[3],s[4],s[9], s[14] = chacha_qround(s[3],s[4],s[9], s[14])
    return [(s[i] + state[i]) & 0xFFFFFFFF for i in range(16)]

def build_state(seed):
    SIGMA = (0x61707865, 0x3320646E, 0x79622D32, 0x6B206574)
    key = [((seed >> (i * 8)) & 0xFF) for i in range(8)]
    key_words = [struct.unpack('<I', bytes(key[i*4:(i+1)*4] + [0]*(4-len(key[i*4:(i+1)*4]))))[0] for i in range(2)]
    key_words += [seed & 0xFFFFFFFF, (seed >> 32) & 0xFFFFFFFF,
                  seed ^ 0xDEADBEEF, (seed * 3) & 0xFFFFFFFF,
                  (seed >> 16) ^ 0xCAFE, (seed ^ 0x1234) & 0xFFFFFFFF]
    return SIGMA + tuple(key_words) + (1, 0, seed & 0xFFFF, (seed >> 48) & 0xFFFF)

def pipeline(seed):
    state = build_state(seed)
    state[12] = 1
    block = chacha_block(state)
    raw = struct.pack('<16I', *block)
    compressed = hashlib.sha256(raw).digest()
    final = struct.unpack('>Q', compressed[:8])[0]
    final ^= struct.unpack('>Q', compressed[8:16])[0]
    return format(final & 0xFFFFFFFFFFFFFFFF, '016x')

print(pipeline(0xF0E1D2C3B4A59687))