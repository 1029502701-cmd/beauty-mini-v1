import Taro from "@tarojs/taro";

export const navigate = (options: any) => {
  if (typeof options === "string") {
    return Taro.navigateTo({
      url: options,
    });
  }

  return Taro.navigateTo(options);
};

export const navigateBack = () => {
  return Taro.navigateBack();
};

export { useLoad } from "@tarojs/taro";
