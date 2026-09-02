from PIL import Image

img = Image.open('画像/NPC/npc_blacksmith_ken.png').convert('RGBA')
width, height = img.size
pixels = img.load()

# Print bottom row alpha values
bottom_alpha = [pixels[x, height-1][3] for x in range(width)]
print("Bottom row alpha:", set(bottom_alpha))

# Count pure white pixels
white_count = 0
for y in range(height):
    for x in range(width):
        r,g,b,a = pixels[x,y]
        if r>240 and g>240 and b>240 and a>200:
            white_count += 1
print(f"White pixels remaining: {white_count}")

