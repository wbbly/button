if(localStorage.getItem('token')){
    chrome.runtime.sendMessage({type: 'wobbly-access', token: localStorage.getItem('token')})
}
