from PIL import Image
import os
import glob
from collections import deque

def flood_fill_transparency(img, tolerance=30):
    width, height = img.size
    pixels = img.load()
    
    # 1. Determine background color from corners
    corners = [(0,0), (width-1,0), (0,height-1), (width-1,height-1)]
    bg_colors = []
    for cx, cy in corners:
        r,g,b,a = pixels[cx, cy]
        if a > 0:
            bg_colors.append((r,g,b))
    
    if not bg_colors:
        bg_r, bg_g, bg_b = 245, 245, 245
    else:
        bg_r = sum(c[0] for c in bg_colors)//len(bg_colors)
        bg_g = sum(c[1] for c in bg_colors)//len(bg_colors)
        bg_b = sum(c[2] for c in bg_colors)//len(bg_colors)
        
    def is_bg(r, g, b):
        if abs(r - bg_r) < tolerance and abs(g - bg_g) < tolerance and abs(b - bg_b) < tolerance:
            return True
        if r > 235 and g > 235 and b > 235:
            return True
        return False

    # 2. BFS from all edges
    queue = deque()
    visited = set()
    
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height-1))
        visited.add((x, 0))
        visited.add((x, height-1))
        
    for y in range(1, height-1):
        queue.append((0, y))
        queue.append((width-1, y))
        visited.add((0, y))
        visited.add((width-1, y))
        
    bg_pixels = []
    
    while queue:
        x, y = queue.popleft()
        r, g, b, a = pixels[x, y]
        
        if is_bg(r, g, b):
            bg_pixels.append((x, y))
            for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        visited.add((nx, ny))
                        queue.append((nx, ny))

    # 3. Make background pixels transparent
    for x, y in bg_pixels:
        pixels[x, y] = (255, 255, 255, 0)
        
    return img

def process_sheet(image_path, output_dir, prefix):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    
    w_step = width // 4
    h_step = height // 2

    count = 1
    for r in range(2):
        for c in range(4):
            left = c * w_step
            top = r * h_step
            right = (c + 1) * w_step
            bottom = (r + 1) * h_step
            
            # For the boss image text
            cell_bottom = bottom - int(h_step * 0.16)
            
            box = (left, top, right, cell_bottom)
            cropped = img.crop(box)
            
            # Flood fill background removal
            cropped = flood_fill_transparency(cropped, tolerance=30)
            
            # Trim bounding box
            bbox = cropped.getbbox()
            if bbox:
                cropped = cropped.crop(bbox)
            
            out_path = os.path.join(output_dir, f"{prefix}_{count}.png")
            cropped.save(out_path, "PNG")
            print(f"Saved {out_path}")
            count += 1

if __name__ == "__main__":
    src_dir = "/Users/motoyamayuuki/.gemini/antigravity/brain/2334a8f9-6d13-43b7-96fb-a1020758a9c6/.user_uploaded"
    out_dir = "assets/monsters_new"
    
    files = sorted(glob.glob(os.path.join(src_dir, "*.*")))
    for i, f in enumerate(files):
        prefix = f"up_img{i+1}"
        print(f"Processing {f} with prefix {prefix}")
        process_sheet(f, out_dir, prefix)

