wobblyButton.renderButton("#partial-discussion-sidebar", function(elem) {
  let rootElement = searchElem(elem);
  if (!rootElement || rootElement.classList.contains("wobbly")) return;

  rootElement.classList.add("wobbly");

  const getIdTask = () => {
    const idTask = searchElem('.gh-header-number');
    return idTask ? idTask.textContent : "";
  }

  const getTitleText = () => {
    const title = searchElem('.js-issue-title');
    return title ? title.textContent.trim() : "";
  };

  wobblyButton.detail = getTitleText()
  wobblyButton.task = getIdTask;
  wobblyButton.issue = `${wobblyButton.task} ${wobblyButton.detail}`;

  let container = createTag("div", "discussion-sidebar-item wobbly-button");
  let link = createTag("a", "wobbly", "Start timer");
  link.style = `
            cursor: pointer;
            padding-left: 20px;
            background: url(${chrome.extension.getURL("images/favicon.svg")}) no-repeat;
            background-size: contain;
        `;
  link.onclick = () => {
    wobblyButton.currentTimer
        ? wobblyButton.timerStop()
        : wobblyButton.timerStart(`${getIdTask()} ${getTitleText()}`);
  }
  link.title = `${getIdTask()} ${getTitleText()}`;

  wobblyButton.link = link;

  rootElement.prepend(container);
  container.appendChild(link);

});
