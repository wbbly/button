function insertAfter(el, referenceNode) {
    referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
}

wobblyButton.renderButton('.issue-details .detail-page-description:not(.wobbly)', function(elem){
    let rootElement = searchElem(elem)
    if(!rootElement) return

    wobblyButton.project = searchElem('.breadcrumbs-list li:nth-last-child(3) .breadcrumb-item-text').textContent
    wobblyButton.task = searchElem('.breadcrumbs-list li:last-child .breadcrumbs-sub-title').textContent
    wobblyButton.detail = searchElem('.title', rootElement).textContent
    wobblyButton.issue = `${wobblyButton.task} ${wobblyButton.detail}`

    rootElement.classList.add('wobbly')
    let container = searchElem('.detail-page-header-body')
    let link = createTag('a', 'wobbly', 'Start timer')
    link.style.cursor = 'pointer'
    link.style = `
        cursor: pointer;
        padding-left: 20px;
        background: url(${chrome.extension.getURL("images/favicon.svg")}) no-repeat;
        background-position: -13px 50%;
        background-size: 50% 50%;
    `
    link.onclick = () => wobblyButton.currentTimer ?  wobblyButton.timerStop() : wobblyButton.timerStart()
    link.title = `${wobblyButton.task} / ${wobblyButton.detail} - ${wobblyButton.project}`


    insertAfter(link,container)
    wobblyButton.link = link
})

wobblyButton.renderButton('.merge-request-details .detail-page-description:not(.wobbly)', function(elem){
    let rootElement = searchElem(elem)
    if(!rootElement) return

    wobblyButton.project = searchElem('.breadcrumbs-list li:nth-last-child(3) .breadcrumb-item-text').textContent
    wobblyButton.task = searchElem('.breadcrumbs-list li:last-child .breadcrumbs-sub-title').textContent
    wobblyButton.detail = searchElem('.title', rootElement).textContent
    wobblyButton.issue = `${wobblyButton.task} ${wobblyButton.detail}`

    rootElement.classList.add('wobbly')
    let container = searchElem('.detail-page-header-body')
    let link = createTag('a', 'wobbly', 'Start timer')
    link.style.cursor = 'pointer'
    link.style = `
        cursor: pointer;
        padding-left: 20px;
        background: url(${chrome.extension.getURL("images/favicon.svg")}) no-repeat;
        background-position: -13px 50%;
        background-size: 50% 50%;
    `
    link.onclick = () => wobblyButton.currentTimer ?  wobblyButton.timerStop() : wobblyButton.timerStart()
    link.title = `${wobblyButton.task} / ${wobblyButton.detail} - ${wobblyButton.project}`


    insertAfter(link,container)
    wobblyButton.link = link
})