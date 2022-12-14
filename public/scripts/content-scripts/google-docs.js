"use strict";
wobblyButton.renderButton("#docs-bars:not(.wobbly)", (elem) => {
  const rootElement = searchElem(elem);
  if (!rootElement) return;
  if (!rootElement || rootElement.classList.contains("wobbly")) {
    return;
  }
  rootElement.classList.add("wobbly");
  wobblyButton.task = searchElem(".docs-title-input").textContent;
  wobblyButton.issue = wobblyButton.task;
  const titleFunc = function () {
    const title = searchElem(".docs-title-input");
    return title ? title.value : "";
  };

  let link = createTag("a", "wobbly", "Start timer");
  link.style = `
            cursor: pointer;
            padding-left: 20px;
            background: url(${chrome.extension.getURL(
              "images/favicon.svg"
            )}) no-repeat;
            background-size: contain;
            margin-left: 10px;
        `;
  link.onclick = (e) => {
    wobblyButton.currentTimer
      ? wobblyButton.timerStop()
      : wobblyButton.timerStart(titleFunc());
  };
  link.title = titleFunc();
  wobblyButton.link = link;
  searchElem("#docs-menubar").appendChild(link);
});
