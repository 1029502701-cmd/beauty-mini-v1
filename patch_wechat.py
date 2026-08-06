path = "C:\\Users\\yao\\Documents\\Ai美妆\\beauty-api-pages\\functions\\api\\wechat-login.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_import = 'import { SessionService } from "../../lib/session";'
new_import = 'import { TokenService } from "../../modules/token/token-service";\nimport { SessionService } from "../../lib/session";'
content = content.replace(old_import, new_import)

old_block = "      userId = String(insertResult.id);"
new_block = """      userId = String(insertResult.id);

      // New user: grant 1 free token
      try {
        const tokenService = new TokenService(env.D1_DB);
        await tokenService.add(userId, 1, "New user welcome gift");
        console.log("[wechat-login] Granted 1 token to new user:", userId);
      } catch (err) {
        console.error("[wechat-login] Failed to grant welcome token:", err);
      }"""
content = content.replace(old_block, new_block)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
