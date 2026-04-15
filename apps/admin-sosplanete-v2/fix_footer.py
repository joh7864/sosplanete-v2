import os

filepath = r'c:\Users\User\Documents\Sync Pcloud\Professionnel\Dev\sosplanete-v2\apps\frontend-v2\src\app\dashboard\organization\page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Condense footer widths
content = content.replace('w-14 text-right', 'w-12 text-right')
content = content.replace('w-16 text-right', 'w-14 text-right')
content = content.replace('gap-5 shrink-0', 'gap-3 shrink-0')

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
