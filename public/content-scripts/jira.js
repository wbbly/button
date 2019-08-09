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
        background: url(${chrome.extension.getURL("images/favicon.png")}) no-repeat;
        background-size: contain;
    `
    link.onclick = () => wobblyButton.currentTimer ?  wobblyButton.timerStop() : wobblyButton.timerStart()
    link.title = `${wobblyButton.task} / ${wobblyButton.detail} - ${wobblyButton.project}`

    container.appendChild(link)
    wobblyButton.link = link
})
