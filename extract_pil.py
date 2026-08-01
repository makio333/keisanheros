from PIL import Image
import os

def get_connected_components(img):
    width, height = img.size
    pixels = img.load()
    
    visited = set()
    components = []
    
    for y in range(height):
        for x in range(width):
            if (x, y) not in visited:
                p = pixels[x, y]
                # Check if it's not white
                if p[0] < 240 or p[1] < 240 or p[2] < 240:
                    # BFS to find component
                    q = [(x, y)]
                    visited.add((x, y))
                    min_x, min_y, max_x, max_y = x, y, x, y
                    
                    while q:
                        cx, cy = q.pop(0)
                        
                        min_x = min(min_x, cx)
                        max_x = max(max_x, cx)
                        min_y = min(min_y, cy)
                        max_y = max(max_y, cy)
                        
                        for nx, ny in [(cx-1, cy), (cx+1, cy), (cx, cy-1), (cx, cy+1)]:
                            if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                                np = pixels[nx, ny]
                                if np[0] < 240 or np[1] < 240 or np[2] < 240:
                                    visited.add((nx, ny))
                                    q.append((nx, ny))
                                else:
                                    visited.add((nx, ny))
                                
                    if max_x - min_x > 50 and max_y - min_y > 50:
                        components.append((min_x, min_y, max_x, max_y))
                else:
                    visited.add((x, y))
                    
    return components

def extract_icons(image_path, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    img = Image.open(image_path).convert("RGBA")
    
    # Downscale for faster BFS
    small_img = img.resize((img.width // 4, img.height // 4), Image.NEAREST)
    components = get_connected_components(small_img)
    
    # Upscale bounding boxes
    components = [(x1*4, y1*4, x2*4, y2*4) for x1, y1, x2, y2 in components]
    
    # Sort by y then x
    components.sort(key=lambda b: (b[1], b[0]))
    
    count = 1
    for box in components:
        cropped = img.crop(box)
        
        # Make white background transparent
        datas = cropped.getdata()
        new_data = []
        for item in datas:
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
        cropped.putdata(new_data)
        
        out_path = os.path.join(output_dir, f"ui_icon_{count}.png")
        cropped.save(out_path, "PNG")
        print(f"Saved {out_path}")
        count += 1

if __name__ == "__main__":
    img_path = "/Users/motoyamayuuki/タイピングゲーム汎用/画像/UI/Gemini_Generated_Image_np5scbnp5scbnp5s.png"
    out_dir = "/Users/motoyamayuuki/タイピングゲーム汎用/assets/ui_icons"
    extract_icons(img_path, out_dir)
