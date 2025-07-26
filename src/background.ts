  chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
  });

  let keywordMap: Record<string, string> = {}

  function reloadKeywordMapFromStorage() {
    chrome.storage.sync.get("keywordMap", (result) => {
      keywordMap = result.keywordMap || {}
      console.log("Background reloaded map:", keywordMap)
    })
    remapOmnibox();
  }
  
  chrome.runtime.onMessage.addListener((message, _, __) => {
    if (message.type === "RELOAD_KEYWORD_MAP") {
      reloadKeywordMapFromStorage()
    }
  })

  function remapOmnibox() {
    chrome.omnibox.onInputEntered.addListener((text) => {
      console.log('this is triggered', text);
      const url = keywordMap[text.toLowerCase()];
      if (url) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.update(tabs[0].id, { url });
          }
        });
      } else {
        chrome.omnibox.setDefaultSuggestion({
          description: `Unknown keyword: "${text}"`
        });
      }
    });
  }

  chrome.commands.onCommand.addListener((command) => {
    if (command === "duplicate-tab") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0]
        if (activeTab?.url) {
          chrome.tabs.create({ url: activeTab.url, index: activeTab.index! + 1 })
        }
      })
    }
  })

  chrome.tabs.onCreated.addListener((tab) => {
    console.log("New tab opened:", tab);
    reloadKeywordMapFromStorage();
  })
  