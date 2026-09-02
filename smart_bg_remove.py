from PIL import Image
import glob
import sys
sys.setrecursionlimit(20000)

def remove_background(filepath):
    try:
        # Open the ORIGINAL JPG if it exists to avoid compounding errors, 
        # but we deleted them. I'll just work on the PNG.
        img = Image.open(filepath).convert("RGBA")
        width, height = img.size
        pixels = img.load()
        
        def is_white(c):
            r, g, b, a = c
            return r > 210 and g > 210 and b > 210 and a > 100

        visited = set()
        regions = []
        
        for y in range(height):
            for x in range(width):
                if (x, y) not in visited and is_white(pixels[x,y]):
                    # BFS to find region
                    region = []
                    queue = [(x,y)]
                    visited.add((x,y))
                    
                    # Using index-based queue to avoid deep recursion or pop(0) overhead
                    head = 0
                    while head < len(queue):
                        cx, cy = queue[head]
                        head += 1
                        region.append((cx,cy))
                        
                        for dx, dy in [(0,1), (1,0), (0,-1), (-1,0)]:
                            nx, ny = cx+dx, cy+dy
                            if 0 <= nx < width and 0 <= ny < height:
                                if (nx, ny) not in visited and is_white(pixels[nx,ny]):
                                    visited.add((nx,ny))
                                    queue.append((nx,ny))
                    
                    regions.append(region)
        
        # Now analyze regions
        # If region is very large (>500 pixels) OR touches border, delete it.
        # Wait, if a character wears a white shirt, it might be > 500 pixels!
        # But retro RPG characters usually don't have pure white #FFFFFF shirts, they have shading.
        # Let's check how large the regions are.
        
        print(f"File: {filepath}")
        for r in regions:
            touches_border = any(x == 0 or x == width-1 or y == 0 or y == height-1 for (x,y) in r)
            if touches_border or len(r) > 200:
                print(f"  Removing region: size={len(r)}, touches_border={touches_border}")
                for (x,y) in r:
                    pixels[x,y] = (255,255,255,0)
            else:
                print(f"  Keeping region: size={len(r)}, touches_border={touches_border}")
                
        img.save(filepath, "PNG")
    except Exception as e:
        print(f"Failed {filepath}: {e}")

for f in glob.glob("画像/NPC/*.png"):
    remove_background(f)

