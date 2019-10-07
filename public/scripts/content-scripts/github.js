wobblyButton.renderButton("#partial-discussion-sidebar", function(elem) {
  let rootElement = searchElem(elem);
  if (!rootElement || rootElement.classList.contains("wobbly")) return;

  wobblyButton.project = searchElem("strong", searchElem("h1")).textContent;
  wobblyButton.task = searchElem(".gh-header-number").textContent;
  wobblyButton.detail = searchElem(".js-issue-title").textContent.trim();
  wobblyButton.issue = encodeURI(`${wobblyButton.task} ${wobblyButton.detail}`);

  rootElement.classList.add("wobbly");
  let container = createTag("div", "discussion-sidebar-item wobbly-button");
  let link = createTag("a", "wobbly", "Start timer");
  link.style = `
            cursor: pointer;
            padding-left: 20px;
            background: url(${chrome.extension.getURL(
              "images/favicon.svg"
            )}) no-repeat;
            background-size: contain;
        `;
  link.onclick = () => {
    wobblyButton.currentTimer
      ? wobblyButton.timerStop()
      : wobblyButton.timerStart();
  };
  link.title = `${wobblyButton.task} / ${wobblyButton.detail} - ${wobblyButton.project}`;

  rootElement.prepend(container);
  container.appendChild(link);
  wobblyButton.link = link;
});

wobblyButton.renderButton(".js-project-card-details", function(elem) {
  let rootElement = searchElem(elem);
  if (!rootElement) return;

  const project = searchElem("h1.public strong a, h1.private strong a");
  const task = searchElem(
    ".js-project-card-details .project-comment-title-hover span.text-gray-light",
    rootElement
  );
  const detail = searchElem(".js-issue-title");

  if (task && detail && project) {
    wobblyButton.project = project.textContent;
    wobblyButton.task = task.textContent;
    wobblyButton.detail = detail.textContent;
    wobblyButton.issue = encodeURI(
      `${wobblyButton.task} ${wobblyButton.detail}`
    );
  }

  rootElement.classList.add("wobbly");
  let container = createTag(
    "div",
    "discussion-sidebar-item js-discussion-sidebar-item"
  );
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
      : wobblyButton.timerStart();
  if (wobblyButton.task && wobblyButton.detail && wobblyButton.project) {
    link.title = `${wobblyButton.task} / ${wobblyButton.detail} - ${wobblyButton.project}`;
  }
  container.appendChild(link);
  const containerAppend = searchElem(".discussion-sidebar-item");
  if (!containerAppend || searchElem(".wobbly", rootElement)) return;
  containerAppend.parentNode.insertBefore(container, containerAppend);
  wobblyButton.link = link;
});
