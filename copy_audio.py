import os
import shutil

src_dir = "BGM SE"
public_dir = "public/assets_audio"

os.makedirs(public_dir, exist_ok=True)

# 変換マップ
audio_map = {
    'bgm_title': 'BGM/タイトル/Eggplant_Planet.m4a',
    'bgm_home': 'BGM/拠点.m4a',
    'bgm_room': 'BGM/自分の部屋.m4a',
    'bgm_stage1': 'BGM/ステージ１.m4a',
    'bgm_training': 'BGM/修行.m4a',
    'se_crit': 'SE/クリティカル.mp3',
    'se_clear': 'SE/ステージクリア.mp3',
    'se_type': 'SE/入力成功.mp3',
    'se_slash': 'SE/斬撃.mp3',
    'se_decide': 'SE/決定.mp3',
    'se_gameover': 'BGM/ゲームオーバー.m4a',
    'se_gacha_result': 'SE/ガチャ結果.mp3',
    'se_gacha_result2': 'SE/ガチャ結果２.mp3',
}

# 実際のファイル名 (NFDになっている可能性がある) を探し出して安全な英数名でコピー
def find_file(rel_path):
    import unicodedata
    target_path = os.path.join(src_dir, rel_path)
    if os.path.exists(target_path):
        return target_path
    
    # NFC / NFD 比較
    dir_name = os.path.dirname(target_path)
    base_name = os.path.basename(target_path)
    
    if os.path.exists(dir_name):
        for f in os.listdir(dir_name):
            if unicodedata.normalize('NFC', f) == unicodedata.normalize('NFC', base_name):
                return os.path.join(dir_name, f)
    return None

for key, rel_path in audio_map.items():
    actual_path = find_file(rel_path)
    if actual_path:
        ext = os.path.splitext(actual_path)[1]
        dest_path = os.path.join(public_dir, f"{key}{ext}")
        shutil.copy(actual_path, dest_path)
        print(f"Copied: {actual_path} -> {dest_path}")
    else:
        print(f"Not found: {rel_path}")

