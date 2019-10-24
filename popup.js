doPopup();

function doPopup() {
    chrome.tabs.executeScript(null, {
        file: "checkPageEligible.js"
    }, function () {

    })
}

getAnswers.onclick = () => {
    var message = document.querySelector('#message');

      chrome.tabs.executeScript(null, {
          file: "getAnswers.js"
      }, function () {
          if (chrome.runtime.lastError) {
              console.log('There was an error injecting script : \n' + chrome.runtime.lastError.message);
              message.innerText = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
          }
      });

}

chrome.runtime.onMessage.addListener(function(request, sender) {
    if (request.action == "eligible") {
        enableAnswers();
    } else if (request.action == "success") {
        buttonSuccess();
    } else if (request.action == "failure") {
        buttonFail();
    } else {
        disableAnswers();
    }
  });


function buttonSuccess() {
    let getAnswers = document.getElementById('getAnswers');
    getAnswers.style['background-color'] = '#79F446'; // green
    getAnswers.disabled = false;
    getAnswers.innerText = "Success!";
}

function enableAnswers() {
    let getAnswers = document.getElementById('getAnswers');
    getAnswers.style['background-color'] = '#6c9aeb'; // grey
    getAnswers.disabled = false;
    getAnswers.innerText = "Get answers!";
}

function buttonFail() {
    let getAnswers = document.getElementById('getAnswers');
    getAnswers.style['background-color'] = '#EA1616'; // red
    getAnswers.disabled = true;
    getAnswers.innerText = "Failed. Don't try again.";
}

function disableAnswers() {
    let getAnswers = document.getElementById('getAnswers');
    getAnswers.style['background-color'] = '#A8A8A8'; // grey
    getAnswers.disabled = true;
    getAnswers.innerText = "Doesn't work on this page";
}