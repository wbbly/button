window.searchElem = (elem, searchIn) => {
    searchIn = searchIn || document
    return searchIn.querySelector(elem)
}

window.createTag = (name, className, textContent) => {
    let tag = document.createElement(name)
    tag.className = className
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
        <input type="text" class="task-input" placeholder="Enter your task name" />
        </div>
        <div class="wobbly-form-select">
        <p>Project</p>
        <input type="text" class="project-input" placeholder="Select your project"/>
        <ul class="wobbly-projects-list">

        </ul>
        </div>
        <button class="wobbly-form-confirm">Start timer</button>`,
    renderButton: function(element, renderer){
        let debounce = null
        const observer = new MutationObserver((mutations) => {
            if(debounce){
                clearTimeout(debounce)
            }
            debounce = setTimeout(() => {
                renderer(element)
                wobblyButton.checkCurrentTimer()
            }, 500)
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
        if (wobblyButton.link && wobblyButton.activeTimer && wobblyButton.activeTimer.issue.indexOf(encodeURI(wobblyButton.task)) > -1){
            wobblyButton.currentTimer = true
            wobblyButton.link.style.backgroundImage = `url(${chrome.extension.getURL("images/favicon-active.svg")})`
            wobblyButton.link.textContent = wobblyButton.link.textContent ? "Stop timer" : ''
        } else {
            wobblyButton.currentTimer = false
        }
    },
    initFormContainer: function(){
        let container = createTag('div', 'wobbly-form-container')
        document.body.appendChild(container)
        let linkPosition = wobblyButton.link.getBoundingClientRect() 
        wobblyButton.formContainer = container
        container.innerHTML = wobblyButton.formElement
        let xPosition = window.innerWidth - linkPosition.left < 350 ? 'right: 0px;': `left: ${linkPosition.left}px;` 
        container.style = `
            top: ${linkPosition.top}px;
            ${xPosition}
        `
        let formTaskInput = searchElem('.task-input', container)
        let formProjectInput = searchElem('.project-input', container)
        let formClose = searchElem('.wobbly-form-exit', container)
        let formImg = searchElem('img', container)
        let formList = searchElem('ul', container)
        let formButton = searchElem('.wobbly-form-confirm', container)

        formTaskInput.value = decodeURI(wobblyButton.issue)
        formImg.src = chrome.extension.getURL("images/logo.svg");

        formClose.onclick = (e) => {
            document.body.removeChild(container)
            wobblyButton.formContainer = null
        }
        
        container.onclick = (e) => {
            if(formList.style.display === 'block' && !formList.contains(e.target) && e.target !== formProjectInput){
                formList.style.display = "none"
            }
        }

        formButton.onclick = (e) => {
            if (!validateInputs()){
                return
            }
            wobblyButton.issue = encodeURI(formTaskInput.value)
            wobblyButton.sendTimerData()
            wobblyButton.formContainer = null
            document.body.removeChild(container)
        }

        document.body.onmousedown = (e) => {
            if(wobblyButton.formContainer && e.target.closest('.wobbly-form-container') === null && e.target !== wobblyButton.link){
                document.body.removeChild(container)
                wobblyButton.formContainer = null
            }
        }
        
        let filterProjects = (event) => {
            if(event.target.value.length){
                let afterSearch = wobblyButton.projectList.filter(
                    obj => obj.name.toLowerCase().indexOf(event.target.value.toLowerCase().trim()) !== -1
                );
                renderList(afterSearch)
            }
            else {
                renderList(wobblyButton.projectList)
            }
        }

        let projectSelect = (event) => {
            formProjectInput.value = event.target.textContent
            wobblyButton.projectID = event.target.id
            formList.style.display = "none"
        }

        let renderList = (projectList) => {
            formList.innerHTML = ""
            projectList.forEach((project) => {
                let item = createTag('li', 'select-opt')
                item.id = project.id
                item.textContent = project.name
                item.onclick = projectSelect
                formList.appendChild(item)
            })
        }

        let validateInputs = () => {
            if(!formTaskInput.value.length){
                formTaskInput.style.borderColor = 'red'
                return false
            }
            else if(!wobblyButton.projectList.some((item) => {
                return item.name === formProjectInput.value
            }) || !formProjectInput.value.length){
                formProjectInput.style.borderColor = 'red'
                return false
            }
            else return true
        }

        formTaskInput.onfocus = (e) => formTaskInput.style.borderColor = 'white'
        
        formProjectInput.onkeyup = filterProjects

        formProjectInput.onfocus = (e) => {
            formList.style.display = "block"
            formProjectInput.style.borderColor = 'white'
            renderList(wobblyButton.projectList)
        }
    }
}

chrome.runtime.onMessage.addListener((request) => {
    if(request.type === 'timer-stop'){
        wobblyButton.activeTimer = null
        wobblyButton.currentTimer = false
        wobblyButton.link.textContent = wobblyButton.link.textContent ? "Start timer" : ''
        wobblyButton.link.style.backgroundImage = `url(${chrome.extension.getURL("images/favicon.svg")})`
    }
    else if(request.type === 'timer-data'){
        wobblyButton.activeTimer = request.data
        wobblyButton.projectList = request.projects
        wobblyButton.checkCurrentTimer()
    }
    
})