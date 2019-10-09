try {
  const getProject = () => document.querySelector("h1").textContent;
  const getNumberTask = () =>
    document.querySelector("h2").childNodes[0].textContent;
  const getTask = () =>
    (document.querySelector(".subject h3") &&
      document.querySelector(".subject h3").textContent) ||
    "";

  wobblyButton.renderButton(
    "body.controller-issues.action-show h2:not(.wobbly)",
    elem => {
      const rootElement = searchElem(elem);
      if (!rootElement) return;

      rootElement.classList.add("wobbly");
      let link = createTag("a", "wobbly", "Start timer");
      link.style = `
                  cursor: pointer;
                  margin: 4px 15px 0 15px;
                  float: right;
                  font-size: 0.8em;
                  font-weight: normal;
                  padding-left: 23px;
                  background: url(${chrome.extension.getURL(
                    "images/favicon.svg"
                  )}) no-repeat;
                  background-size: contain;
              `;
      link.onclick = () =>
        wobblyButton.currentTimer
          ? wobblyButton.timerStop()
          : wobblyButton.timerStart(true);

      wobblyButton.project = getProject()
      wobblyButton.task = getTask()
      wobblyButton.issue = `${getNumberTask()} ${wobblyButton.task}`
      link.title = `${wobblyButton.issue} - ${wobblyButton.project}`;

      rootElement.appendChild(link);
      wobblyButton.link = link;
    }
  );
} catch (error) {
  console.log(error);
}
