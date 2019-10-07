"use strict";
/* global createTag */

wobblyButton.renderButton(".window-header:not(.wobbly)", elem => {
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
      : wobblyButton.timerStart(true);

  wobblyButton.project = getProject();
  wobblyButton.task = getDescription();
  wobblyButton.issue = encodeURI(wobblyButton.task);

  link.title = `${wobblyButton.task} - ${wobblyButton.project}`;

  container.appendChild(link);
  actionButton.parentNode.insertBefore(container, actionButton);
  wobblyButton.link = link;
});
