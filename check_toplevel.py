import re

with open('game.js', 'r', encoding='utf-8') as f:
    content = f.read()

# トップレベルで $('...') を呼んでいる行を探す
lines = content.split('\n')
brace_depth = 0
for i, line in enumerate(lines):
    stripped = line.strip()
    if stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*'):
        continue
    
    # 簡易深度計算
    brace_depth += line.count('{') - line.count('}')
    
    if brace_depth == 0 and '$(' in line:
        print(f"Line {i+1}: {line}")
