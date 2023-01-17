function insertAfter(el, referenceNode) {
    referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
}

wobblyButton.renderButton('.issue-details .detail-page-description', function(elem){
    const rootElement = searchElem(elem);
    if (!rootElement) return;

    const getNumTaskText = () => {
        const numTask = searchElem('.breadcrumbs-links li:last-child a');
        return numTask ? numTask.textContent.split(' ').pop() : '';
    }

    const getDetailTask = () => {
        const detailTask = searchElem('.title', rootElement);
        return detailTask ? detailTask.textContent : '';
    }

    wobblyButton.detail = getDetailTask();
    wobblyButton.task = getNumTaskText();
    wobblyButton.issue = `${wobblyButton.task} ${wobblyButton.detail}`;

    let container = searchElem('.detail-page-header-body');
    let link = createTag('a', 'wobbly', 'Start timer')
    link.style.cursor = 'pointer'
    link.style = `
    cursor: pointer;
    padding-left: 20px;
    background: url(${chrome.extension.getURL("images/favicon.svg")}) no-repeat;
    background-position: -13px 50%;
    background-size: 50% 50%;
    `
    insertAfter(link,container);
    container.appendChild(link);

    link.onclick = () => {
        wobblyButton.currentTimer ? wobblyButton.timerStop() : wobblyButton.timerStart(`${getNumTaskText()} ${getDetailTask()}`);
    }

    link.title = `${getNumTaskText()} ${getDetailTask()}`;

    wobblyButton.link = link;
    if(link) {
        const firstLink = container.getElementsByClassName('wobbly');
        console.log(firstLink[0], '123');
        firstLink[0].style = `display: none;`;
    }
})

wobblyButton.renderButton('.merge-request-details .detail-page-description', function(elem){
    let rootElement = searchElem(elem)
    if(!rootElement) return

    const getNumTaskText = () => {
        const numTask = searchElem('.breadcrumbs-links li:last-child a');
        return numTask ? numTask.textContent.split(' ').pop() : '';
    }

    const getDetailTask = () => {
        const detailTask = searchElem('h1.title');
        return detailTask ? detailTask.textContent : '';
    }

    wobblyButton.detail = getDetailTask();
    wobblyButton.task = getNumTaskText();
    wobblyButton.issue = `${wobblyButton.task} ${wobblyButton.detail}`;

    let container = searchElem('.detail-page-header-body');
    let link = createTag('a', 'wobbly', 'Start timer')
    link.style.cursor = 'pointer'
    link.style = `
    cursor: pointer;
    padding-left: 20px;
    background: url(${chrome.extension.getURL("images/favicon.svg")}) no-repeat;
    background-position: -13px 50%;
    background-size: 50% 50%;
    `
    container.appendChild(link);

    link.onclick = () => {
        wobblyButton.currentTimer ? wobblyButton.timerStop() : wobblyButton.timerStart(`${getNumTaskText()} ${getDetailTask()}`);
    }

    link.title = `${getNumTaskText()} ${getDetailTask()}`;

    wobblyButton.link = link;
})
