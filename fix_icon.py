import re
path = r'C:\Users\HC\.qclaw\workspace\todo-app\src\main\index.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# B方案深色Z字图标（32x32）
B_ICON = "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAw0lEQVR4nM2XQQ7DIAwEwfITeia/6iP7Kzj3D61cqVJrmSoJ9rpzIznMZiECalG01h4lkDFG/RwTUm45CCm3XISW6xA1Qz5dAxnw7EW/Xdxl2/X+fw0QUma1WqMWoSWDTUHfKRc4WvxLLlCmXGB05e4N9AX5coBV+VIAD/npAF7yUwE85YcDeMsFjvzHXRrogXKB0ZXvbqAD5IK5HUechg5tx1vAl86gkkxNP5YPdVdDIu7XFGSEeDtJP0DKvwKgQmjHEzmYXPjuQKtEAAAAAElFTkSuQmCC"

old_pattern = "nativeImage.createFromDataURL('data:image/png;base64,"
old_suffix = "')"
new_val = "nativeImage.createFromDataURL('data:image/png;base64," + B_ICON + old_suffix

new_content = content.replace(old_pattern + "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9h", new_val)
with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print('Done. Changed:', content != new_content)
