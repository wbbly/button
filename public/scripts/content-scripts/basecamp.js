function insertAfter(el, referenceNode) {
    referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
}

wobblyButton.renderButton('.todo__header:not(.wobbly)', function(elem){
    let rootElement = searchElem(elem)
    if(!rootElement) return
    if(searchElem('.todos li').classList.contains('completed')) {
        return
    }

    wobblyButton.project = searchElem('strong.u-position-context a').textContent
    wobblyButton.task = searchElem('.recording-breadcrumb__children span:last-child').textContent
    wobblyButton.detail = searchElem('h1.flush a',rootElement).textContent
    wobblyButton.issue = encodeURI(`${wobblyButton.task} ${wobblyButton.detail}`)

    rootElement.classList.add('wobbly')
    let container = searchElem('span.action-sheet')
    let containerChild = searchElem('.action-sheet__expansion-toggle', container)
    container.classList.add('wobbly-basecamp-btn-container')
    let link = createTag('a', 'wobbly', 'Start timer')
    link.style.cursor = 'pointer'
    link.style = `
        cursor: pointer;
        font-size: 14px;
        padding: 0 10px 0 24px;
        background: url(${chrome.extension.getURL("images/favicon.svg")}) no-repeat;
        background-size: contain;
    `
    link.onclick = () => wobblyButton.currentTimer ?  wobblyButton.timerStop() : wobblyButton.timerStart()
    link.title = `${wobblyButton.task} / ${wobblyButton.detail} - ${wobblyButton.project}`


    container.insertBefore(link,containerChild)
    wobblyButton.link = link
})
