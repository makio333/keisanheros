from PIL import Image
import glob

def remove_background(filepath):
    try:
        img = Image.open(filepath).convert("RGBA")
        pixels = img.load()
        width, height = img.size
        
        def is_bg(c):
            r, g, b, a = c
            return r > 240 and g > 240 and b > 240
            
        stack = []
        # Add ALL border pixels to the stack
        for x in range(width):
            stack.append((x, 0))
            stack.append((x, height-1))
        for y in range(height):
            stack.append((0, y))
            stack.append((width-1, y))
            
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
                            
        # Overwrite PNG
        img.save(filepath, "PNG")
        print(f"Processed {filepath}")
    except Exception as e:
        print(f"Failed {filepath}: {e}")

for f in glob.glob("画像/NPC/*.png"):
    remove_background(f)
