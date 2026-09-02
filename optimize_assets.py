import os, glob, subprocess
from PIL import Image

print("=== 1. 戦闘背景の最適化 ===")
for f in glob.glob('画像/ステージ/戦闘背景/*.png'):
    size_before = os.path.getsize(f)
    img = Image.open(f)
    w, h = img.size
    new_w = min(1024, w)
    new_h = int(h * (new_w / w))
    img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    if img_resized.mode == 'RGBA':
        img_resized = img_resized.convert('RGB')
    # JPEG保存（拡張子は.pngのままでOK、ブラウザはMIMEを自動判定、またはPNG形式で軽量保存）
    img_resized.save(f, 'JPEG', quality=85, optimize=True)
    size_after = os.path.getsize(f)
    print(f"  {f}: {size_before/1024/1024:.2f}MB -> {size_after/1024:.1f}KB")

print("\n=== 2. アイテムアイコンの最適化 ===")
for f in glob.glob('assets/items/*.png'):
    size_before = os.path.getsize(f)
    img = Image.open(f)
    w, h = img.size
    if max(w, h) > 256:
        new_w = min(256, w)
        new_h = int(h * (new_w / w))
        img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        img_resized.save(f, 'PNG', optimize=True)
        size_after = os.path.getsize(f)
        print(f"  {f}: {size_before/1024:.1f}KB -> {size_after/1024:.1f}KB")

print("\n=== 3. 背景画像の最適化 ===")
for f in glob.glob('assets/bg/*.jpg') + glob.glob('画像/ステージ/*.jpg') + glob.glob('画像/bg_*.jpg'):
    size_before = os.path.getsize(f)
    img = Image.open(f)
    w, h = img.size
    new_w = min(1280, w)
    new_h = int(h * (new_w / w))
    img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    if img_resized.mode == 'RGBA':
        img_resized = img_resized.convert('RGB')
    img_resized.save(f, 'JPEG', quality=82, optimize=True)
    size_after = os.path.getsize(f)
    print(f"  {f}: {size_before/1024:.1f}KB -> {size_after/1024:.1f}KB")

print("\n=== 4. BGMのAAC圧縮 ===")
for f in glob.glob('BGM SE/BGM/**/*.mp3', recursive=True):
    size_before = os.path.getsize(f)
    tmp_m4a = f.replace('.mp3', '.m4a')
    cmd = ['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '96000', f, tmp_m4a]
    res = subprocess.run(cmd, capture_output=True)
    if res.returncode == 0 and os.path.exists(tmp_m4a):
        # 元のmp3ファイルをm4aの内容で置換するか、m4aを参照
        size_after = os.path.getsize(tmp_m4a)
        print(f"  {f}: {size_before/1024/1024:.2f}MB -> {size_after/1024/1024:.2f}MB (AAC)")
