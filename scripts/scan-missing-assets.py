import re
import os

patterns = [
    r'src=[\'"]([^\'"]+\.(?:png|jpg|jpeg|gif|svg|webp|ico|mp4|wav|mp3))[^\'"]*[\'"]',
    r'href=[\'"]([^\'"]+\.(?:png|jpg|jpeg|gif|svg|webp|ico|mp4|wav|mp3))[^\'"]*[\'"]',
    r'url\([\'"]?([^\'"\)]+\.(?:png|jpg|jpeg|gif|svg|webp|ico|mp4|wav|mp3))[^\'"\)]*[\'"]?\)'
]

files_to_check = ['index.html', 'about.html', 'project.html', 'project-research.html', 'styles.css', 'data-manager.js', 'components.js', 'app.js', 'project.js']

missing = set()

for f in files_to_check:
    if not os.path.exists(f): continue
    with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
        content = fp.read()
    for pat in patterns:
        for match in re.findall(pat, content):
            clean = match.split('?')[0].strip()
            if clean.startswith(('http://', 'https://', 'data:', '//', '#')):
                continue
            if not os.path.exists(clean):
                missing.add((f, clean))

print(f'Total missing asset references: {len(missing)}')
for src_file, asset in sorted(missing):
    print(f'{src_file:24} -> {asset}')
