"""
生成ZTodo - 完整图标集（含 .ico .png）
"""
from PIL import Image, ImageDraw
import os, struct, io

RESOURCES = r"C:\Users\HC\.qclaw\workspace\todo-app\resources"
os.makedirs(RESOURCES, exist_ok=True)

SIZE = 256

def make_rounded_rect(draw, xy, radius, fill):
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill)

def draw_icon_a(draw):
    make_rounded_rect(draw, [0, 0, SIZE-1, SIZE-1], radius=52, fill=(0, 120, 212, 255))
    pad = 56
    draw.rounded_rectangle([pad, pad, SIZE-pad, SIZE-pad], radius=18, outline=(255,255,255,255), width=14)
    cx, cy = SIZE//2, SIZE//2 + 8
    pts = [(cx-42, cy), (cx-12, cy+32), (cx+44, cy-36)]
    draw.line(pts, fill=(255,255,255,255), width=16)

def draw_icon_b(draw):
    make_rounded_rect(draw, [0, 0, SIZE-1, SIZE-1], radius=52, fill=(30, 30, 30, 255))
    gold = (255, 200, 50, 255)
    lw = 18
    m = 60
    draw.line([(m, m+10), (SIZE-m, m+10)], fill=gold, width=lw)
    draw.line([(SIZE-m, m+10), (m, SIZE-m-10)], fill=gold, width=lw)
    draw.line([(m, SIZE-m-10), (SIZE-m, SIZE-m-10)], fill=gold, width=lw)

def draw_icon_c(draw):
    make_rounded_rect(draw, [0, 0, SIZE-1, SIZE-1], radius=52, fill=(230, 74, 25, 255))
    white = (255, 255, 255, 255)
    lw = 12
    x_dot = 62
    x_line_end = SIZE - 55
    rows = [80, 128, 176]
    for y in rows:
        draw.ellipse([x_dot-10, y-10, x_dot+10, y+10], fill=white)
        draw.line([(90, y), (x_line_end, y)], fill=white, width=lw)

def draw_icon_d(draw):
    make_rounded_rect(draw, [0, 0, SIZE-1, SIZE-1], radius=52, fill=(103, 58, 183, 255))
    white = (255, 255, 255, 255)
    lightning = [(148, 30), (100, 128), (130, 128), (108, 226), (168, 110), (136, 110), (148, 30)]
    draw.polygon(lightning, fill=white)

# ── 生成单色 PNG ──────────────────────────────
def make_png(fn, draw_fn):
    img = Image.new("RGBA", (SIZE, SIZE), (0,0,0,0))
    draw_fn(ImageDraw.Draw(img))
    img.save(fn)

# ── 生成多尺寸 PNG 集（用于 ico）──────────────
def make_multisz_png(sizes, draw_fn):
    imgs = {}
    for sz in sizes:
        img = Image.new("RGBA", (sz, sz), (0,0,0,0))
        draw_fn(ImageDraw.Draw(img))
        imgs[sz] = img
    return imgs

# ── 生成 .ico（Windows 图标）──────────────────
def create_ico(sizes_pngs):
    """生成 ICO 文件（支持多尺寸）"""
    images = []
    for sz, img in sizes_pngs.items():
        buf = io.BytesIO()
        # ICO 需要 32bpp 格式
        img = img.convert("RGBA")
        # 写入 PNG 数据到 ICO
        png_buf = io.BytesIO()
        img.save(png_buf, format="PNG")
        png_data = png_buf.getvalue()
        images.append((sz, png_data))

    # ICO 文件头
    icon_dir = struct.pack('<HHH', 0, 1, len(images))
    entries = b''
    offset = 6 + 16 * len(images)
    ico_data = b''

    for sz, png_data in images:
        w = 0 if sz >= 256 else sz
        h = 0 if sz >= 256 else sz
        entry = struct.pack('<BBBBHHII', w, h, 0, 0, 1, 32, len(png_data), offset)
        entries += entry
        offset += len(png_data)
        ico_data += png_data

    return icon_dir + entries + ico_data

# ── 主程序 ─────────────────────────────────────
SIZES = [256, 128, 64, 48, 32, 16]

schemes = [
    ('A_blue', draw_icon_a),
    ('B_darkZ', draw_icon_b),
    ('C_orange', draw_icon_c),
    ('D_purple', draw_icon_d),
]

for name, draw_fn in schemes:
    # 保存大 PNG
    img = Image.new("RGBA", (SIZE, SIZE), (0,0,0,0))
    draw_fn(ImageDraw.Draw(img))
    img.save(os.path.join(RESOURCES, f"icon_{name}.png"))

    # 生成 .ico
    sz_pngs = {}
    for sz in SIZES:
        i = Image.new("RGBA", (sz, sz), (0,0,0,0))
        draw_fn(ImageDraw.Draw(i))
        sz_pngs[sz] = i
    ico = create_ico(sz_pngs)
    with open(os.path.join(RESOURCES, f"icon_{name}.ico"), 'wb') as f:
        f.write(ico)

# 生成预览合并图
gap = 30
label_h = 50
total_w = SIZE * 4 + gap * 5
total_h = SIZE + gap * 2 + label_h
preview = Image.new("RGBA", (total_w, total_h), (245, 245, 245, 255))
draw_p = ImageDraw.Draw(preview)

labels = ["A: 蓝色微软风", "B: 深色Z字专属", "C: 橙红活力清单", "D: 紫色闪电专属"]
for i, (name, draw_fn) in enumerate(schemes):
    img = Image.new("RGBA", (SIZE, SIZE), (0,0,0,0))
    draw_fn(ImageDraw.Draw(img))
    x = gap + i * (SIZE + gap)
    preview.paste(img, (x, gap), img)
    draw_p.text((x + SIZE//2, gap + SIZE + 12), labels[i], fill=(50,50,50,255), anchor="mt")

preview.save(os.path.join(RESOURCES, "icon_preview_all.png"))

# 生成托盘尺寸预览 16px
tray = Image.new("RGBA", (16*4+5*3, 16), (245,245,245,255))
for i, (name, draw_fn) in enumerate(schemes):
    img = Image.new("RGBA", (16, 16), (0,0,0,0))
    draw_fn(ImageDraw.Draw(img))
    tray.paste(img, (i*(16+5), 0), img)
tray_big = tray.resize((tray.width*6, tray.height*6), Image.NEAREST)
tray_big.save(os.path.join(RESOURCES, "icon_preview_tray_16px.png"))

print("[OK] All icons generated:")
print(f"  PNG: {RESOURCES}\\icon_*.png")
print(f"  ICO: {RESOURCES}\\icon_*.ico")
print(f"  Preview: {RESOURCES}\\icon_preview_all.png")
