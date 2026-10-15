// Drag-and-drop payload type used when dragging picker items onto the label.
export const OVERLAY_MIME = "application/x-labelforge-content";

export type Point = {
  x: number;
  y: number;
};

export type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// An emoji or icon placed freely on the label, positioned and sized in label dots.
export type Overlay = {
  id: number;
  content: string;
  x: number;
  y: number;
  size: number;
};

export type Guide = {
  axis: "x" | "y";
  at: number;
};

type LabelFrame = {
  width: number;
  height: number;
  margin: Point;
};

// Snap a box's edges or center to the label's margins and center lines.
export function snapBox(
  box: Box,
  label: LabelFrame,
  threshold: number,
): Point & { guides: Guide[] } {
  const snapAxis = (start: number, size: number, total: number, margin: number) => {
    let best: { offset: number; line: number } | undefined;
    for (const line of [margin, total / 2, total - margin]) {
      for (const edge of [start, start + size / 2, start + size]) {
        const offset = line - edge;
        if (Math.abs(offset) <= threshold && (!best || Math.abs(offset) < Math.abs(best.offset))) {
          best = {
            offset,
            line,
          };
        }
      }
    }
    return best;
  };

  const snapX = snapAxis(box.x, box.width, label.width, label.margin.x);
  const snapY = snapAxis(box.y, box.height, label.height, label.margin.y);
  const guides: Guide[] = [];
  if (snapX) {
    guides.push({
      axis: "x",
      at: snapX.line,
    });
  }
  if (snapY) {
    guides.push({
      axis: "y",
      at: snapY.line,
    });
  }

  return {
    x: box.x + (snapX?.offset ?? 0),
    y: box.y + (snapY?.offset ?? 0),
    guides,
  };
}
