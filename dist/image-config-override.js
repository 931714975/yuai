// 禹AI画布 - 图像生成配置覆盖
// 自动配置可用的 CloseAI 图像生成 API

(function() {
  'use strict';

  console.log('🔧 图像生成配置覆盖已加载');

  // 配置常量
  const imageConfig = {
    imageApiUrl: 'https://api.openai-proxy.org/v1',
    imageApiKey: 'sk-gzI41icygJVb9aHi2MRDxMub8R9swmCc8DX4ik3H3LiuVNOC',
    drawingApiUrl: 'https://api.openai-proxy.org/v1',
    drawingApiKey: 'sk-gzI41icygJVb9aHi2MRDxMub8R9swmCc8DX4ik3H3LiuVNOC',
    drawingModel: 'gpt-image-1.5'
  };

  // 立即设置 localStorage
  try {
    Object.entries(imageConfig).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    console.log('✅ localStorage 配置已设置');
  } catch (e) {
    console.error('❌ localStorage 设置失败:', e);
  }

  // 拦截 chrome.storage.local.get
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const originalGet = chrome.storage.local.get;

    chrome.storage.local.get = function(keys, callback) {
      return originalGet.call(this, keys, function(result) {
        const injectedResult = {
          ...result,
          ...imageConfig
        };
        console.log('🔧 chrome.storage.local.get 拦截 - imageApiKey 已注入');
        if (callback) {
          callback(injectedResult);
        }
      });
    };

    chrome.storage.local.set(imageConfig, () => {
      console.log('✅ chrome.storage 配置已持久化');
    });

    console.log('✅ chrome.storage 拦截器已激活');
  }

  console.log('💡 配置已就绪，imageApiKey:', imageConfig.imageApiKey.substring(0, 20) + '...');

})();
