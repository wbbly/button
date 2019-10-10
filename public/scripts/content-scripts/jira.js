wobblyButton.renderButton('.issue-header-content:not(.wobbly)', function(elem){
    let rootElement = searchElem(elem)
    if(!rootElement) return

    wobblyButton.project = searchElem('#project-name-val', rootElement).textContent
    wobblyButton.task = searchElem('#key-val').textContent
    wobblyButton.detail = searchElem('#summary-val', rootElement).textContent
    wobblyButton.issue = encodeURI(`${wobblyButton.task} ${wobblyButton.detail}`)

    rootElement.classList.add('wobbly')
    let container = createTag('li', 'wobbly-button')
    let linkContainer = searchElem('.aui-nav', rootElement)
    let link = createTag('a', 'wobbly', 'Start timer')
    link.style = `
        cursor: pointer;
        padding-left: 20px;
        background: url(${chrome.extension.getURL("images/favicon.svg")}) no-repeat;
        background-size: contain;
    `
    link.onclick = () => wobblyButton.currentTimer ?  wobblyButton.timerStop() : wobblyButton.timerStart()    
    link.title = `${wobblyButton.task} / ${wobblyButton.detail} - ${wobblyButton.project}`

    linkContainer.appendChild(container)
    container.appendChild(link)
    wobblyButton.link = link
})

wobblyButton.renderButton('.ghx-detail-head:not(.wobbly)', function(elem){
    let rootElement = searchElem(elem)
    if(!rootElement) return

    wobblyButton.project = searchElem('.ghx-project', rootElement).textContent
    wobblyButton.task = searchElem('#issuekey-val', rootElement).textContent
    wobblyButton.detail = searchElem('#summary-val', rootElement).textContent
    wobblyButton.issue = encodeURI(`${wobblyButton.task} ${wobblyButton.detail}`)

    rootElement.classList.add('wobbly')
    let container = createTag('div', 'wobbly-button')
    rootElement.appendChild(container)
    let link = createTag('a', 'wobbly', 'Start timer')
    // link.style.cursor = 'pointer'
    link.style = `
        cursor: pointer;
        padding-left: 20px;
        margin-left: 5px;
        background: url(${chrome.extension.getURL("images/favicon.svg")}) no-repeat;
        background-size: contain;
    `
    link.onclick = () => wobblyButton.currentTimer ?  wobblyButton.timerStop() : wobblyButton.timerStart()
    link.title = `${wobblyButton.task} / ${wobblyButton.detail} - ${wobblyButton.project}`

    container.appendChild(link)
    wobblyButton.link = link
})

wobblyButton.renderButton('#ghx-detail-view [spacing] h1:not(.wobbly)', function(elem){
    if(!searchElem(elem)) return

    let rootElement = searchElem('#ghx-detail-view')
    let task = searchElem('[spacing] a', rootElement)
    wobblyButton.task = task.textContent
    let detail = searchElem('[spacing] h1', rootElement)
    wobblyButton.issue = encodeURI(`${task.textContent} ${detail.textContent}`)

    searchElem(elem).classList.add('wobbly')
    let container = createTag('div', 'wobbly-button')
    let link = createTag('a', 'wobbly')
    link.style = `
        cursor: pointer;
        padding-left: 20px;
        margin-left: 5px;
        background: url(${chrome.extension.getURL("images/favicon.svg")}) no-repeat;
        background-size: contain;
    `
    link.onclick = () => wobblyButton.currentTimer ?  wobblyButton.timerStop() : wobblyButton.timerStart()
    link.title = `${task.textContent} / ${detail.textContent}`

    container.appendChild(link);
    task.parentNode.appendChild(container);
    wobblyButton.link = link
})

wobblyButton.renderButton('div[class*="Droplist-"] + div a[href^="/browse/"]:not(#wobbly)', function(elem){
    if(!searchElem(elem) || searchElem('#ghx-detail-view [spacing] h1')) return

    const container = searchElem(elem).parentElement.parentElement.parentElement;

    let detail = searchElem('h1 ~ button[aria-label]').previousSibling.textContent
    let task = searchElem(elem).textContent
    wobblyButton.task = task
    wobblyButton.issue = encodeURI(`${task} ${detail}`)

    searchElem(elem).id = 'wobbly'
    let parentContainer = createTag('div', 'wobbly-button')
    parentContainer.style = `
        display: flex;
        align-items: center;
    `
    let link = createTag('a', 'wobbly', 'Start timer')
    link.style = `
        cursor: pointer;
        padding-left: 20px;
        margin-left: 2px;
        background: url(${chrome.extension.getURL("images/favicon.svg")}) no-repeat;
        background-size: contain;
    `
    link.onclick = () => wobblyButton.currentTimer ?  wobblyButton.timerStop() : wobblyButton.timerStart()
    link.title = `${task} / ${detail}`

    container.appendChild(parentContainer);
    parentContainer.appendChild(link)
    wobblyButton.link = link
})