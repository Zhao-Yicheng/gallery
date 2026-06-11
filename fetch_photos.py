"""
Fetch all photos from API and save to all_photos.json
"""
import requests
import json
import time

BASE = "https://preview-api.pixcheese.com"
SHARE_KEY = "b8hAMVEgstj"
PROJECT_ID = 370481409
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": f"https://v.pixcheese.com/s/{SHARE_KEY}",
    "Origin": "https://v.pixcheese.com",
    "Content-Type": "application/json",
}

def post(path, data=None, extra_headers=None):
    h = {**HEADERS}
    if extra_headers:
        h.update(extra_headers)
    url = BASE + path
    try:
        r = requests.post(url, json=data, headers=h, timeout=20)
        if r.status_code == 200:
            return r.json()
        else:
            print(f"    status: {r.status_code}, body: {r.text[:300]}")
            return None
    except Exception as e:
        print(f"    error: {e}")
        return None

all_photos = []
share_headers = {"Share-Key": SHARE_KEY, "N-WMK": "0"}

page = 1
page_size = 100

while True:
    resp = post("/v1/share/new_list", {
        "project_id": PROJECT_ID,
        "share_password": "",
        "class_id": 2047269,
        "page": page,
        "page_size": page_size,
    }, share_headers)
    
    if resp and resp.get("code") == 0:
        data = resp.get("data", {})
        img_list = data.get("list", [])
        total = data.get("total", 0)
        
        for img in img_list:
            all_photos.append({
                "file_name": img.get("file_name", ""),
                "file_id": img.get("file_id", ""),
                "file_uri": img.get("file_uri", ""),          # 原图
                "thumb_uri": img.get("thumb_uri", ""),       # 缩略图
                "preview_uri": img.get("preview_uri", ""),    # 预览图
                "width": img.get("img_width", 0),
                "height": img.get("img_height", 0),
                "file_size": img.get("file_size", 0),
            })
        
        print(f"Page {page}: {len(img_list)} images, total so far: {len(all_photos)}/{total}")
        
        if len(img_list) < page_size:
            break
        page += 1
        time.sleep(0.5)
    else:
        print(f"Page {page}: failed")
        break

print(f"\nTotal: {len(all_photos)} photos")

# Save
with open("f:/py/pic/all_photos.json", "w", encoding="utf-8") as f:
    json.dump(all_photos, f, ensure_ascii=False, indent=2)
print("Saved to all_photos.json")

# Stats
thumb = sum(1 for p in all_photos if p["thumb_uri"])
preview = sum(1 for p in all_photos if p["preview_uri"])
ori = sum(1 for p in all_photos if p["file_uri"])
print(f"URLs: thumb={thumb}, preview={preview}, original={ori}")
