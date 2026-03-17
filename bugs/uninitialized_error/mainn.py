import hashlib
import time
import random
import os

seed = int(time.time())
random.seed(seed)

raw_bytes = bytes([random.randint(0, 255) for _ in range(32)])

hex_stage = raw_bytes.hex()

split_mid = len(hex_stage) // 2
left_half = hex_stage[:split_mid]
right_half = hex_stage[split_mid:]

salt = str(random.randint(1000, 9999))

salted = left_half + salt + right_half

hashed = hashlib.sha256(salted.encode()).hexdigest()

folded = hex(int(hashed[:32], 16) ^ int(hashed[32:], 16))[2:].zfill(32)

noise = os.urandom(16).hex()

mixed = "".join(a if random.random() > 0.5 else b for a, b in zip(folded, noise))

suffix = "00"

final = mixed[:62].upper() + suffix

print(final)