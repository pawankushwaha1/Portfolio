import os
import subprocess
from PIL import Image

# 1. Pure vector SVG content
svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" rx="112" fill="#13294A"/>
  <path d="M66 0V745H352Q429 745 488.5 718.0Q548 691 582.0 638.0Q616 585 616 507Q616 431 581.5 378.0Q547 325 487.5 297.5Q428 270 352 270H221V0ZM221 405H353Q386 405 410.0 418.0Q434 431 447.5 454.0Q461 477 461 507Q461 538 447.5 561.0Q434 584 410.0 597.0Q386 610 353 610H221Z" transform="translate(91.34, 396) scale(0.37584, -0.37584)" fill="#FFFFFF"/>
  <circle cx="368.5" cy="368.5" r="27.5" fill="#DE8344"/>
</svg>'''

svg_path = os.path.abspath('assets/images/favicon.svg')
with open(svg_path, 'w', encoding='utf-8') as f:
    f.write(svg_content)
print(f"Saved {svg_path}")

# 2. Render 512x512 master PNG using headless Chrome
master_png_path = os.path.abspath('scratch/master_favicon.png')
cmd = [
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    '--headless=new',
    '--disable-gpu',
    '--window-size=512,512',
    '--default-background-color=00000000',
    f'--screenshot={master_png_path}',
    f'file:///{svg_path}'
]
subprocess.run(cmd, check=True)
print(f"Rendered master PNG: {master_png_path}")

# 3. Generate raster sizes and multi-resolution ICO
master = Image.open(master_png_path).convert('RGBA')

# assets/images/favicon.png (512x512)
master.save('assets/images/favicon.png', format='PNG')
print("Saved assets/images/favicon.png")

# assets/images/apple-touch-icon.png (180x180)
master.resize((180, 180), Image.Resampling.LANCZOS).save('assets/images/apple-touch-icon.png', format='PNG')
print("Saved assets/images/apple-touch-icon.png")

# assets/images/favicon-32x32.png
master.resize((32, 32), Image.Resampling.LANCZOS).save('assets/images/favicon-32x32.png', format='PNG')
print("Saved assets/images/favicon-32x32.png")

# assets/images/favicon-16x16.png
master.resize((16, 16), Image.Resampling.LANCZOS).save('assets/images/favicon-16x16.png', format='PNG')
print("Saved assets/images/favicon-16x16.png")

# Root favicon.ico (multi-res 16, 32, 48, 64, 128, 256)
ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
master.save('favicon.ico', format='ICO', sizes=ico_sizes)
print("Saved favicon.ico")

# 4. Save copies to artifacts directory for visual inspection and verification
artifact_dir = r'C:/Users/kushw/.gemini/antigravity/brain/f0cdb6f4-1b77-4670-8973-104becbc507e'
master.save(os.path.join(artifact_dir, 'favicon_final.png'), format='PNG')
master.resize((18, 18), Image.Resampling.LANCZOS).save(os.path.join(artifact_dir, 'favicon_final_18.png'), format='PNG')
print("Saved artifacts for verification")
