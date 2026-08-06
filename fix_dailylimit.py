path = r"C:\Users\yao\Documents\AiÃÀ×±\beauty-api-pages\modules\beauty-ai\permission\report-access-service.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace("'first-look': 3", "'first-look': 2")
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("Done - first-look limit changed to 2")
