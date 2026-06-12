<script lang="ts">
  import { ionIcons } from "./ionicons";

  let { query = $bindable(""), onselect = (_token: string) => {} } = $props();

  let recentIcons = $state([
    "star-outline",
    "heart-outline",
    "checkmark-outline",
    "pricetag-outline",
    "print-outline",
    "gift-outline",
  ]);

  const filteredIcons = $derived(
    ionIcons.filter((icon) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return icon.searchText.includes(q);
    }),
  );

  const recentIonIcons = $derived(
    recentIcons
      .map((token) => ionIcons.find((icon) => icon.token === token))
      .filter((icon) => icon !== undefined),
  );

  function selectIcon(token: string) {
    recentIcons = [token, ...recentIcons.filter((icon) => icon !== token)].slice(
      0,
      8,
    );
    onselect(token);
  }
</script>

<ion-icons-picker>
  <div class="header">
    <h3>Pick an Ionicon</h3>
    <input bind:value={query} placeholder="Search icons..." />
  </div>

  <div class="grid-container">
    {#if recentIonIcons.length > 0 && !query.trim()}
      <div class="section">
        <p>Recent</p>
        <div class="grid">
          {#each recentIonIcons as icon}
            <button
              onclick={() => selectIcon(icon.token)}
              class="icon-btn"
              title={`${icon.label} (${icon.style})`}
            >
              <svg class="ion-icon" viewBox="0 0 512 512" aria-hidden="true">
                {#each icon.node as [tag, attrs]}
                  <svelte:element this={tag} {...attrs} />
                {/each}
              </svg>
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <div class="section">
      <p>{query.trim() ? `${filteredIcons.length} Results` : "All Ionicons"}</p>
      <div class="grid">
        {#each filteredIcons as icon}
          <button
            onclick={() => selectIcon(icon.token)}
            class="icon-btn"
            title={`${icon.label} (${icon.style})`}
          >
            <svg class="ion-icon" viewBox="0 0 512 512" aria-hidden="true">
              {#each icon.node as [tag, attrs]}
                <svelte:element this={tag} {...attrs} />
              {/each}
            </svg>
          </button>
        {/each}
      </div>
    </div>
  </div>
</ion-icons-picker>

<style>
  ion-icons-picker {
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color: #f8f8f8;
    width: 100%;
    flex-grow: 0;
  }

  .header {
    display: flex;
    align-items: stretch;
    gap: 0.5em;
    padding: 0.5em;
    border-bottom: 1px solid #ccc;
    flex-direction: column;
  }

  h3 {
    margin: 0;
    font-size: 1rem;
    line-height: 1.5rem;
    font-weight: 600;
    color: #111827;
  }

  input {
    box-sizing: border-box;
    width: 100%;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 0.5em;
    font: inherit;
  }

  button {
    border: none;
    background: none;
  }

  .grid-container {
    height: 14rem;
    overflow-y: auto;
    overflow-x: hidden;
    box-sizing: border-box;
    padding: 0.75em 1em;
  }

  .section {
    margin-bottom: 0.75em;
  }

  .section p {
    font-size: 0.75em;
    line-height: 1em;
    font-weight: 500;
    color: #778;
    text-transform: uppercase;
    margin-top: 0;
    margin-bottom: 0.25em;
  }

  .grid {
    display: flex;
    flex-wrap: wrap;
    flex-grow: 0;
    gap: 0.25rem;
    max-width: 448px;
  }

  .icon-btn {
    width: 2.5em;
    height: 2.5em;
    padding: 0.35em;
    border-radius: 0.25em;
  }

  .ion-icon {
    display: block;
    width: 100%;
    height: 100%;
    fill: currentColor;
    stroke: currentColor;
    stroke-width: 32px;
  }

  .ion-icon :global(.ionicon-fill-none) {
    fill: none;
  }

  .ion-icon :global(.ionicon-stroke-width) {
    stroke-width: 32px;
  }

  .icon-btn:hover {
    background-color: #dde;
    transform: scale(1.5);
  }

  .icon-btn:active {
    transform: scale(0.95);
  }
</style>
