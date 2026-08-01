from PIL import Image
import os
import sys

def process_monsters(image_path, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    try:
        img = Image.open(image_path).convert("RGBA")
    except Exception as e:
        print(f"Error opening {image_path}: {e}")
        sys.exit(1)

    width, height = img.size
    
    # Background removal: make white or near-white pixels transparent
    datas = img.getdata()
    new_data = []
    for item in datas:
        # white or light gray background
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)

    # The image has 2 rows and 4 columns
    w_step = width // 4
    h_step = height // 2

    count = 1
    for r in range(2):
        for c in range(4):
            left = c * w_step
            top = r * h_step
            right = (c + 1) * w_step
            bottom = (r + 1) * h_step
            
            box = (left, top, right, bottom)
            cropped = img.crop(box)
            
            # Crop to actual bounding box of the non-transparent pixels to remove extra padding
            bbox = cropped.getbbox()
            if bbox:
                cropped = cropped.crop(bbox)
            
            out_path = os.path.join(output_dir, f"monster_{count}.png")
            cropped.save(out_path, "PNG")
            print(f"Saved {out_path}")
            count += 1

if __name__ == "__main__":
    img_path = "/Users/motoyamayuuki/タイピングゲーム汎用/画像/モンスター/タイピングモンスター１.png"
    out_dir = "/Users/motoyamayuuki/タイピングゲーム汎用/assets/monsters"
    process_monsters(img_path, out_dir)
