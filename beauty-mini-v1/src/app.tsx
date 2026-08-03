import { useEffect } from "react";
import { navigate } from "@taro/router";
import userService from "./services/user-service";
import { isWeChatMiniProgram } from "./utils/storage";

const App = () => {
  useEffect(() => {
    async function initUser() {
      try {
        const user = await userService.initializeGuestUser();
        // [debug removed]
      } catch (err) {
        console.error("[App] Failed to initialize user:", err);
      }
    }
    initUser();
  }, []);

  const componentDidShow = () => {
    // [debug removed]
  };

  const pageList = [
    "/pages/home/index",
    "/pages/upload/index",
    "/pages/analyzing/index",
    "/pages/result/index",
    "/pages/profile/index",
    "/pages/token/index"
  ];

  return (
    <div className="app">
      {isWeChatMiniProgram() ? (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h1>AI 美妆 V8</h1>
          <p>正在初始化用户身份...</p>
        </div>
      ) : (
        <div style={{ padding: "20px" }}>
          <h1>AI 美妆 V8 (H5模式)</h1>
          <button onClick={() => navigate("/pages/home")}>进入首页</button>
        </div>
      )}
    </div>
  );
};

export default App;
