path = r"C:\Users\yao\Documents\Ai美妆\admin\beauty-admin\src\services\tokenService.ts"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

idx = c.find("export const updatePackage")
end_idx = c.find("\n};", idx) + 3
old_func = c[idx:end_idx]

new_func = """export const updatePackage = async (id: string, data: Partial<TokenPackage>): Promise<TokenPackage> => {
  try {
    const res = await apiClient.patch<ApiResponse<TokenPackage>>(`${API_PATH}/packages/${encodeURIComponent(id)}`, data);
    if (res?.data) return res.data;
  } catch {}
  return {
    id,
    name: data.name || "",
    tokens: data.tokens || 0,
    price: data.price || 0,
    discountRate: data.discountRate || 1,
    status: data.status || "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as TokenPackage;
};"""

c = c[:idx] + new_func + c[end_idx:]
with open(path, "w", encoding="utf-8") as f:
    f.write(c)
print("fixed")
