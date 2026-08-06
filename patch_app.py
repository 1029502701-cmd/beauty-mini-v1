path = r"C:\Users\yao\Documents\Ai美妆\admin\beauty-admin\src\App.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

# Add OperationLogsPage import
c = c.replace(
    'import SettingsPage from "@pages/settings/SettingsPage";',
    'import SettingsPage from "@pages/settings/SettingsPage";\nimport OperationLogsPage from "@pages/logs/OperationLogsPage";'
)

# Add route
c = c.replace(
    '<Route path="settings" element={<AdminAuthGuard><SettingsPage /></AdminAuthGuard>} />',
    '<Route path="settings" element={<AdminAuthGuard><SettingsPage /></AdminAuthGuard>} />\n        <Route path="logs" element={<AdminAuthGuard><OperationLogsPage /></AdminAuthGuard>} />'
)

with open(path, "w", encoding="utf-8") as f:
    f.write(c)
print("App.tsx updated, len:", len(c))
