"use strict";
/* global createTag */

wobblyButton.renderButton(".window-header:not(.wobbly)", (elem) => {
  const getProject = () => {
    const project = searchElem(".board-header-btn-text");
    return project ? project.textContent.trim() : "";
  };

  const rootElement = searchElem(elem);
  if (!rootElement) return;
  const actionButton =
    searchElem(".js-move-card") ||
    searchElem(".js-copy-card") ||
    searchElem(".js-archive-card") ||
    searchElem(".js-more-menu");
  if (
    !actionButton ||
    !rootElement ||
    rootElement.classList.contains("wobbly")
  ) {
    return;
  }

  const getDescription = () => {
    const description = searchElem(".window-title h2", rootElement);
    return description ? description.textContent.trim() : "";
  };

  rootElement.classList.add("wobbly");
  const container = createTag("div", "button-link trello-tb-wrapper");
  let link = createTag("a", "wobbly", "Start timer");
  link.style = `
            cursor: pointer;
            padding-left: 20px;
            background: url(${chrome.extension.getURL(
              "images/favicon.svg"
            )}) no-repeat;
            background-size: contain;
        `;
  link.onclick = () =>
    wobblyButton.currentTimer
      ? wobblyButton.timerStop()
      : wobblyButton.timerStart(getDescription());

  wobblyButton.project = getProject();
  wobblyButton.task = getDescription();
  wobblyButton.issue = wobblyButton.task;

  link.title = `${wobblyButton.task} - ${wobblyButton.project}`;

  container.appendChild(link);
  actionButton.parentNode.insertBefore(container, actionButton);
  wobblyButton.link = link;
});

/* Checklist buttons */
wobblyButton.renderButton(".checklist-item-details:not(.wobbly)", (elem) => {
  const rootElement = searchElem(elem);
  if (!rootElement) return;
  if (!rootElement || rootElement.classList.contains("wobbly")) {
    return;
  }
  rootElement.classList.add("wobbly");

  const getTitleText = () => {
    const titles = searchElem(".window-title h2");
    return titles ? titles.textContent.trim() : "";
  };

  const getTaskText = () => {
    const task = searchElem(".checklist-item-details-text", rootElement);
    return task ? task.textContent.trim() : "";
  };

  let link = createTag("a", "wobbly");
  link.style = `
    visibility: visible;
    pointer-events: all;
    height: 100%;
    width: 100%;
    cursor: pointer;
    padding-left: 5px;
    background: url(${chrome.extension.getURL("images/favicon.svg")}) no-repeat;
    background-size: contain;
`;
  link.onclick = (e) =>{
    wobblyButton.currentTimer
      ? wobblyButton.timerStop()
      : wobblyButton.timerStart(`${getTitleText()} - ${getTaskText()}`);
  }
  
  wobblyButton.issue = `${getTitleText()} - ${getTaskText()}`;
  link.title = `${getTitleText()} - ${getTaskText()}`;
  // wobblyButton.link = link;

  const wrapper = document.createElement("span");
  wrapper.classList.add("checklist-item-menu");
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.marginRight = "5px";
  wrapper.appendChild(link);
  rootElement.querySelector(".checklist-item-controls").appendChild(wrapper);
});