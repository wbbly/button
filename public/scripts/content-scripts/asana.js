function insertAfter(el, referenceNode) {
    referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
}

wobblyButton.renderButton('.SingleTaskPane-titleRow:not(.wobbly)', function(elem){
    let rootElement = searchElem(elem)
    if(!rootElement) return

    wobblyButton.project = searchElem('.TopbarPageHeaderStructure-title').textContent
    wobblyButton.task = searchElem('.simpleTextarea', rootElement).textContent
    wobblyButton.detail = ''
    wobblyButton.issue = `${wobblyButton.task} ${wobblyButton.detail}`

    rootElement.classList.add('wobbly')
    let container = searchElem('.SingleTaskPaneToolbar-leftItems')
    let link = createTag('a', 'wobbly', 'Start timer')
    link.style.cursor = 'pointer'
    link.style = `
        cursor: pointer;
        color: #151b26;
        padding-left: 20px;
        background: url(${chrome.extension.getURL("images/favicon.svg")}) no-repeat;
        background-size: contain;
    `
    link.onclick = () => wobblyButton.currentTimer ?  wobblyButton.timerStop() : wobblyButton.timerStart()
    link.title = `${wobblyButton.task} / ${wobblyButton.detail} - ${wobblyButton.project}`


    insertAfter(link,container)
    wobblyButton.link = link
})
