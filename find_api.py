import re
import json

data = open('f:/py/pic/temp_share.js', 'r', encoding='utf-8').read()

# Find all string literals containing 'api'
api_strings = re.findall(r'"([^"]*api[^"]*)"', data)
print("=== API strings ===")
for s in sorted(set(api_strings)):
    print(s)

# Find URLs  
url_strings = re.findall(r'"((?:https?://|/)[^"]*)"', data)
print("\n=== URL strings ===")
for u in sorted(set(url_strings)):
    if 'api' in u.lower() or 'photo' in u.lower() or 'file' in u.lower() or 'share' in u.lower() or 'image' in u.lower() or 'category' in u.lower() or 'album' in u.lower() or 'media' in u.lower() or 'project' in u.lower() or 'class' in u.lower() or 'list' in u.lower():
        print(u)

# Find fetch calls
print("\n=== Fetch/Axios patterns ===")
for m in re.finditer(r'(?:fetch|axios\.\w+|\.get\(|\.post\()\s*\([^)]{0,150}\)', data):
    ctx = m.group()
    if 'api' in ctx.lower() or 'share' in ctx.lower() or 'photo' in ctx.lower() or 'file' in ctx.lower():
        print(ctx[:200])
        print("---")

# Find store/state definitions that might reveal API structure  
print("\n=== Store/API config patterns ===")
for m in re.finditer(r'(?:baseURL|base_url|apiUrl|API_BASE|apiHost|serverUrl)\s*[:=]\s*["\'][^"\']+["\']', data):
    print(m.group())

# Search for share page specific code
print("\n=== shareStartPage context ===")
for m in re.finditer(r'shareStartPage.{50,300}', data):
    ctx = m.group()
    if '/' in ctx:
        print(ctx[:300])
        print("---")

# Try extracting route structure
print("\n=== Route patterns ===")
for m in re.finditer(r'(?:path|url|route)\s*:\s*["\'][^"\']+["\']', data):
    print(m.group())
