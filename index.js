const { ActiveWindow } = require("@paymoapp/active-window");

let pageActivators = ["", "", "", ""];
let useRegEx = false;
let defaultPage = -1;
let lastPageActivator = "";
let controller = undefined;
let listenOption = "name";

let messagePorts = new Set();

exports.loadPackage = async function (gridController, persistedData) {
  controller = gridController;
  pageActivators = persistedData?.pageActivators ?? pageActivators;
  useRegEx = persistedData?.useRegEx ?? false;
  defaultPage = persistedData?.defaultPage ?? -1;
  listenOption = persistedData?.listenOption ?? "name";
  console.log(JSON.stringify(pageActivators));

  isEnabled = true;

  if (ActiveWindow.requestPermissions()) {
    activeWindowSubscribeId = ActiveWindow.subscribe(checkActiveWindow);
    checkActiveWindow(ActiveWindow.getActiveWindow());
  }

  return true;
};

exports.unloadPackage = async function () {
  controller = undefined;
  messagePorts.forEach((port) => port.close());
  messagePorts.clear();
  ActiveWindow.unsubscribe(activeWindowSubscribeId);
};

exports.addMessagePort = async function (port) {
  port.on("message", (e) => {
    onMessage(port, e.data);
  });

  messagePorts.add(port);
  port.on("close", () => {
    messagePorts.delete(port);
  });
  port.start();
};

async function onMessage(port, data) {
  if (data.type === "request-configuration") {
    port.postMessage({
      type: "configuration",
      pageActivators,
      useRegEx,
      defaultPage,
      listenOption,
      lastPageActivator,
    });
  } else if (data.type === "save-configuration") {
    //cancelLoop();

    pageActivators = data.pageActivators ?? pageActivators;
    useRegEx = data.useRegEx ?? useRegEx;
    defaultPage = data.defaultPage ?? defaultPage;
    listenOption = data.listenOption ?? listenOption;
    isEnabled = true;

    const payload = {
      pageActivators,
      useRegEx,
      defaultPage,
      listenOption,
    };

    controller.sendMessageToEditor({
      type: "persist-data",
      data: payload,
    });

    //await runLoop();
  }
}

async function checkActiveWindow(result) {
  try {
    if (result === undefined) {
      result = { owner: { name: "Unknown!" }, title: "Invalid title!" };
    }

    const [owner, title] = [result.application, result.title];
    const targetString = listenOption === "title" ? title : owner;

    if (lastPageActivator === targetString) {
      return;
    }

    lastPageActivator = targetString;

    let page = undefined;
    for (let i = 0; i < 4; i++) {
      if ((pageActivators[i]?.length ?? 0) === 0) {
        continue;
      }

      let matchFound = false;
      if (useRegEx) {
        try {
          const regex = new RegExp(pageActivators[i]);
          const regexMatch = regex.test(targetString);
          matchFound = regexMatch;
        } catch (e) {
          continue; //Regex syntax error in criteria[i], skip
        }
      } else {
        const normalMatch = pageActivators[i] === targetString;
        matchFound = normalMatch;
      }

      if (matchFound) {
        page = i;
        break;
      }
    }

    //Fallback logic when no suitable match is found
    if (typeof page === "undefined" && defaultPage !== -1) {
      page = defaultPage;
    }

    if (typeof page !== "undefined") {
      controller.sendMessageToEditor({
        type: "change-page",
        num: page,
      });
    }

    for (const port of messagePorts) {
      port.postMessage({
        type: "active-info",
        active: targetString,
      });
    }
  } catch (e) {
    console.error("error:", e);
    controller.sendMessageToEditor({
      error: e.message,
    });
  }
}
