import hashlib
import struct
import base64

SEED = 0xDEADBEEFCAFEBABE

def step1(val):
    return (val ^ 0xA5A5A5A5A5A5A5A5) & 0xFFFFFFFFFFFFFFFF

def step2(val):
    rotated = ((val << 17) | (val >> 47)) & 0xFFFFFFFFFFFFFFFF
    return rotated ^ 0x123456789ABCDEF0

def step3(val):
    packed = struct.pack(">Q", val)
    digest = hashlib.sha256(packed).digest()
    return struct.unpack(">Q", digest[:8])[0]

def step4(val):
    fibonacci = [0, 1]
    for _ in range(62):
        fibonacci.append((fibonacci[-1] + fibonacci[-2]) & 0xFFFFFFFFFFFFFFFF)
    mask = fibonacci[63]
    return val ^ mask

def step5(val):
    result = val
    for i in range(8):
        byte = (val >> (i * 8)) & 0xFF
        result ^= byte << ((7 - i) * 8)
    return result & 0xFFFFFFFFFFFFFFFF

def step6(val):
    packed = struct.pack(">Q", val)
    digest = hashlib.md5(packed).digest()
    return struct.unpack(">Q", digest[:8])[0]

def step7(val):
    primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53]
    result = val
    for i, p in enumerate(primes):
        result = (result + (p << (i * 4))) & 0xFFFFFFFFFFFFFFFF
    return result

def step8(val):
    packed = struct.pack(">Q", val)
    segments = struct.unpack(">BBBBBBBB", packed)
    rearranged = segments[7::-1]
    return struct.pack(">BBBBBBBB", *rearranged)

def step9(val):
    result = val ^ 0xFEDCBA9876543210
    result = ((result << 31) | (result >> 33)) & 0xFFFFFFFFFFFFFFFF
    return result

def step10(val):
    packed = struct.pack(">Q", val)
    digest = hashlib.sha512(packed).digest()
    top = struct.unpack(">Q", digest[:8])[0]
    bot = struct.unpack(">Q", digest[8:16])[0]
    return (top ^ bot) & 0xFFFFFFFFFFFFFFFF

v = SEED
v = step1(v)
v = step2(v)
v = step3(v)
v = step4(v)
v = step5(v)
v = step6(v)
v = step7(v)
v = step8(v)
v = step9(v)
v = step10(v)

result = base64.b64encode(struct.pack(">Q", v)).decode()
print(result)