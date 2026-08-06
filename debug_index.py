path = "C:\\Users\\yao\\Documents\\Ai美妆\\admin\\beauty-admin\\src\\types\\index.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
print(repr(content[-200:]))
