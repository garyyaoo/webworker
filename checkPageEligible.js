doPage();

function doPage() {
    if ((document.documentElement.innerHTML.toString().toLowerCase().includes('problem-content') 
        || document.documentElement.innerHTML.toString().toLowerCase().includes('problem_body'))
        && (document.documentElement.innerHTML.toString().toLowerCase().includes('checkbox') || 
        document.documentElement.innerHTML.toString().toLowerCase().includes('radio'))) {
            chrome.runtime.sendMessage({
                action: "eligible"
            })
        } else {
            chrome.runtime.sendMessage({
                action: "ineligible"
            })
        }
}