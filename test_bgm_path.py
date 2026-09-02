import os
import unicodedata

expected = "BGM SE/BGM/ステージ１.m4a"
print("Expected:", [hex(ord(c)) for c in expected])

for f in os.listdir("BGM SE/BGM"):
    if "１" in f:
        print("Found:", f, [hex(ord(c)) for c in f])
