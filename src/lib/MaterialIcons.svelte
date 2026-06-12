<script lang="ts">
  import { materialIcons } from "./material-icons";

  let { query = $bindable(""), onselect = (_token: string) => {} } = $props();
  let recentIcons = $state([
    "outlined:home",
    "outlined:favorite",
    "outlined:check",
    "outlined:local_offer",
    "outlined:print",
    "outlined:redeem",
  ]);

  const filteredIcons = $derived(
    materialIcons.filter((icon) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return icon.searchText.includes(q);
    }),
  );

  const recentMaterialIcons = $derived(
    recentIcons
      .map((token) => materialIcons.find((icon) => icon.token === token))
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

<material-icons-picker>
  <div class="header">
    <h3>Pick a Material icon</h3>
    <input bind:value={query} placeholder="Search icons..." />
  </div>

  <div class="grid-container">
    {#if recentMaterialIcons.length > 0 && !query.trim()}
      <div class="section">
        <p>Recent</p>
        <div class="grid">
          {#each recentMaterialIcons as icon}
            <button
              onclick={() => selectIcon(icon.token)}
              class="icon-btn"
              title={`${icon.label} (${icon.style})`}
            >
              <span class="material-icon {icon.style}">{icon.name}</span>
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <div class="section">
      <p>{query.trim() ? `${filteredIcons.length} Results` : "All Material Icons"}</p>
      <div class="grid">
        {#each filteredIcons as icon}
          <button
            onclick={() => selectIcon(icon.token)}
            class="icon-btn"
            title={`${icon.label} (${icon.style})`}
          >
            <span class="material-icon {icon.style}">{icon.name}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>
</material-icons-picker>

<style>
  material-icons-picker {
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
    width: 2em;
    height: 2em;
    font-size: 1.25em;
    line-height: 1.75em;
    border-radius: 0.25em;
  }

  .material-icon {
    font-style: normal;
    font-weight: normal;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    white-space: nowrap;
    direction: ltr;
    font-feature-settings: "liga";
    -webkit-font-feature-settings: "liga";
    -webkit-font-smoothing: antialiased;
  }

  .material-icon.filled {
    font-family: "Material Icons";
  }

  .material-icon.outlined {
    font-family: "Material Icons Outlined";
  }

  .material-icon.round {
    font-family: "Material Icons Round";
  }

  .material-icon.sharp {
    font-family: "Material Icons Sharp";
  }

  .material-icon.two-tone {
    font-family: "Material Icons Two Tone";
  }

  .icon-btn:hover {
    background-color: #dde;
    transform: scale(1.5);
  }

  .icon-btn:active {
    transform: scale(0.95);
  }
</style>
