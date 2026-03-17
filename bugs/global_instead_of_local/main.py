import hashlib, struct

def galois_lfsr(state, poly=0xB400000000000000, bits=64):
    for _ in range(256):
        lsb = state & 1
        state >>= 1
        if lsb:
            state ^= poly
    return state & 0xFFFFFFFFFFFFFFFF

def sponge_absorb(lanes, data_words):
    rate = 4
    for i, w in enumerate(data_words):
        lanes[i % rate] ^= w
        lanes[i % rate] = (lanes[i % rate] * 0x9E3779B97F4A7C15) & 0xFFFFFFFFFFFFFFFF
        lanes[i % rate] ^= lanes[i % rate] >> 32
    return lanes

def sponge_squeeze(lanes, length=1):
    result = []
    for i in range(length):
        v = lanes[i % len(lanes)]
        v ^= v >> 17
        v = (v * 0xBF58476D1CE4E5B9) & 0xFFFFFFFFFFFFFFFF
        result.append(v)
    return result

ROUND_CONSTANTS = [0x428A2F98D728AE22, 0x7137449123EF65CD,
                   0xB5C0FBCFEC4D3B2F, 0xE9B5DBA58189DBBC]

lanes = [0x0, 0x0, 0x0, 0x0]

def pipeline(seed):
    lfsr_out = galois_lfsr(seed)
    data_words = [
        (lfsr_out >> (i * 16)) ^ ROUND_CONSTANTS[i % 4]
        for i in range(8)
    ]
    lanes = sponge_absorb(lanes, data_words)
    squeezed = sponge_squeeze(lanes, 2)
    final_val = (squeezed[0] ^ squeezed[1]) & 0xFFFFFFFFFFFFFFFF
    payload = struct.pack('>Q', final_val)
    return hashlib.blake2b(payload, digest_size=8).hexdigest()

print(pipeline(0xA1B2C3D4E5F60718))