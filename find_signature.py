import re

data = open('f:/py/pic/temp_main.js', 'r', encoding='utf-8').read()

# Find all occurrences of signatureUrl in the app code (not OSS SDK)
print("=== All signatureUrl occurrences ===")
for m in re.finditer(r'.{0,100}signatureUrl.{0,200}', data):
    ctx = m.group()
    if 'Bucket' not in ctx and 'OSS' not in ctx and 'object/' not in ctx:
        print(f"---")
        print(ctx)
        
# Search for getImageUrl / getThumbnailUrl / getPreviewUrl / getOriginalUrl
print("\n=== getThumbnailUrl context ===")
m = re.search(r'getThumbnailUrl.{0,300}', data)
if m:
    print(m.group())

print("\n=== getPreviewUrl context ===")
m = re.search(r'getPreviewUrl.{0,300}', data)
if m:
    print(m.group())

print("\n=== getOriginalUrl context ===")
m = re.search(r'getOriginalUrl.{0,300}', data)
if m:
    print(m.group())

# Search for image URL construction pattern
print("\n=== res-pri pattern in app code ===")
for m in re.finditer(r'res-pri.{0,200}', data):
    print(m.group()[:250])
    print("---")

# Look for the apiBase or imageBase patterns
print("\n=== image base URL patterns ===")
for m in re.finditer(r'(?:imageHost|imageBase|ossHost|ossBase|cdnHost|cdnBase|resHost|resBase).{0,100}', data):
    print(m.group()[:200])
    print("---")
