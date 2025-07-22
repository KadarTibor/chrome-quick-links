chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
  });

  const keywordMap: Record<string, string> = {
    "linkedin": "https://www.linkedin.com",
    "gh": "https://github.com",
    "yt": "https://youtube.com"
  };
  
  chrome.omnibox.onInputEntered.addListener((text) => {
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