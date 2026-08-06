import sys, re, os

files = [
    r"C:\Users\yao\Documents\Ai美妆\beauty-mini-v1\src\services\upload.ts",
    r"C:\Users\yao\Documents\Ai美妆\beauty-mini-v1\src\services\api-client.ts",
    r"C:\Users\yao\Documents\Ai美妆\beauty-mini-v1\src\services\api.ts",
    r"C:\Users\yao\Documents\Ai美妆\beauty-mini-v1\src\pages\upload\index.tsx",
    r"C:\Users\yao\Documents\Ai美妆\beauty-api-pages\functions\api\beauty\upload.ts",
    r"C:\Users\yao\Documents\Ai美妆\beauty-api-pages\wrangler.toml",
]

for f in files:
    with open(f, "r", encoding="utf-8") as fh:
        content = fh.read()
    name = os.path.basename(f)
    print(f"\n=== {name} ===")
    urls = re.findall(r"https?://[^\s\"')\]>]+", content)
    for u in urls:
        print(f"  URL: {u}")
    bases = re.findall(r"beauty-api-pages\.pages\.dev", content)
    if bases:
        print(f"  Base domain: {len(bases)} match(es)")
