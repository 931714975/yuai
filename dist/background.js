// background.js
// 监听扩展图标点击事件，打开侧边栏
chrome.action.onClicked.addListener((tab) => {
  // Chrome 114+ supports opening side panel via action click
  if (tab && tab.windowId && chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
  }
});

// 创建右键菜单的函数
const initContextMenu = () => {
  chrome.contextMenus.create({
    id: "save-to-transit",
    title: "发送到资源",
    contexts: ["image", "video", "audio", "selection"]
  }, () => {
    if (chrome.runtime.lastError) { /* ignore already exists error */ }
  });
};

// 安装或更新时重新创建
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    initContextMenu();
  });
});

// 浏览器启动时确保存在
chrome.runtime.onStartup.addListener(() => {
  initContextMenu();
});

// 开发模式下（加载已解压的扩展程序）经常会漏掉 onInstalled，
// 所以在 service worker 顶层也尝试注册一次，确保随时可用。
initContextMenu();

// 监听扩展更新，强制立即生效，避免一直提示“正在更新”
chrome.runtime.onUpdateAvailable.addListener((details) => {
  console.log("Update available: ", details.version);
  chrome.runtime.reload();
});

// 监听右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-to-transit") {
    let resourceUrl = info.srcUrl;
    let type = info.mediaType || 'image'; // 'image', 'video', 'audio'
    
    // Check if it is text selection
    if (info.selectionText) {
      type = 'text';
      resourceUrl = info.selectionText;
    }
    
    // 保存到 storage
    // 因为 transitResources 在 App.tsx 中已经迁移到 localforage (IndexedDB)，
    // 这里如果继续用 chrome.storage.local 存储大 Base64 可能会导致 OOM 或超限闪退 (QUOTA_BYTES_PER_ITEM).
    // 由于 service worker 无法直接使用 localforage，我们限制只在这里存最新的一条或只发送消息。
    // 为了不撑爆 storage，我们控制 storage.local.transitResources 最多只保留最新 5 条。
    chrome.storage.local.get(['transitResources'], (result) => {
      let resources = result.transitResources || [];
      if (!Array.isArray(resources)) resources = [];
      
      const newResource = {
        id: Date.now().toString(),
        url: resourceUrl,
        type: type,
        timestamp: Date.now(),
        pageUrl: info.pageUrl,
        pageTitle: tab ? tab.title : '未知页面'
      };
      
      // Keep only the latest 5 to avoid storage bloat/crash in extension background
      resources = [newResource, ...resources].slice(0, 5);
      
      chrome.storage.local.set({ transitResources: resources }, () => {
        // 通知侧边栏更新 (App.tsx 会接管并存入不限容量的 localforage)
        chrome.runtime.sendMessage({ action: "resourceAdded", resource: newResource }).catch(() => {
          // Ignore error if side panel is not open to receive message
        });
        
        // 尝试打开侧边栏 (如果未打开)
        if (tab && tab.windowId && chrome.sidePanel && chrome.sidePanel.open) {
             chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
        }
      });
    });
  }
});
