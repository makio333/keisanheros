import cv2
import numpy as np
import os

def extract_icons(image_path, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print("Could not read image")
        return

    # If image doesn't have alpha channel, create one
    if img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)

    gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
    # Binary threshold: anything not near-white becomes 255
    _, thresh = cv2.threshold(gray, 245, 255, cv2.THRESH_BINARY_INV)

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Sort contours left to right
    contours = sorted(contours, key=lambda c: cv2.boundingRect(c)[0])

    count = 1
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        
        # ignore very small noise (assuming icons are decently sized in a 2816x1536 image)
        if w < 100 or h < 100:
            continue
            
        cropped = img[y:y+h, x:x+w].copy()
        
        # Make near-white pixels transparent
        b, g, r, a = cv2.split(cropped)
        mask = (r > 240) & (g > 240) & (b > 240)
        a[mask] = 0
        cropped = cv2.merge((b, g, r, a))

        out_path = os.path.join(output_dir, f"ui_icon_{count}.png")
        cv2.imwrite(out_path, cropped)
        print(f"Saved {out_path} (size {w}x{h})")
        count += 1

if __name__ == "__main__":
    img_path = "/Users/motoyamayuuki/タイピングゲーム汎用/画像/UI/Gemini_Generated_Image_np5scbnp5scbnp5s.png"
    out_dir = "/Users/motoyamayuuki/タイピングゲーム汎用/assets/ui_icons"
    extract_icons(img_path, out_dir)
