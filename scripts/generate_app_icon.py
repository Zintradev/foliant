import os
import struct
import subprocess
from PIL import Image

ICO_SIZES = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]

def create_app_icon_svg():
    with open("public/logo.svg", "r", encoding="utf-8") as f:
        orig_svg = f.read()

    # Exact squircle background:
    # 1. Dark background color of Default Foliant theme: #121215
    # 2. Subtle 1px semi-transparent light border: stroke="#ffffff" stroke-opacity="0.18" stroke-width="1"
    # 3. All vector elements, colors (fill:#076b4c, gradients, black hilt, gold guard),
    #    strokes, and typography from public/logo.svg are copied 100% untouched.
    squircle_layer = """  <g
     inkscape:groupmode="layer"
     id="layer_bg_squircle"
     inkscape:label="Fondo Squircle">
    <rect
       id="rect_bg_squircle"
       width="188"
       height="188"
       x="6"
       y="6"
       rx="42"
       ry="42"
       style="fill:#121215;fill-opacity:1;stroke:#ffffff;stroke-opacity:0.18;stroke-width:1;paint-order:fill stroke" />
  </g>
"""

    pos = orig_svg.find('<g\n     inkscape:label="Capa 1"')
    if pos == -1:
        pos = orig_svg.find('id="layer1"')
        pos = orig_svg.rfind('<g', 0, pos)

    app_icon_content = orig_svg[:pos] + squircle_layer + orig_svg[pos:]

    os.makedirs("design", exist_ok=True)
    with open("design/app_icon.svg", "w", encoding="utf-8") as f:
        f.write(app_icon_content)
    print("Created design/app_icon.svg preserving exact original colors and vectors with #121215 squircle")

def verify_ico(ico_path):
    with open(ico_path, "rb") as f:
        buf = f.read()
    count = struct.unpack_from("<H", buf, 4)[0]
    resolutions = []
    for i in range(count):
        w, h = struct.unpack_from("BB", buf, 6 + i * 16)
        resolutions.append((w or 256, h or 256))
    print(f"Verified {ico_path}: {len(resolutions)} resolutions -> {resolutions}")
    return resolutions

def main():
    print("=== Step 1: Create design/app_icon.svg ===")
    create_app_icon_svg()

    print("\n=== Step 2: Regenerate main application icons via Tauri CLI ===")
    subprocess.run(["npm", "run", "tauri", "icon", "--", "design/app_icon.svg"], shell=True, check=True)

    # Ensure icon.ico includes full multi-resolution suite (16 to 256)
    img = Image.open("src-tauri/icons/icon.png")
    img.save("src-tauri/icons/icon.ico", format="ICO", sizes=ICO_SIZES)

    print("\n=== Step 3: Verification of icon assets ===")
    verify_ico("src-tauri/icons/icon.ico")
    verify_ico("src-tauri/icons/file_icon.ico")
    print(f"src-tauri/icons/icon.icns size: {os.path.getsize('src-tauri/icons/icon.icns')} bytes")
    print(f"src-tauri/icons/file_icon.icns size: {os.path.getsize('src-tauri/icons/file_icon.icns')} bytes")
    print("All icons successfully generated and verified!")

if __name__ == "__main__":
    main()
