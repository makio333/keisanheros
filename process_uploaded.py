from PIL import Image
import os
import glob

def process_sheet(image_path, output_dir, prefix):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    
    # 2 rows, 4 columns
    w_step = width // 4
    h_step = height // 2

    count = 1
    for r in range(2):
        for c in range(4):
            left = c * w_step
            top = r * h_step
            right = (c + 1) * w_step
            bottom = (r + 1) * h_step
            
            # For the boss image (and others), crop a bit of the bottom to remove text if present
            # The text is usually in the bottom 15% of the cell
            cell_bottom = bottom - int(h_step * 0.18)
            
            box = (left, top, right, cell_bottom)
            cropped = img.crop(box)
            
            # Remove background (near white/gray/beige)
            datas = cropped.getdata()
            new_data = []
            
            # Find the most common edge color to use as background
            edge_colors = []
            for x in range(cropped.width):
                edge_colors.append(cropped.getpixel((x, 0)))
                edge_colors.append(cropped.getpixel((x, cropped.height-1)))
            for y in range(cropped.height):
                edge_colors.append(cropped.getpixel((0, y)))
                edge_colors.append(cropped.getpixel((cropped.width-1, y)))
                
            # Filter out transparent pixels if any
            edge_colors = [col for col in edge_colors if col[3] > 0]
            if edge_colors:
                # simple average of light edge pixels
                light_edges = [col for col in edge_colors if sum(col[:3]) > 600]
                if light_edges:
                    bg_r = sum(col[0] for col in light_edges) / len(light_edges)
                    bg_g = sum(col[1] for col in light_edges) / len(light_edges)
                    bg_b = sum(col[2] for col in light_edges) / len(light_edges)
                else:
                    bg_r, bg_g, bg_b = 245, 245, 245
            else:
                bg_r, bg_g, bg_b = 245, 245, 245

            for item in datas:
                # If color is close to background color, make it transparent
                # Tolerance
                if abs(item[0]-bg_r) < 25 and abs(item[1]-bg_g) < 25 and abs(item[2]-bg_b) < 25:
                    new_data.append((255, 255, 255, 0))
                elif item[0] > 230 and item[1] > 230 and item[2] > 230:
                    new_data.append((255, 255, 255, 0))
                else:
                    new_data.append(item)
            cropped.putdata(new_data)
            
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

