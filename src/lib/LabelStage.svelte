<script lang="ts">
  import type { Snippet } from "svelte";
  import {
    OVERLAY_MIME,
    snapBox,
    type Box,
    type Guide,
    type Overlay,
    type Point,
  } from "./label-layout";

  type Props = {
    width: number;
    height: number;
    margin: Point;
    textBox: Box | null;
    overlayBoxes: Record<number, Box>;
    overlays: Overlay[];
    textOffset: Point;
    children: Snippet;
  };

  type Target = "text" | number;

  type Drag = {
    target: Target;
    mode: "move" | "resize";
    start: Point;
    origin: Point;
    box: Box;
    size: number;
    // Set once the pointer travelled far enough to count as a drag rather than a click.
    moved: boolean;
  };

  // Snap distance and default dropped item size, in screen pixels / label height.
  const SNAP_PX = 6;
  const DRAG_START_PX = 3;
  // Keyboard nudge distance in label dots; Shift moves further.
  const NUDGE = 1;
  const NUDGE_SHIFT = 10;
  const ARROWS: Record<string, Point> = {
    ArrowLeft: {
      x: -1,
      y: 0,
    },
    ArrowRight: {
      x: 1,
      y: 0,
    },
    ArrowUp: {
      x: 0,
      y: -1,
    },
    ArrowDown: {
      x: 0,
      y: 1,
    },
  };
  const DROP_SIZE_RATIO = 0.6;
  const MIN_SIZE = 4;

  let {
    width,
    height,
    margin,
    textBox,
    overlayBoxes,
    overlays = $bindable(),
    textOffset = $bindable(),
    children,
  }: Props = $props();

  let stage: HTMLDivElement | undefined = $state();
  let selected = $state<Target | null>(null);
  let hovered = $state<Target | null>(null);
  let guides = $state<Guide[]>([]);
  let drag: Drag | null = null;

  const selectedBox = $derived(
    selected === "text"
      ? textBox
      : selected !== null
        ? overlayBoxes[selected] ?? null
        : null,
  );

  function pct(value: number, total: number) {
    return `${(value / total) * 100}%`;
  }

  function stageRect() {
    if (!stage) throw new Error("Label stage is not mounted");
    return stage.getBoundingClientRect();
  }

  function toLabel(event: MouseEvent): Point {
    const rect = stageRect();
    return {
      x: ((event.clientX - rect.left) * width) / rect.width,
      y: ((event.clientY - rect.top) * height) / rect.height,
    };
  }

  function contains(box: Box, point: Point) {
    return (
      point.x >= box.x &&
      point.x <= box.x + box.width &&
      point.y >= box.y &&
      point.y <= box.y + box.height
    );
  }

  // Overlays are drawn above the text, so they win hit tests; later ones are on top.
  function hitTest(point: Point): Target | null {
    for (const overlay of [...overlays].reverse()) {
      const box = overlayBoxes[overlay.id];
      if (box && contains(box, point)) return overlay.id;
    }
    return textBox && contains(textBox, point)
      ? "text"
      : null;
  }

  function findOverlay(id: number) {
    const overlay = overlays.find((item) => item.id === id);
    if (!overlay) throw new Error(`Overlay ${id} not found`);
    return overlay;
  }

  function startDrag(event: PointerEvent, target: Target, mode: Drag["mode"]) {
    const box = target === "text"
      ? textBox
      : overlayBoxes[target];
    if (!box) return;

    const overlay = target === "text"
      ? null
      : findOverlay(target);
    // Copy the position: the live object changes while dragging.
    const { x, y } = overlay ?? textOffset;
    drag = {
      target,
      mode,
      start: toLabel(event),
      origin: {
        x,
        y,
      },
      box,
      size: overlay?.size ?? 0,
      moved: false,
    };
    selected = target;
    stage?.setPointerCapture(event.pointerId);
  }

  function onpointerdown(event: PointerEvent) {
    const target = hitTest(toLabel(event));
    selected = target;
    if (target !== null) startDrag(event, target, "move");
  }

  function onpointermove(event: PointerEvent) {
    const point = toLabel(event);
    if (!drag) {
      hovered = hitTest(point);
      return;
    }

    const dx = point.x - drag.start.x;
    const dy = point.y - drag.start.y;
    const pixelsPerDot = stageRect().width / width;
    if (!drag.moved && Math.hypot(dx, dy) * pixelsPerDot < DRAG_START_PX) return;
    drag.moved = true;

    if (drag.mode === "resize" && drag.target !== "text") {
      const scale = (drag.box.width + dx) / drag.box.width;
      findOverlay(drag.target).size = Math.max(MIN_SIZE, Math.round(drag.size * scale));
      return;
    }

    const threshold = SNAP_PX / pixelsPerDot;
    const snapped = snapBox(
      {
        ...drag.box,
        x: drag.box.x + dx,
        y: drag.box.y + dy,
      },
      {
        width,
        height,
        margin,
      },
      threshold,
    );
    guides = snapped.guides;
    const position = {
      x: Math.round(drag.origin.x + snapped.x - drag.box.x),
      y: Math.round(drag.origin.y + snapped.y - drag.box.y),
    };

    if (drag.target === "text") {
      textOffset = position;
    } else {
      Object.assign(findOverlay(drag.target), position);
    }
  }

  function endDrag() {
    drag = null;
    guides = [];
  }

  function removeSelected() {
    overlays = overlays.filter((overlay) => overlay.id !== selected);
    selected = null;
  }

  function isTyping(target: EventTarget | null) {
    return target instanceof HTMLElement
      && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
  }

  function onkeydown(event: KeyboardEvent) {
    if (selected === null || isTyping(event.target)) return;

    if (event.key === "Escape") {
      selected = null;
      return;
    }

    if ((event.key === "Delete" || event.key === "Backspace") && selected !== "text") {
      event.preventDefault();
      removeSelected();
      return;
    }

    const direction = ARROWS[event.key];
    if (!direction) return;

    event.preventDefault();
    const step = event.shiftKey
      ? NUDGE_SHIFT
      : NUDGE;
    const target = selected === "text"
      ? textOffset
      : findOverlay(selected);
    const position = {
      x: target.x + direction.x * step,
      y: target.y + direction.y * step,
    };
    if (selected === "text") {
      textOffset = position;
    } else {
      Object.assign(target, position);
    }
  }

  function ondragover(event: DragEvent) {
    if (event.dataTransfer?.types.includes(OVERLAY_MIME)) event.preventDefault();
  }

  function ondrop(event: DragEvent) {
    const content = event.dataTransfer?.getData(OVERLAY_MIME);
    if (!content) return;

    event.preventDefault();
    const point = toLabel(event);
    const size = Math.round(height * DROP_SIZE_RATIO);
    const id = Math.max(0, ...overlays.map((overlay) => overlay.id)) + 1;
    overlays.push({
      id,
      content,
      x: Math.round(point.x - size / 2),
      y: Math.round(point.y - size / 2),
      size,
    });
    selected = id;
  }
</script>

<svelte:window {onkeydown} />

<div
  class="stage"
  class:pointer={hovered !== null}
  bind:this={stage}
  role="application"
  aria-label="Label layout: drag icons here, then move or resize them"
  {onpointerdown}
  {onpointermove}
  onpointerup={endDrag}
  onpointercancel={endDrag}
  onpointerleave={() => (hovered = null)}
  {ondragover}
  {ondrop}
>
  {@render children()}

  {#each guides as guide}
    <div
      class="guide {guide.axis}"
      style:left={guide.axis === "x" ? pct(guide.at, width) : null}
      style:top={guide.axis === "y" ? pct(guide.at, height) : null}
    ></div>
  {/each}

  {#if selectedBox}
    <div
      class="selection"
      style:left={pct(selectedBox.x, width)}
      style:top={pct(selectedBox.y, height)}
      style:width={pct(selectedBox.width, width)}
      style:height={pct(selectedBox.height, height)}
    >
      {#if selected !== "text" && selected !== null}
        {@const target = selected}
        <button
          class="remove"
          title="Remove"
          aria-label="Remove item"
          onpointerdown={(event) => event.stopPropagation()}
          onclick={removeSelected}
        >×</button>
        <button
          class="resize"
          title="Resize"
          aria-label="Resize item"
          onpointerdown={(event) => {
            event.stopPropagation();
            startDrag(event, target, "resize");
          }}
        ></button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .stage {
    position: relative;
    outline: 1px solid #dadce0;
    border-radius: 4px;
    touch-action: none;
    user-select: none;
  }

  .stage.pointer {
    cursor: move;
  }

  .guide {
    position: absolute;
    background: #e8710a;
    pointer-events: none;
  }

  .guide.x {
    top: 0;
    bottom: 0;
    width: 1px;
  }

  .guide.y {
    left: 0;
    right: 0;
    height: 1px;
  }

  .selection {
    position: absolute;
    box-sizing: border-box;
    outline: 1px dashed #1a73e8;
    pointer-events: none;
  }

  .remove,
  .resize {
    position: absolute;
    display: grid;
    place-items: center;
    width: 1rem;
    height: 1rem;
    padding: 0;
    border: 1px solid #1a73e8;
    border-radius: 50%;
    background: #fff;
    pointer-events: auto;
  }

  .remove {
    top: -0.5rem;
    right: -0.5rem;
    color: #1a73e8;
    cursor: pointer;
    font-size: 0.75rem;
    line-height: 1;
  }

  .resize {
    right: -0.5rem;
    bottom: -0.5rem;
    width: 0.75rem;
    height: 0.75rem;
    background: #1a73e8;
    cursor: nwse-resize;
  }
</style>
