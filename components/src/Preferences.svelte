<svelte:options
  customElement={{ tag: "active-win-preference", shadow: "none" }}
/>

<script>
  import {
    Block,
    BlockBody,
    BlockRow,
    BlockTitle,
    MoltenButton,
    MoltenInput,
  } from "@intechstudio/grid-uikit";
  import { onMount } from "svelte";

  let activeWindow = "N/A";
  let pageActivator0 = "";
  let pageActivator1 = "";
  let pageActivator2 = "";
  let pageActivator3 = "";
  let useRegEx = false;
  let defaultPageNumber = "-1";
  let listenOption = "0";

  let hasBeenInitialized = false;

  $: activatorsCorrect = [
    pageActivator0,
    pageActivator1,
    pageActivator2,
    pageActivator3,
  ].map(checkActivatorSyntax);

  $: pageActivator0,
    pageActivator1,
    pageActivator2,
    pageActivator3,
    useRegEx,
    listenOption,
    defaultPageNumber,
    updateConfiguration();

  // @ts-ignore
  const messagePort = createPackageMessagePort("package-active-win");

  onMount(() => {
    messagePort.onmessage = (e) => {
      const data = e.data;
      if (data.type === "configuration") {
        hasBeenInitialized = true;
        useRegEx = data.useRegEx;
        pageActivator0 = data.pageActivatorCriteria0;
        pageActivator1 = data.pageActivatorCriteria1;
        pageActivator2 = data.pageActivatorCriteria2;
        pageActivator3 = data.pageActivatorCriteria3;
        defaultPageNumber = String(data.defaultPage);
        activeWindow = String(data.lastPageActivator);
        listenOption = data.listenOption;
      } else if (data.type === "active-info") {
        activeWindow = data.active;
      }
    };
    messagePort.start();
    messagePort.postMessage({
      type: "request-configuration",
    });
    return () => {
      messagePort.close();
    };
  });

  function checkActivatorSyntax(input) {
    if (!useRegEx) {
      return true;
    }

    try {
      new RegExp(input);
      return true;
    } catch (e) {
      return false;
    }
  }

  function updateConfiguration(e) {
    if (!hasBeenInitialized) return;

    messagePort.postMessage({
      type: "save-configuration",
      pageActivatorCriteria0: pageActivator0,
      pageActivatorCriteria1: pageActivator1,
      pageActivatorCriteria2: pageActivator2,
      pageActivatorCriteria3: pageActivator3,
      useRegEx: useRegEx,
      defaultPage: Number(defaultPageNumber),
      listenOption: Number(listenOption),
    });
  }
</script>

<main-app>
  <div class="px-4">
    <Block>
      <BlockTitle>Active Window Package</BlockTitle>
      <BlockBody>
        <div class="flex flex-row text-gray-400 text-sm">
          <b>Active window:</b>
          <div>{activeWindow}</div>
        </div>
      </BlockBody>
      <div class="flex flex-col w-full gap-2">
        <div
          class="flex flex-row gap-2 text-white {activatorsCorrect[0]
            ? 'border-transparent'
            : 'border-error error'}"
        >
          <span
            id="input-label-1"
            class="flex items-center"
            style="white-space:nowrap">Page 1:</span
          >
          <MoltenInput bind:target={pageActivator0} />
          <MoltenButton
            title={"Apply"}
            click={() => (pageActivator0 = activeWindow)}
          />
        </div>
        <div
          class="flex flex-row gap-2 text-white {activatorsCorrect[1]
            ? 'border-transparent'
            : 'border-error error'}"
        >
          <span
            id="input-label-1"
            class="flex items-center"
            style="white-space:nowrap">Page 2:</span
          >
          <MoltenInput bind:target={pageActivator1} />
          <MoltenButton
            title={"Apply"}
            click={() => (pageActivator1 = activeWindow)}
          />
        </div>
        <div
          class="flex flex-row gap-2 text-white {activatorsCorrect[2]
            ? 'border-transparent'
            : 'border-error error'}"
        >
          <span
            id="input-label-1"
            class="flex items-center"
            style="white-space:nowrap">Page 3:</span
          >
          <MoltenInput bind:target={pageActivator2} />
          <MoltenButton
            title={"Apply"}
            click={() => (pageActivator2 = activeWindow)}
          />
        </div>
        <div
          class="flex flex-row gap-2 text-white {activatorsCorrect[3]
            ? 'border-transparent'
            : 'border-error error'}"
        >
          <span
            id="input-label-1"
            class="flex items-center"
            style="white-space:nowrap">Page 4:</span
          >
          <MoltenInput bind:target={pageActivator3} />
          <MoltenButton
            title={"Apply"}
            click={() => (pageActivator3 = activeWindow)}
          />
        </div>
        <div class="flex flex-row">
          <span class="mr-6">Listen on:</span>
          <div class="flex flex-row gap-4">
            <div class="flex flex-row gap-2">
              <div class="flex flex-row gap-2">
                <input
                  type="radio"
                  name="listening"
                  value="0"
                  checked
                  bind:group={listenOption}
                />
                <label for="1">Application Name</label><br />
              </div>
              <input
                type="radio"
                name="listening"
                value="1"
                bind:group={listenOption}
              />
              <label for="0">Title Text</label><br />
            </div>
          </div>
        </div>
        <div class="flex flew-row gap-2">
          <input type="checkbox" bind:checked={useRegEx} />
          <label for="scales">Use Regular Expressions</label>
        </div>
        <div class="grid grid-cols-1 gap-2">
          <div class="flex flex-row gap-2">
            <span>Default Page:</span>
            <select
              id="default-page"
              class="bg-primary flex flex-grow truncate focus:outline-none"
              bind:value={defaultPageNumber}
            >
              <option value="-1">Do not change page</option>
              <option value="0">Page 1</option>
              <option value="1">Page 2</option>
              <option value="2">Page 3</option>
              <option value="3">Page 4</option>
            </select>
          </div>

          <span
            id="note-label"
            class="text-sm text-gray-400 {activatorsCorrect.every((e) => e)
              ? ''
              : 'hidden'}"
            >NOTE: When no match is found for active window, the page defined by
            the default behviour will be selected</span
          >
          <span
            id="error-label"
            class="text-sm text-error hidden {activatorsCorrect.every((e) => e)
              ? 'hidden'
              : ''}"
            >ERROR: Invalid regular expression syntax!
          </span>
        </div>
      </div>
    </Block>
  </div>
</main-app>

<style>
  :root {
    --error-color: rgb(239 68 68);
  }
  .border-error {
    border-color: var(--error-color);
  }
  .text-error {
    color: var(--error-color);
  }
</style>
