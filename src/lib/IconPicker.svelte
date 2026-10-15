<script lang="ts">
  import { emojiByText, iconPacks, type PickerIcon } from "./icon-packs";
  import { OVERLAY_MIME } from "./label-layout";

  const PAGE_SIZE = 60;

  let { onselect = (_text: string) => {} } = $props();
  let query = $state("");
  let limits = $state<Record<string, number>>({});
  let recentIcons = $state(
    ["😀", "👍", "❤️", "😂", "🎉", "👋", "🔥", "💯"]
      .map((emoji) => emojiByText.get(emoji))
      .filter((icon) => icon !== undefined),
  );

  // Exact label matches first, then prefix matches, then everything else.
  function rank(icon: PickerIcon, q: string) {
    if (icon.label === q) return 0;
    if (icon.label.startsWith(q)) return 1;
    return 2;
  }

  const results = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return iconPacks
      .map((pack) => ({
        ...pack,
        icons: q
          ? pack.icons
              .filter((icon) => icon.searchText.includes(q))
              .sort((a, b) => rank(a, q) - rank(b, q))
          : pack.icons,
      }))
      .filter((pack) => pack.icons.length > 0);
  });

  // Dropping on the label places the icon freely; dropping in the text box inserts its code.
  function dragIcon(event: DragEvent, icon: PickerIcon) {
    event.dataTransfer?.setData(OVERLAY_MIME, icon.insert);
    event.dataTransfer?.setData("text/plain", icon.insert);
  }

  function selectIcon(icon: PickerIcon) {
    recentIcons = [icon, ...recentIcons.filter((recent) => recent !== icon)].slice(
      0,
      8,
    );
    onselect(icon.insert);
  }
</script>

{#snippet iconButton(icon: PickerIcon)}
  <button
    onclick={() => selectIcon(icon)}
    ondragstart={(event) => dragIcon(event, icon)}
    draggable="true"
    class="icon-btn"
    title={icon.title}
  >
    {#if icon.glyph.kind === "text"}
      <span
        class="glyph"
        style:font-family={icon.glyph.fontFamily && `"${icon.glyph.fontFamily}"`}
        style:font-weight={icon.glyph.fontWeight}
      >{icon.glyph.text}</span>
    {:else}
      <svg
        class={icon.glyph.paint}
        viewBox={[
          ...(icon.glyph.viewBoxOrigin ?? [0, 0]),
          icon.glyph.viewBoxSize,
          icon.glyph.viewBoxSize,
        ].join(" ")}
        aria-hidden="true"
      >
        {#each icon.glyph.node as [tag, attrs]}
          <svelte:element this={tag} {...attrs} />
        {/each}
      </svg>
    {/if}
  </button>
{/snippet}

<icon-picker>
  <div class="header">
    <input
      bind:value={query}
      oninput={() => (limits = {})}
      placeholder="Search emoji and icons..."
    />
  </div>

  <div class="grid-container">
    {#if recentIcons.length > 0 && !query.trim()}
      <div class="section">
        <p>Recent</p>
        <div class="grid">
          {#each recentIcons as icon}
            {@render iconButton(icon)}
          {/each}
        </div>
      </div>
    {/if}

    {#each results as pack (pack.id)}
      {@const limit = limits[pack.id] ?? PAGE_SIZE}
      <div class="section">
        <p>{pack.title} · {pack.icons.length}</p>
        <div class="grid">
          {#each pack.icons.slice(0, limit) as icon}
            {@render iconButton(icon)}
          {/each}
        </div>
        {#if pack.icons.length > limit}
          <button
            class="more-btn"
            onclick={() => (limits[pack.id] = limit + PAGE_SIZE * 4)}
          >
            Show more ({pack.icons.length - limit} left)
          </button>
        {/if}
      </div>
    {:else}
      <p class="empty">No emoji or icons match "{query.trim()}"</p>
    {/each}
  </div>
</icon-picker>

<style>
  icon-picker {
    display: flex;
    flex-direction: column;
    width: 100%;
    background: #fff;
  }

  .header {
    flex: none;
    padding: 0.75rem;
    border-bottom: 1px solid #e8eaed;
  }

  input {
    box-sizing: border-box;
    width: 100%;
    height: 2.25rem;
    padding: 0 0.75rem;
    border: 1px solid #dadce0;
    border-radius: 4px;
    background: #f8fafd;
    color: #202124;
    font: inherit;
    font-size: 0.9rem;
  }

  input:focus {
    outline: none;
    border-color: #1a73e8;
    background: #fff;
    box-shadow: 0 0 0 2px #d2e3fc;
  }

  button {
    border: none;
    background: none;
  }

  .grid-container {
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 0 0.75rem 0.75rem;
  }

  .section {
    margin-bottom: 0.25rem;
  }

  .section p,
  .empty {
    margin: 0;
    padding: 0.75rem 0 0.45rem;
    color: #5f6368;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    line-height: 1em;
    text-transform: uppercase;
  }

  /* Keep the pack name visible while scrolling through its icons. */
  .section p {
    position: sticky;
    top: 0;
    z-index: 1;
    background: #fff;
  }

  .grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .icon-btn {
    display: grid;
    place-items: center;
    width: 2.125rem;
    height: 2.125rem;
    padding: 0;
    border-radius: 3px;
    color: #202124;
    font-size: 1rem;
    line-height: 1;
  }

  .icon-btn:hover {
    background: #f1f3f4;
  }

  .icon-btn:active {
    transform: scale(0.95);
  }

  .more-btn {
    margin-top: 0.35rem;
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
    color: #1a73e8;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .more-btn:hover {
    background: #e8f0fe;
  }

  .glyph {
    font-style: normal;
    letter-spacing: normal;
    text-transform: none;
    white-space: nowrap;
    direction: ltr;
    font-feature-settings: "liga";
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  svg {
    display: block;
    width: 1.25rem;
    height: 1.25rem;
  }

  .stroke,
  .stroke-thin {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .stroke-thin {
    stroke-width: 1.5;
  }

  .fill {
    fill: currentColor;
    stroke: none;
    /* Matches the label renderer for outlined (fill="none") shapes. */
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .ion {
    fill: currentColor;
    stroke: currentColor;
    stroke-width: 32px;
  }

  .ion :global(.ionicon-fill-none) {
    fill: none;
  }
</style>
