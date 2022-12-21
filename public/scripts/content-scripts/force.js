"use strict";
const lightningSelector = (selector) => {
  // Navigate around many views being present in the DOM, hidden/revealed at various times
  return searchElem(
    `.slds-template__container > .lafSinglePaneWindowManager >.windowViewMode-normal ${selector}`
  );
};

wobblyButton.renderButton(
  ".slds-page-header__name-title:not(.wobbly)",
  (elem) => {
    const rootElement = searchElem(elem);
    if (!rootElement) return;
    if (!rootElement || rootElement.classList.contains("wobbly")) {
      return;
    }
    rootElement.classList.add("wobbly");

    const getDescription = () => {
      let description = lightningSelector(
        ".slds-page-header__title .uiOutputText:not(.selectedListView)"
      );
      const descriptionFromTitle = document
        .querySelector("title")
        .textContent.split("| Salesforce")
        .shift()
        .trim();

      if (!description)
        description = lightningSelector(
          ".slds-page-header__title lightning-formatted-name"
        );
      if (!description)
        description = lightningSelector(
          ".slds-page-header__title lightning-formatted-text"
        );
      return description
        ? description.textContent.trim()
        : descriptionFromTitle;
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
        : wobblyButton.timerStart(getDescription());
    };

    link.title = getDescription();
    wobblyButton.link = link;

    wobblyButton.task = getDescription();
    wobblyButton.issue = wobblyButton.task;

    searchElem(".slds-var-p-right_x-small").appendChild(link);
  }
);
