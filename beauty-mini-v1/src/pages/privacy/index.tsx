import React from "react";
import "./index.css";
import { Button, Text, View } from '@tarojs/components';
import { navigate } from "@taro/router";

const Index = () => {
  const handleBackClick = () => {
    navigate({ url: "/pages/home" });
  };

  return (
    <View className="index privacy-page">
      <Button className="back-link" onClick={handleBackClick}>
        ← 返回首页
      </Button>
      <View className="content-section">
        <Text>隐私政策</Text>
      </View>

      <View className="content-section">
        <Text>一、用户上传照片说明</Text>
        <Text>本小程序为提供AI美妆分析服务，需要用户授权上传个人面部照片。请确保您上传的照片是您本人拥有完整肖像权的照片，或已获得合法授权。</Text>
      </View>

      <View className="content-section">
        <Text>二、AI分析用途说明</Text>
        <Text>您上传的照片仅用于以下目的：</Text>
        <View>
          <Text>分析您的面部特征，包括脸型轮廓、五官特点等</Text>
          <Text>评估您的皮肤状态，如水分、油脂、毛孔细纹等指标</Text>
          <Text>为您生成专属的美妆建议和推荐适合的化妆品</Text>
        </View>
        <Text>我们不会将您的照片用于任何未明示的目的。</Text>
      </View>

      <View className="content-section">
        <Text>三、数据保护说明</Text>
        <View>
          <Text>您上传的照片仅在分析过程中临时存储，分析完成后按约定策略清理</Text>
          <Text>所有数据传输采用加密通道保障安全</Text>
          <Text>我们会采取必要的技术和管理措施防止数据泄露、损毁或丢失</Text>
          <Text>我们不会向第三方共享您的个人生物识别信息</Text>
        </View>
      </View>

      <View className="content-section">
        <Text>四、用户权利说明</Text>
        <View>
          <Text>您有权随时撤回对照片分析的授权</Text>
          <Text>您有权要求我们删除您的照片及相关分析数据</Text>
          <Text>您有权了解我们如何处理您的个人信息</Text>
          <Text>如果您对本隐私政策有任何疑问，可通过以下方式联系我们</Text>
        </View>
      </View>

      <View className="content-section">
        <Text>五、联系方式</Text>
        <Text>如有任何问题或建议，请联系我们的客服团队：</Text>
        <Text>Email: support@beauty-mini-example.com</Text>
        <Text>本隐私政策最后更新日期：2026年7月30日</Text>
      </View>
    </View>
  );
};

export default Index;
