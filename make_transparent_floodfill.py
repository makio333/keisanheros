from PIL import Image
import glob
import sys

def remove_background(filepath):
    try:
        img = Image.open(filepath).convert("RGBA")
        pixels = img.load()
        width, height = img.size
        
        # We will flood fill from the 4 corners
        # Target color is the background white (or near white)
        def is_bg(c):
            r, g, b, a = c
            return r > 240 and g > 240 and b > 240
            
        stack = [(0,0), (width-1,0), (0,height-1), (width-1,height-1)]
        visited = set(stack)
        
        while stack:
            x, y = stack.pop()
            if is_bg(pixels[x, y]):
                pixels[x, y] = (255, 255, 255, 0)
                # Add neighbors
                for dx, dy in [(0,1), (1,0), (0,-1), (-1,0)]:
                    nx, ny = x+dx, y+dy
                    if 0 <= nx < width and 0 <= ny < height:
                        if (nx, ny) not in visited:
                            visited.add((nx, ny))
                            stack.append((nx, ny))
                            
        # Save over the same file as PNG but rename extension if needed?
        # The user has .jpg extensions, we need to save as .png and update the game.js
        new_filepath = filepath.replace(".jpg", ".png")
        img.save(new_filepath, "PNG")
        print(f"Processed {filepath} -> {new_filepath}")
    except Exception as e:
        print(f"Failed {filepath}: {e}")

for f in glob.glob("画像/NPC/*.jpg"):
    remove_background(f)
