window.searchElem = (elem, searchIn) => {
  searchIn = searchIn || document;
  return searchIn.querySelector(elem);
};

window.createTag = (name, className, textContent) => {
  let tag = document.createElement(name);
  tag.className = className;
  if (textContent) {
    tag.textContent = textContent;
  }
  return tag;
};
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
  nextTaskTurn: false,
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
        <div class="wobbly-projects-list" style="display: none;">

        </div>
        </div>
        <button class="wobbly-form-confirm">Start timer</button>`,
  renderButton: function (element, renderer) {
    let debounce = null;
    const observer = new MutationObserver((mutations) => {
      if (debounce) {
        clearTimeout(debounce);
      }
    });
    renderer(element);
    wobblyButton.checkCurrentTimer();
    observer.observe(document, { childList: true, subtree: true });
  },
  timerStart: function (issue) {
    if (wobblyButton.formContainer) {
      return;
    }
    wobblyButton.initFormContainer(issue);
  },
  sendTimerData: function () {
    if (wobblyButton.activeTimer) {
      wobblyButton.nextTaskTurn = true;
      chrome.runtime.sendMessage({ type: "timer-stop" });
      return;
    }
    chrome.runtime.sendMessage({
      type: "timer-start",
      data: {
        project: wobblyButton.projectID,
        issue: wobblyButton.issue,
      },
    });
  },
  timerStop: function () {
    chrome.runtime.sendMessage({ type: "timer-stop" });
  },
  checkCurrentTimer: function () {
    if (
      wobblyButton.link &&
      wobblyButton.activeTimer
    ) {
      if(wobblyButton.activeTimer.issue || !wobblyButton.activeTimer.issue) {
        wobblyButton.currentTimer = true;
        wobblyButton.link.style.backgroundImage = `url(${chrome.extension.getURL(
            "images/favicon-active.svg"
        )})`;
        wobblyButton.link.textContent = wobblyButton.link.textContent
            ? "Stop timer"
            : "";
      }
    } else {
      wobblyButton.currentTimer = false;
    }
  },
  initFormContainer: function (issue) {
    let container = createTag("div", "wobbly-form-container");
    document.body.appendChild(container);
    // let linkPosition = wobblyButton.link.getBoundingClientRect()
    wobblyButton.formContainer = container;
    container.innerHTML = wobblyButton.formElement;

    let formTaskInput = searchElem(".task-input", container);
    let formProjectInput = searchElem(".project-input", container);
    let formClose = searchElem(".wobbly-form-exit", container);
    let formImg = searchElem("img", container);
    let formList = searchElem(".wobbly-projects-list", container);
    let formButton = searchElem(".wobbly-form-confirm", container);

    formTaskInput.value = issue || wobblyButton.issue;
    formImg.src = chrome.extension.getURL("images/logo.svg");

    // wobblyButton.projectList.forEach((project) => {
    //     if(project.name.toLowerCase() === wobblyButton.project.toLowerCase()){
    //         formProjectInput.value = project.name
    //     }
    // })
    formClose.onclick = (e) => {
      document.body.removeChild(container);
      wobblyButton.formContainer = null;
    };

    container.onclick = (e) => {
      if (
        formList.style.display === "block" &&
        !formList.contains(e.target) &&
        e.target !== formProjectInput
      ) {
        formList.style.display = "none";
      }
    };

    formButton.onclick = (e) => {
      if (!validateInputs()) {
        return;
      }
      wobblyButton.issue = formTaskInput.value;
      wobblyButton.sendTimerData();
      wobblyButton.formContainer = null;
      document.body.removeChild(container);
    };

    document.body.onmousedown = (e) => {
      if (
        wobblyButton.formContainer &&
        e.target.closest(".wobbly-form-container") === null &&
        e.target !== wobblyButton.link
      ) {
        document.body.removeChild(container);
        wobblyButton.formContainer = null;
      }
    };

    let filterProjects = (event) => {
      if (event.target.value.length) {
        let afterSearch = wobblyButton.projectList.filter(
          (obj) =>
            obj.name
              .toLowerCase()
              .indexOf(event.target.value.toLowerCase().trim()) !== -1
        );
        renderList(afterSearch);
      } else {
        renderList(wobblyButton.projectList);
      }
    };

    let projectSelect = (event) => {
      formProjectInput.value = event.target.textContent;
      wobblyButton.projectID = event.target.id;
      formList.style.display = "none";
    };

    let renderList = (projectList) => {
      formList.innerHTML = "";
      projectList.forEach((project) => {
        let item = createTag("div", "select-opt");
        item.id = project.id;
        item.textContent = project.name;
        item.onclick = projectSelect;
        formList.appendChild(item);
      });
    };

    let validateInputs = () => {
      if (!formTaskInput.value.length) {
        formTaskInput.style.borderColor = "red";
        return false;
      } else if (
        !wobblyButton.projectList.some((item) => {
          return item.name === formProjectInput.value;
        }) ||
        !formProjectInput.value.length
      ) {
        formProjectInput.style.borderColor = "red";
        return false;
      } else return true;
    };

    formTaskInput.onfocus = (e) => (formTaskInput.style.borderColor = "white");

    formProjectInput.onkeyup = filterProjects;

    formProjectInput.onfocus = (e) => {
      formList.style.display = "block";
      formProjectInput.style.borderColor = "white";
      renderList(wobblyButton.projectList);
    };
  },
};

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === "timer-stop") {
    wobblyButton.activeTimer = null;
    wobblyButton.currentTimer = false;
    wobblyButton.link.textContent = wobblyButton.link.textContent
      ? "Start timer"
      : "";
    wobblyButton.link.style.backgroundImage = `url(${chrome.extension.getURL(
      "images/favicon.svg"
    )})`;
  } else if (request.type === "timer-ready") {
    if (wobblyButton.nextTaskTurn) {
      wobblyButton.nextTaskTurn = false;
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: "timer-start",
          data: {
            project: wobblyButton.projectID,
            issue: wobblyButton.issue,
          },
        });
      }, 500);
    }
  } else if (request.type === "timer-data") {
    wobblyButton.activeTimer = request.data;
    wobblyButton.projectList = request.projects;
    wobblyButton.checkCurrentTimer();
  }
});
