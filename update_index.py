import_path = "C:\\Users\\yao\\Documents\\Ai美妆\\admin\\beauty-admin\\src\\types\\index.ts"
with open(import_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    '  MenuResource,\n} from "./admin";\nexport { ROLE_PERMISSIONS, ADMIN_MENU_CONFIG } from "./admin";',
    '  MenuResource,\n  OperationLogActionType,\n  AdminOperationLog,\n  OperationLogFilter,\n} from "./admin";\nexport { ROLE_PERMISSIONS, ADMIN_MENU_CONFIG } from "./admin";'
)

with open(import_path, "w", encoding="utf-8") as f:
    f.write(content)
print("index.ts updated:", len(content))
