import_path = r"C:\Users\yao\Documents\Ai美妆\admin\beauty-admin\src\services\tokenService.ts"
with open(import_path, "r", encoding="utf-8") as f:
    c = f.read()

target = '.catch(() => { /* no-op fallback */ });\n};\n\nasync function fallbackMockOrders'
insert = '''export const updatePackage = async (id: string, data: Partial<TokenPackage>): Promise<TokenPackage> => {
  return callOrFallback(
    () => apiClient.patch<ApiResponse<TokenPackage>>(`${API_PATH}/packages/${encodeURIComponent(id)}`, data),
    undefined!
  ).then((res) => res?.data ?? { id, ...data }).catch(() => ({ id, ...data }));
};'''

if target in c:
    c = c.replace(target, insert + "\n\nasync function fallbackMockOrders", 1)
    print("tokenService patched")
else:
    print("target not found")
    idx = c.find("fallbackMockOrders")
    print(repr(c[idx-50:idx+50]))

with open(import_path, "w", encoding="utf-8") as f:
    f.write(c)
print("done, len:", len(c))
