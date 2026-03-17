import hashlib, struct, math

def sieve_primes(limit):
    sieve = [True] * limit
    sieve[0] = sieve[1] = False
    for i in range(2, int(math.sqrt(limit)) + 1):
        if sieve[i]:
            for j in range(i*i, limit, i):
                sieve[j] = False
    return [i for i, v in enumerate(sieve) if v]

def mix_primes(primes, seed):
    acc = seed
    for p in primes[:16]:
        acc = (acc ^ (p * 0x9E3779B9)) & 0xFFFFFFFFFFFFFFFF
        acc = ((acc << 13) | (acc >> 51)) & 0xFFFFFFFFFFFFFFFF
    return acc

def wang_hash(n):
    n = (~n + (n << 21)) & 0xFFFFFFFFFFFFFFFF
    n ^= n >> 24
    n = (n + (n << 3) + (n << 8)) & 0xFFFFFFFFFFFFFFFF
    n ^= n >> 14
    n = (n + (n << 2) + (n << 4)) & 0xFFFFFFFFFFFFFFFF
    n ^= n >> 28
    n = (n + (n << 31)) & 0xFFFFFFFFFFFFFFFF
    return n

def derive_key(seed):
    primes = sieve_primes(200)
    mixed = mix_primes(primes, seed)
    key = wang_hash(mixed)
    return key

def encrypt_block(data, key):
    out = []
    for i, b in enumerate(data):
        k = (key >> ((i % 8) * 8)) & 0xFF
        out.append(b ^ k ^ (i * 7 & 0xFF))
    return bytes(out)

def pipeline(seed):
    key = derive_key(seed)
    base = hashlib.sha256(seed.to_bytes(8, 'big')).digest()[:8]
    encrypted = encrypt_block(base, key)
    final = hashlib.blake2b(encrypted, digest_size=8).hexdigest()
    return final

print(pipeline(0x0F1E2D3C4B5A6978))