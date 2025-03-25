<svelte:options
  customElement={{ tag: "active-win-preference", shadow: "none" }}
/>

<script>
  import {
    Block,
    BlockBody,
    BlockRow,
    BlockTitle,
    MeltCheckbox,
    MeltCombo,
    MoltenButton,
    MoltenInput,
  } from "@intechstudio/grid-uikit";
  import { onMount } from "svelte";

  let activeWindow = "N/A";
  let useRegEx = false;
  let useCallbackHook = false;
  let defaultPageNumber = "-1";
  let listenOption = "name";
  let listenToSelf = false;

  let hasBeenInitialized = false;

  let pageActivators = ["", "", "", ""];

  $: activatorsCorrect = pageActivators.map(checkActivatorSyntax);

  $: pageActivators,
    useRegEx,
    listenOption,
    defaultPageNumber,
    listenToSelf,
    useCallbackHook,
    updateConfiguration();

  // @ts-ignore
  const messagePort = createPackageMessagePort("package-active-win");

  onMount(() => {
    messagePort.onmessage = (e) => {
      const data = e.data;
      if (data.type === "configuration") {
        hasBeenInitialized = true;
        useRegEx = data.useRegEx;
        pageActivators = data.pageActivators;
        defaultPageNumber = String(data.defaultPage);
        activeWindow = String(data.lastPageActivator);
        listenOption = data.listenOption;
        listenToSelf = data.listenToSelf;
        useCallbackHook = data.useCallbackHook;
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
      pageActivators,
      useRegEx,
      defaultPage: Number(defaultPageNumber),
      listenOption,
      listenToSelf,
      useCallbackHook,
    });
  }
</script>

<main-app>
  <div class="px-4 bg-secondary rounded-lg">
    <Block>
      <BlockTitle><p class="font-medium">Active Window Package</p></BlockTitle>
      <BlockBody>
        <div class="flex flex-row text-gray-400 text-sm">
          <b>Active window:</b>
          <div>{activeWindow}</div>
        </div>
      </BlockBody>
      <BlockBody>
        <MeltCheckbox
          title={"Use Callback hooks instead of page change"}
          bind:target={useCallbackHook}
          style="none"
        />
      </BlockBody>
      {#if !useCallbackHook}
        <div class="flex flex-col w-full gap-2">
          {#each Array(4) as _, i}
            <div
              class="flex flex-row gap-2 text-white {activatorsCorrect[i]
                ? 'border-transparent'
                : 'border-error error'}"
            >
              <span class="flex items-center" style="white-space:nowrap"
                >Page {i + 1}:</span
              >
              <MoltenInput bind:target={pageActivators[i]} />
              <MoltenButton
                title={"Apply"}
                click={() => {
                  pageActivators[i] = activeWindow;
                }}
              />
            </div>
          {/each}

          <MeltCombo
            size="full"
            title="Listen on"
            bind:value={listenOption}
            suggestions={[
              { info: "Application Name", value: "name" },
              { info: "Title Text", value: "title" },
            ]}
          />
          <MeltCheckbox
            title={"Use Regular Expressions"}
            bind:target={useRegEx}
            style="none"
          />
          <MeltCheckbox
            title={"Listen to Editor focus for Active window info"}
            bind:target={listenToSelf}
            style="none"
          />
          <MeltCombo
            size="full"
            title="Default page"
            bind:value={defaultPageNumber}
            suggestions={[
              { info: "Do not change page", value: "-1" },
              ...(Array(4).fill().map((_, i) => {
                return { info: `Page ${i + 1}`, value: `${i}` };
              })),
            ]}
          />

          <BlockBody>
            <span
              class="text-sm text-gray-400"
              class:hidden={activatorsCorrect.some((e) => !e)}
              >NOTE: When no match is found for active window, the page defined by
              the default behviour will be selected
            </span>
            <span
              class="text-sm text-error"
              class:hidden={activatorsCorrect.every((e) => e)}
              >ERROR: Invalid regular expression syntax!
            </span>
          </BlockBody>
        </div>
      {/if}
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
