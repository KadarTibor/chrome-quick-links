  chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
  });

  // Registered at the top level so it survives service worker restarts.
  // Reads directly from storage to avoid stale in-memory state after termination.
  chrome.omnibox.onInputEntered.addListener((text) => {
    chrome.storage.sync.get("keywordMap", (result) => {
      const keywordMap: Record<string, string> = result.keywordMap || {};
      const url = keywordMap[text.toLowerCase()];
      if (url) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.update(tabs[0].id, { url });
          }
        });
      }
    });
  });

  chrome.runtime.onMessage.addListener((message, _, __) => {
    if (message.type === "RELOAD_KEYWORD_MAP") {
      console.log("Keyword map updated in storage");
    }
  })

  chrome.commands.onCommand.addListener((command) => {
    if (command === "duplicate-tab") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0]
        if (activeTab?.url) {
          chrome.tabs.create({ url: activeTab.url, index: activeTab.index! + 1 })
        }
      })
    } else if (command === "move-tab-to-new-window") {
      console.log('triggered');
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.windows.create({ tabId: tab.id });
      })
    }
  })

  

  chrome.tabs.onCreated.addListener((tab) => {
    console.log("New tab opened:", tab);
  })
  