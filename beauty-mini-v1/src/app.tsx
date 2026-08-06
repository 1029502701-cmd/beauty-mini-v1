import React from "react";
import { useLaunch } from "@tarojs/taro";
import userService from "./services/user-service";

let initPromise: Promise<void> | null = null;

const initGuestUser = async () => {
  if (!initPromise) {
    initPromise = userService
      .initializeGuestUser()
      .then(() => {
        console.log("[App] guest user initialized");
      })
      .catch((err) => {
        console.error("[App] init user failed:", err);
        initPromise = null;
        throw err;
      });
  }

  return initPromise;
};


const App = ({ children }: { children?: React.ReactNode }) => {

  useLaunch(() => {
    initGuestUser().catch(() => {
      // 防止启动阶段阻断小程序
    });
  });


  return children;
};


export default App;