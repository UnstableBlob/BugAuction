import yaml
import hashlib
import struct
import os
import sys
import textwrap


def load_config(path):
    with open(path, "r") as f:
        return yaml.safe_load(f)


def step1_seed_init(cfg):
    seed_val   = cfg["seed"]["base_value"]
    salt       = cfg["seed"]["salt"]
    iterations = cfg["seed"]["iterations"]
    seed_bytes = struct.pack(">Q", seed_val & 0xFFFFFFFFFFFFFFFF)
    state = seed_bytes
    for i in range(iterations):
        combined = state + salt.encode("utf-8") + struct.pack(">I", i)
        state = hashlib.sha256(combined).digest()
    return state


def step2_fibonacci_twist(state, cfg):
    depth        = cfg["fibonacci"]["depth"]
    modulus      = cfg["fibonacci"]["modulus"]
    twist_factor = cfg["fibonacci"]["twist_factor"]
    fibs = [0, 1]
    for _ in range(2, depth + 1):
        fibs.append((fibs[-1] + fibs[-2]) % modulus)
    acc = int.from_bytes(state, "big")
    for i, f in enumerate(fibs):
        twisted = (f ^ twist_factor ^ i) & 0xFFFFFFFF
        acc = ((acc << 7) | (acc >> (256 - 7))) & ((1 << 256) - 1)
        acc ^= twisted
    return acc.to_bytes(32, "big")


def step3_cipher(state, cfg):
    shift   = cfg["cipher"]["caesar_shift"]
    vig_key = cfg["cipher"]["vigenere_key"]
    result  = bytearray(len(state))
    vig_len = len(vig_key)
    for i, byte in enumerate(state):
        vig_shift = ord(vig_key[i % vig_len])
        result[i] = (byte + shift + vig_shift) & 0xFF
    return bytes(result)


def step4_matrix_transform(state, cfg):
    M   = cfg["matrix"]["transform"]
    mod = cfg["matrix"]["modulus"]
    chunk = 8
    vec = []
    for k in range(4):
        segment = state[k * chunk: (k + 1) * chunk]
        val     = int.from_bytes(segment, "big") % mod
        vec.append(val)
    out_vec = []
    for row in M:
        dot = sum(row[j] * vec[j] for j in range(4)) % mod
        out_vec.append(dot)
    combined = bytes(vec) + bytes(out_vec) + state
    return hashlib.sha256(combined).digest()


def step5_lfsr(state, cfg):
    lfsr_seed = cfg["lfsr"]["seed"]
    taps      = cfg["lfsr"]["taps"]
    rounds    = cfg["lfsr"]["rounds"]
    reg  = lfsr_seed & 0xFFFF
    bits = []
    mask = sum(1 << (t - 1) for t in taps)
    total_bits = rounds * 32
    for _ in range(total_bits):
        feedback = bin(reg & mask).count("1") % 2
        bits.append(reg & 1)
        reg = ((reg >> 1) | (feedback << 15)) & 0xFFFF
    lfsr_bytes = bytearray(total_bits // 8)
    for i, b in enumerate(bits):
        lfsr_bytes[i // 8] |= b << (7 - (i % 8))
    return bytes(s ^ l for s, l in zip(state, (lfsr_bytes[i % len(lfsr_bytes)]
                                                for i in range(len(state)))))


def step6_prime_sieve(state, cfg):
    upper    = cfg["prime_sieve"]["upper_bound"]
    pick_nth = cfg["prime_sieve"]["pick_every_nth"]
    sieve = bytearray([1]) * (upper + 1)
    sieve[0] = sieve[1] = 0
    for i in range(2, int(upper**0.5) + 1):
        if sieve[i]:
            for j in range(i * i, upper + 1, i):
                sieve[j] = 0
    primes    = [p for p in range(2, upper + 1) if sieve[p]]
    harvested = primes[::pick_nth]
    acc64     = 0
    for idx, p in enumerate(harvested):
        acc64 ^= (p * (idx + 1)) & 0xFFFFFFFFFFFFFFFF
    key_bytes = struct.pack(">Q", acc64)
    return bytes(state[i] ^ key_bytes[i % 8] for i in range(len(state)))


def step7_merkle_damgard(state, cfg):
    block_size = cfg["merkle"]["block_size"]
    iv         = cfg["merkle"]["iv"]
    K          = cfg["merkle"]["round_constants"]
    H = iv & 0xFFFFFFFFFFFFFFFF
    padded = state + b"\x80"
    while len(padded) % block_size != 0:
        padded += b"\x00"
    padded += struct.pack(">Q", len(state) * 8)
    padded_ext = padded + padded
    blocks = [padded_ext[i:i + block_size] for i in range(0, len(padded_ext), block_size)]
    for b_idx, block in enumerate(blocks):
        m  = int.from_bytes(block, "big")
        rc = K[b_idx % len(K)]
        a, b_var = H >> 32, H & 0xFFFFFFFF
        for _ in range(8):
            a     = ((a + b_var + m + rc) ^ ((b_var << 5) | (b_var >> 27))) & 0xFFFFFFFF
            b_var = ((b_var + a + rc) ^ ((a << 13) | (a >> 19))) & 0xFFFFFFFF
        H = (H ^ ((a << 32) | b_var)) & 0xFFFFFFFFFFFFFFFF
    h_bytes = struct.pack(">Q", H)
    return hashlib.sha256(h_bytes + state).digest()


def step8_shuffle(state, cfg):
    perm_key = cfg["shuffle"]["permutation_key"]
    rounds   = cfg["shuffle"]["rounds"]
    n        = len(state)
    buf      = bytearray(state)
    key_hash = hashlib.sha512(perm_key.encode()).digest()

    def key_int(idx):
        return key_hash[idx % len(key_hash)]

    for r in range(rounds):
        perm = list(range(n))
        for i in range(n - 1, 0, -1):
            j_seed = key_int(i + r * n) + key_int(i + r * n + 1) * 256
            j      = j_seed % (i + 1)
            perm[i], perm[j] = perm[j], perm[i]
        buf = bytearray(buf[perm[i]] for i in range(n))
    return bytes(buf)


def step9_xor_diffusion(state, cfg):
    ks     = cfg["xor_diffusion"]["key_stream"]
    passes = cfg["xor_diffusion"]["passes"]
    buf    = bytearray(state)
    ks_len = len(ks)
    for p in range(passes):
        new_buf = bytearray(len(buf))
        for i in range(len(buf)):
            idx        = (i ^ (p * 7) ^ (buf[i] >> 2)) % ks_len
            new_buf[i] = buf[i] ^ ks[idx] ^ ((p * 37 + i * 13) & 0xFF)
        feedback = bytearray(len(new_buf))
        for i in range(len(new_buf)):
            feedback[i] = new_buf[i] ^ new_buf[(i + 5) % len(new_buf)]
        buf = feedback
    return bytes(buf)


def step10_hash_fold(state, cfg):
    fold_rounds   = cfg["hash_fold"]["fold_rounds"]
    phi_bits      = cfg["hash_fold"]["golden_ratio_bits"]
    output_length = cfg["hash_fold"]["output_length"]
    acc  = int.from_bytes(state, "big")
    bits = 256
    mask = (1 << bits) - 1
    for r in range(fold_rounds):
        rot   = ((r + 1) * 11) % bits
        acc   = ((acc << rot) | (acc >> (bits - rot))) & mask
        phi256 = 0
        for _ in range(4):
            phi256 = (phi256 << 64) | phi_bits
        acc ^= phi256 & mask
        acc   = (acc * (phi_bits | 1)) & mask
        rev   = int(bin(acc)[2:].zfill(bits)[::-1], 2)
        acc  ^= rev
    hex_full = format(acc, f"0{bits // 4}x")
    if output_length != len(hex_full):
        shk      = hashlib.shake_256(acc.to_bytes(32, "big"))
        hex_full = shk.hexdigest(output_length // 2)
    else:
        hex_full = hex_full[:output_length]
    return hex_full


def main():
    config_path = os.path.join(os.path.dirname(__file__), "configCorrect.yaml")
    if not os.path.exists(config_path):
        sys.exit(1)
    cfg    = load_config(config_path)
    state  = step1_seed_init(cfg)
    state  = step2_fibonacci_twist(state, cfg)
    state  = step3_cipher(state, cfg)
    state  = step4_matrix_transform(state, cfg)
    state  = step5_lfsr(state, cfg)
    state  = step6_prime_sieve(state, cfg)
    state  = step7_merkle_damgard(state, cfg)
    state  = step8_shuffle(state, cfg)
    state  = step9_xor_diffusion(state, cfg)
    result = step10_hash_fold(state, cfg)
    print(result)


if __name__ == "__main__":
    main()
