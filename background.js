chrome.runtime.onInstalled.addListener(function() {
    // Replace all rules ...
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      // With a new rule ...
      chrome.declarativeContent.onPageChanged.addRules([
        rule
      ]);
    });
  });

  var rule = {
    conditions: [
      new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { urlContains: 'webwork' }
      })
    ],
    actions: [ new chrome.declarativeContent.ShowPageAction() ]
  };