const activeWindow = require("active-win");

let interval = 1000;
let pageActivatorCriteria0 = "";
let pageActivatorCriteria1 = "";
let pageActivatorCriteria2 = "";
let pageActivatorCriteria3 = "";
let useRegEx = false;
let defaultPage = -1;
let lastPageActivator = "";
let isEnabled = false;
let currentTimeoutId = undefined;
let controller = undefined;
let listenOption = 0;

let messagePorts = new Set();

exports.loadPlugin = async function (gridController, persistedData) {
  controller = gridController;
  interval = persistedData?.interval ?? 1000;
  pageActivatorCriteria0 = persistedData?.pageActivatorCriteria0 ?? "";
  pageActivatorCriteria1 = persistedData?.pageActivatorCriteria1 ?? "";
  pageActivatorCriteria2 = persistedData?.pageActivatorCriteria2 ?? "";
  pageActivatorCriteria3 = persistedData?.pageActivatorCriteria3 ?? "";
  useRegEx = persistedData?.useRegEx ?? false;
  defaultPage = persistedData?.defaultPage ?? -1;
  listenOption = persistedData?.listenOption ?? 0;

  isEnabled = true;
  runLoop();

  return true;
};

exports.unloadPlugin = async function () {
  controller = undefined;
  messagePorts.forEach((port) => port.close());
  messagePorts.clear();
  cancelLoop();
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
      interval,
      pageActivatorCriteria0,
      pageActivatorCriteria1,
      pageActivatorCriteria2,
      pageActivatorCriteria3,
      useRegEx,
      defaultPage,
      listenOption,
      lastPageActivator,
    });
  } else if (data.type === "save-configuration") {
    cancelLoop();

    interval = data.interval ?? interval;
    pageActivatorCriteria0 =
      data.pageActivatorCriteria0 ?? pageActivatorCriteria0;
    pageActivatorCriteria1 =
      data.pageActivatorCriteria1 ?? pageActivatorCriteria1;
    pageActivatorCriteria2 =
      data.pageActivatorCriteria2 ?? pageActivatorCriteria2;
    pageActivatorCriteria3 =
      data.pageActivatorCriteria3 ?? pageActivatorCriteria3;
    useRegEx = data.useRegEx ?? useRegEx;
    defaultPage = data.defaultPage ?? defaultPage;
    listenOption = data.listenOption ?? listenOption;
    isEnabled = true;

    const payload = {
      interval,
      pageActivatorCriteria0,
      pageActivatorCriteria1,
      pageActivatorCriteria2,
      pageActivatorCriteria3,
      useRegEx: useRegEx,
      defaultPage: defaultPage,
      listenOption: listenOption,
    };

    controller.sendMessageToRuntime({
      id: "persist-data",
      data: payload,
    });

    await runLoop();
  }
}

async function runLoop() {
  if (!isEnabled) return;

  await checkActiveWindow();

  currentTimeoutId = setTimeout(runLoop, Math.max(interval ?? 0, 100));
}

async function checkActiveWindow() {
  try {
    let result = await activeWindow();

    if (result === undefined) {
      result = { owner: { name: "Unknown!" }, title: "Invalid title!" };
    }

    const [owner, title] = [result.owner.name, result.title];
    const targetString = Number(listenOption) === 1 ? title : owner;

    if (lastPageActivator === targetString) {
      return;
    }

    lastPageActivator = targetString;

    let criteria = [
      pageActivatorCriteria0,
      pageActivatorCriteria1,
      pageActivatorCriteria2,
      pageActivatorCriteria3,
    ];

    let page = undefined;
    for (let i = 0; i < 4; i++) {
      if (criteria[i].length === 0) {
        continue;
      }

      let matchFound = false;
      if (useRegEx) {
        try {
          const regex = new RegExp(criteria[i]);
          const regexMatch = regex.test(targetString);
          matchFound = regexMatch;
        } catch (e) {
          continue; //Regex syntax error in criteria[i], skip
        }
      } else {
        const normalMatch = criteria[i] === targetString;
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
      controller.sendMessageToRuntime({
        id: "change-page",
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
    controller.sendMessageToRuntime({
      error: e.message,
    });
  }
}

function cancelLoop() {
  isEnabled = false;
  clearTimeout(currentTimeoutId);
}
