import_path = r"C:\Users\yao\Documents\Ai美妆\admin\beauty-admin\src\services\reportService.ts"
with open(import_path, "r", encoding="utf-8") as f:
    c = f.read()

marker = '.catch(() => { /* no-op fallback */ });\n};\n\nasync function fallbackMockReports'
insert = '''export const fetchReportDetail = async (reportId: string): Promise<BeautyReport> => {
  return callOrFallback(
    () => apiClient.get<ApiResponse<BeautyReport>>(`${API_PATH}/${encodeURIComponent(reportId)}`),
    undefined!
  ).then((res) => {
    if (res?.data) return res.data as BeautyReport;
    throw new Error("no data");
  }).catch(() => {
    const found = MOCK_REPORTS.find((r) => r.id === reportId);
    return found || MOCK_REPORTS[0];
  });
};

export const unlockReport = async (reportId: string, status: "locked" | "unlocked"): Promise<void> => {
  await callOrFallback(
    () => apiClient.patch<void>(`${API_PATH}/${encodeURIComponent(reportId)}/unlock`, { unlockStatus: status }),
    undefined
  ).catch(() => { /* no-op fallback */ });
};'''

target = '.catch(() => { /* no-op fallback */ });\n};\n\nasync function fallbackMockReports'
if target in c:
    c = c.replace(target, insert + "\n\nasync function fallbackMockReports", 1)
    print("reportService patched")
else:
    print("target not found, checking...")
    idx = c.find("fallbackMockReports")
    print(repr(c[idx-50:idx+50]))

with open(import_path, "w", encoding="utf-8") as f:
    f.write(c)
print("done, len:", len(c))
