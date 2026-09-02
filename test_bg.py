from PIL import Image
import numpy as np

img = Image.open('画像/NPC/npc_blacksmith_ken.png').convert('RGBA')
arr = np.array(img)
# Let's see if the white between legs is completely enclosed by non-white pixels
# Or maybe the bottom row is not purely white?
print("Bottom row of image:")
print(arr[-1, :, :])
