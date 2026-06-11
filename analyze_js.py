import re

data = open('f:/py/pic/temp_main.js', 'r', encoding='utf-8').read()

# Find all v1/share API endpoints
print("=== All v1/share endpoints ===")
for m in re.finditer(r'["\'](/v1/share/[^"\']+)["\']', data):
    print(m.group(1))

# Find the exact POST call for getting images
print("\n=== Image/category getList context ===")
for m in re.finditer(r'.{0,50}/v1/share.{0,300}', data):
    ctx = m.group()
    if 'get' in ctx.lower() or 'post' in ctx.lower() or 'image' in ctx.lower() or 'category' in ctx.lower() or 'photo' in ctx.lower() or 'list' in ctx.lower():
        print(ctx[:400])
        print("===")

# Find the specific URL structure for images
print("\n=== imageList context ===")
for m in re.finditer(r'imageList.{0,200}', data):
    ctx = m.group()
    if 'uri' in ctx.lower() or 'url' in ctx.lower() or 'thumb' in ctx.lower() or 'ori' in ctx.lower() or 'file' in ctx.lower():
        print(ctx[:300])
        print("---")

# Find thumbUri references
print("\n=== thumbUri / thumb_uri context ===")
for m in re.finditer(r'(?:thumbUri|thumb_uri|thumbnailUrl|thumbnail_url).{0,200}', data):
    print(m.group()[:300])
    print("---")

# Search for the ProjectStore definition
print("\n=== ProjectStore image fetching ===")
for m in re.finditer(r'(?:fetchImage|getImage|loadImage|fetchPhoto|getPhoto|loadPhoto).{0,300}', data):
    print(m.group()[:400])
    print("---")
