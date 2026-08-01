import os
import shutil
import glob

artifact_dir = "/Users/motoyamayuuki/.gemini/antigravity/brain/0ed461eb-7b81-450d-a8f8-0c2c8feaf8ce/"
dest_monsters = "assets/monsters_new/"
dest_items = "assets/items/"

os.makedirs(dest_monsters, exist_ok=True)
os.makedirs(dest_items, exist_ok=True)
os.makedirs("画像/ステージ/", exist_ok=True)

files = glob.glob(os.path.join(artifact_dir, "*.jpg"))

for f in files:
    filename = os.path.basename(f)
    if filename.startswith("monster_"):
        parts = filename.split("_")
        name = parts[0] + "_" + parts[1]
        shutil.copy(f, os.path.join(dest_monsters, name + ".png"))
    elif filename.startswith("bg_"):
        shutil.copy(f, os.path.join("画像/ステージ/", "森_new.png"))
    elif filename.startswith("w") or filename.startswith("a") or filename.startswith("c") or filename.startswith("i"):
        # w1_wooden_sword_...
        parts = filename.split("_")
        name = parts[0]
        shutil.copy(f, os.path.join(dest_items, name + ".png"))
