window.searchElem = (elem, searchIn) => {
    searchIn = searchIn || document
    return searchIn.querySelector(elem)
}

window.createTag = (name, className, textContent) => {
    let tag = document.createElement(name)
    tag.classList.add(className)
    if(textContent){
        tag.textContent = textContent
    }
    return tag
}
window.wobblyButton = {
    activeTimer: null,
    currentTimer: false,
    projectID: null,
    task: null,
    link: null,
    detail: null,
    issue: null,
    formContainer: null,
    projectList: null,
    formElement: `<div class="wobbly-form-header">
        <img />
        <div class="wobbly-form-exit">
            +
        </div>
        </div>
        <div class="wobbly-form-edit">
        <p>Task name</p>
        <input type="text" />
        </div>
        <div class="wobbly-form-select">
        <p>Project</p>
        <select>

        </select>
        </div>
        <button class="wobbly-form-confirm">Start timer</button>`,
    renderButton: function(element, renderer){
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if(mutation.target.className === 'wiki-edit'){
                    renderer(element)
                    wobblyButton.checkCurrentTimer()
                    return
                }
            })
        })
        renderer(element)
        observer.observe(document, {childList: true, subtree: true})
    },
    timerStart: function(){
        if(wobblyButton.activeTimer){
            alert('Already have an active timer')
            return
        }
        if(wobblyButton.formContainer){
            return
        }
        wobblyButton.initFormContainer()
        
    },
    sendTimerData: function(){
        chrome.runtime.sendMessage({type: 'timer-start', data: {
            project: wobblyButton.projectID,
            issue: wobblyButton.issue
        }})
    },
    timerStop: function(){
        chrome.runtime.sendMessage({type: 'timer-stop'})
    },
    checkCurrentTimer: function(){
        if (wobblyButton.link && wobblyButton.activeTimer && wobblyButton.activeTimer.issue.indexOf(wobblyButton.task) > -1){
            wobblyButton.currentTimer = true
            wobblyButton.link.textContent = "Stop timer"
        }
    },
    initFormContainer: function(){
        container = createTag('div', 'wobbly-form-container')
        document.body.appendChild(container)
        let linkPosition = wobblyButton.link.getBoundingClientRect() 
        wobblyButton.formContainer = container
        container.innerHTML = wobblyButton.formElement
        container.style = `
            top: ${linkPosition.top}px;
            left: ${linkPosition.left}px;
        `
        let formInput = searchElem('input', container)
        let formClose = searchElem('.wobbly-form-exit', container)
        let formImg = searchElem('img', container)
        let formSelect = searchElem('select', container)
        let formButton = searchElem('.wobbly-form-confirm', container)
        wobblyButton.projectList.forEach((project) => {
            let option = createTag('option', 'select-opt')
            option.value = project.id
            option.textContent = project.name
            formSelect.appendChild(option)
        })
        formButton.onclick = () => {
            wobblyButton.issue = encodeURI(formInput.value)
            wobblyButton.projectID = formSelect.selectedOptions[0].value
            wobblyButton.sendTimerData()
            wobblyButton.formContainer = null
            document.body.removeChild(container)
        }
        document.body.onclick = (e) => {
            if(wobblyButton.formContainer && e.target.closest('.wobbly-form-container') === null && e.target !== wobblyButton.link){
                document.body.removeChild(container)
                wobblyButton.formContainer = null
            }
        }
        formClose.onclick = () => {
            document.body.removeChild(container)
            wobblyButton.formContainer = null
        }
        formInput.value = decodeURI(wobblyButton.issue)
        formImg.src = chrome.extension.getURL("images/logo.svg");
    }
}
chrome.runtime.onMessage.addListener((request) => {
    if(request.type === 'timer-stop'){
        wobblyButton.activeTimer = null
        wobblyButton.currentTimer = false
        wobblyButton.link.textContent = "Start timer"
    }
    else if(request.type === 'timer-data'){
        wobblyButton.activeTimer = request.data
        wobblyButton.projectList = request.projects
        wobblyButton.checkCurrentTimer()
    }
    
})