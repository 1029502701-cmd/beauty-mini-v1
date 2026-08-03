export default {
  pages: [
    'pages/home/index',
    'pages/upload/index',
    'pages/analyzing/index',
    'pages/result/index',
    'pages/profile/index',
    'pages/token/index',
    'pages/privacy/index',
    'pages/agreement/index',
    'pages/reports/index',
    'pages/purchase/index'
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#FFFAF7',
    navigationBarTitleText: 'AI 美妆分析',
    navigationBarTextStyle: 'black'
  },
  requiredPrivateInfos: ['chooseImage', 'chooseMedia'],
  permission: {
    'scope.camera': { desc: '用于拍照上传进行AI分析' },
    'scope.writePhotosAlbum': { desc: '用于保存分析结果到相册' }
  }
}
