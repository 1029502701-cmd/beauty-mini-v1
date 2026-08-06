import React from "react";
import "./index.css";
import { Button, Text, View } from '@tarojs/components';
import { navigate } from "@taro/router";

const Index = () => {
  const handleBackClick = () => {
    navigate({ url: "/pages/home" });
  };

  return (
    <View className="index agreement-page">
      <Button className="back-link" onClick={handleBackClick}>
        ← 返回首页
      </Button>
      <View className="content-section">
        <Text>用户协议</Text>
      </View>

      <View className="content-section">
        <Text>一、服务说明</Text>
        <Text>"AI美妆"小程序（以下简称"本服务"）提供基于人工智能技术的个人面部分析与美妆建议服务。通过上传照片，用户可以获取个性化的皮肤分析和妆容推荐。</Text>
      </View>

      <View className="content-section">
        <Text>二、AI生成内容说明</Text>
        <Text>本服务生成的分析报告、妆容建议等内容均由人工智能算法自动生成，仅供参考使用。由于技术和数据的局限性，AI生成的结果可能存在偏差，不构成医疗诊断或专业美容建议。</Text>
      </View>

      <View className="content-section">
        <Text>三、用户责任</Text>
        <View>
          <Text>用户应确保上传的照片为其本人照片或已获得合法授权</Text>
          <Text>用户不应上传任何侵犯他人肖像权、隐私权的照片</Text>
          <Text>用户应对使用本服务产生的后果自行承担责任</Text>
          <Text>用户应遵守相关法律法规及社会公序良俗</Text>
        </View>
      </View>

      <View className="content-section">
        <Text>四、免责声明</Text>
        <View>
          <Text>本服务仅供娱乐和参考，不作为医疗诊断依据</Text>
          <Text>我们不对因使用本服务导致的任何直接、间接损失承担责任</Text>
          <Text>服务可能随时进行调整或终止，恕不另行通知</Text>
          <Text>第三方推荐产品的选择和使用请用户自行判断并承担风险</Text>
        </View>
      </View>

      <View className="content-section">
        <Text>五、协议变更</Text>
        <Text>本公司有权根据法律法规变化或服务发展情况对本协议进行修订。修订后的协议将在小程序内公布，请及时查阅。</Text>
      </View>

      <View className="content-section">
        <Text>本协议最后更新日期：2026年7月30日</Text>
        <Text>通过使用本服务，即表示您同意本协议的所有条款。</Text>
      </View>
    </View>
  );
};

export default Index;
