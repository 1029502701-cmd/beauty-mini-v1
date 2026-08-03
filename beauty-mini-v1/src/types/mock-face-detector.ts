import type { FaceDetectorAdapter } from "./adapters";

/**
 * MockFaceDetector - 模拟人脸检测器，用于单元测试和离线调试
 * 返回模拟的人脸检测数据，不依赖任何外部服务
 */
export class MockFaceDetector implements FaceDetectorAdapter {
  async detectFaces(imageUrl: string): Promise<{
    faceCount: number;
    metrics: {
      width: number;
      height: number;
      leftEyeX: number;
      rightEyeX: number;
      topNoseY: number;
      bottomLipY: number;
      faceWidth: number;
      faceHeight: number;
      faceRatio: number;
      jawWidth: number;
      chinLength: number;
      eyeDistance: number;
      leftEyeWidth: number;
      rightEyeWidth: number;
      noseWidth: number;
      noseHeight: number;
      lipWidth: number;
    };
  }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const w = Math.floor(180 + Math.random() * 40);
    const h = Math.floor(220 + Math.random() * 40);
    return {
      faceCount: 1,
      metrics: {
        width: w,
        height: h,
        leftEyeX: w * 0.3 + Math.random() * 10,
        rightEyeX: w * 0.7 - Math.random() * 10,
        topNoseY: h * 0.4 + Math.random() * 15,
        bottomLipY: h * 0.6 + Math.random() * 10,
        faceWidth: w,
        faceHeight: h,
        faceRatio: w / h,
        jawWidth: w * 0.85,
        chinLength: h * 0.2,
        eyeDistance: w * 0.4,
        leftEyeWidth: w * 0.08,
        rightEyeWidth: w * 0.08,
        noseWidth: w * 0.15,
        noseHeight: h * 0.1,
        lipWidth: w * 0.2,
      }
    };
  }
}
