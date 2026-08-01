from PIL import Image
import glob

def process_image(filepath):
    try:
        img = Image.open(filepath).convert("RGBA")
        data = img.getdata()
        w, h = img.size
        bg_colors = set()
        for x in range(0, w, 5):
            bg_colors.add(img.getpixel((x, 0))[:3])
            bg_colors.add(img.getpixel((x, h-1))[:3])
        for y in range(0, h, 5):
            bg_colors.add(img.getpixel((0, y))[:3])
            bg_colors.add(img.getpixel((w-1, y))[:3])
            
        new_data = []
        for item in data:
            r, g, b, a = item
            is_bg = False
            for br, bg, bb in bg_colors:
                if abs(r - br) < 15 and abs(g - bg) < 15 and abs(b - bb) < 15:
                    is_bg = True
                    break
            if is_bg:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
                
        img.putdata(new_data)
        img.save(filepath, "PNG")
        print(f"Processed {filepath}")
    except Exception as e:
        print(f"Failed {filepath}: {e}")

for f in glob.glob("assets/items/*.png") + glob.glob("assets/monsters_new/*.png"):
    process_image(f)
