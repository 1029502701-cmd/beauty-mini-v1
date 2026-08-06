import_path = r"C:\Users\yao\Documents\Ai美妆\admin\beauty-admin\src\services\creatorService.ts"
with open(import_path, "r", encoding="utf-8") as f:
    c = f.read()

target = '.catch(() => { /* no-op fallback */ });\n};\n\nasync function fallbackMockCreators'
insert = '''export const updateCreatorTags = async (id: string, matchTags: string[]): Promise<void> => {
  await callOrFallback(
    () => apiClient.patch<void>(`${API_PATH}/${encodeURIComponent(id)}/tags`, { matchTags }),
    undefined
  ).catch(() => { /* no-op fallback */ });
};'''

if target in c:
    c = c.replace(target, insert + "\n\nasync function fallbackMockCreators", 1)
    print("creatorService patched")
else:
    print("target not found")
    idx = c.find("fallbackMockCreators")
    print(repr(c[idx-50:idx+50]))

with open(import_path, "w", encoding="utf-8") as f:
    f.write(c)
print("done, len:", len(c))
