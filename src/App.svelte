<script lang="ts">
  import { onMount, settled, tick } from "svelte";
  import IconPicker from "./lib/IconPicker.svelte";
  import { boxIconMap } from "./lib/boxicons";
  import { devIconMap, type DevIcon } from "./lib/devicons";
  import { bootstrapIconMap } from "./lib/bootstrap-icons";
  import { fontAwesomeIconMap } from "./lib/font-awesome-icons";
  import { heroIconMap, type HeroIcon } from "./lib/heroicons";
  import { ionIconMap, type IonIcon } from "./lib/ionicons";
  import { lucideIconMap, type LucideIcon } from "./lib/lucide-icons";
  import { materialIconMap } from "./lib/material-icons";
  import { phosphorIconMap } from "./lib/phosphor-icons";
  import { remixIconMap } from "./lib/remix-icons";
  import { simpleIconMap, type SimpleIcon } from "./lib/simple-icons";
  import { tablerIconMap, type TablerIcon } from "./lib/tabler-icons";

  const fontAwesomeSolidFontUrl = new URL(
    "@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff2",
    import.meta.url,
  ).href;
  const fontAwesomeRegularFontUrl = new URL(
    "@fortawesome/fontawesome-free/webfonts/fa-regular-400.woff2",
    import.meta.url,
  ).href;
  const fontAwesomeBrandsFontUrl = new URL(
    "@fortawesome/fontawesome-free/webfonts/fa-brands-400.woff2",
    import.meta.url,
  ).href;
  const materialIconsFontUrl = new URL(
    "@material-design-icons/font/material-icons.woff2",
    import.meta.url,
  ).href;
  const materialIconsOutlinedFontUrl = new URL(
    "@material-design-icons/font/material-icons-outlined.woff2",
    import.meta.url,
  ).href;
  const materialIconsRoundFontUrl = new URL(
    "@material-design-icons/font/material-icons-round.woff2",
    import.meta.url,
  ).href;
  const materialIconsSharpFontUrl = new URL(
    "@material-design-icons/font/material-icons-sharp.woff2",
    import.meta.url,
  ).href;
  const materialIconsTwoToneFontUrl = new URL(
    "@material-design-icons/font/material-icons-two-tone.woff2",
    import.meta.url,
  ).href;
  const remixIconFontUrl = new URL(
    "remixicon/fonts/remixicon.woff2",
    import.meta.url,
  ).href;
  const boxIconFontUrl = new URL(
    "boxicons/fonts/boxicons.woff2",
    import.meta.url,
  ).href;
  const bootstrapIconFontUrl = new URL(
    "bootstrap-icons/font/fonts/bootstrap-icons.woff2",
    import.meta.url,
  ).href;
  const phosphorThinFontUrl = new URL(
    "@phosphor-icons/web/thin/Phosphor-Thin.woff2",
    import.meta.url,
  ).href;
  const phosphorLightFontUrl = new URL(
    "@phosphor-icons/web/light/Phosphor-Light.woff2",
    import.meta.url,
  ).href;
  const phosphorRegularFontUrl = new URL(
    "@phosphor-icons/web/regular/Phosphor.woff2",
    import.meta.url,
  ).href;
  const phosphorBoldFontUrl = new URL(
    "@phosphor-icons/web/bold/Phosphor-Bold.woff2",
    import.meta.url,
  ).href;
  const phosphorFillFontUrl = new URL(
    "@phosphor-icons/web/fill/Phosphor-Fill.woff2",
    import.meta.url,
  ).href;
  const phosphorDuotoneFontUrl = new URL(
    "@phosphor-icons/web/duotone/Phosphor-Duotone.woff2",
    import.meta.url,
  ).href;

  type CanvasContext =
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D;

  const PRINTER_SERVICE_UUID = "0000ff00-0000-1000-8000-00805f9b34fb";
  const PRINT_CHARACTERISTIC_UUID = "0000ff02-0000-1000-8000-00805f9b34fb";

  // Dimensions in mm (loaded from localStorage)
  let label_width_mm = $state(
    parseFloat(localStorage.getItem("label_width_mm") || "40"),
  );
  let label_height_mm = $state(
    parseFloat(localStorage.getItem("label_height_mm") || "12"),
  );
  let margin_height_mm = $state(
    parseFloat(localStorage.getItem("margin_height_mm") || "1"),
  );
  let margin_width_mm = $state(
    parseFloat(localStorage.getItem("margin_mm") || "1"),
  );

  // Width and height in 0.125 mm units (derived, rounded to integers)
  let label_width = $derived(Math.round(label_width_mm * 8));
  let label_height = $derived(Math.round(label_height_mm * 8));
  let margin_x = $derived(Math.round(margin_width_mm * 8));
  let margin_y = $derived(Math.round(margin_height_mm * 8));
  let text = $state(sessionStorage.getItem("text") || "");
  let textarea: HTMLTextAreaElement | undefined = $state();
  let printer_device: BluetoothDevice | undefined = $state();

  // Font size settings (loaded from localStorage)
  let auto_font_size = $state(
    localStorage.getItem("auto_font_size") !== "false",
  );
  let font_size = $state(parseFloat(localStorage.getItem("font_size") || "48"));
  let reverse_print = $state(localStorage.getItem("reverse_print") === "true");

  // Number inputs bind null while cleared mid-edit; keep the last saved value then.
  function saveNumber(key: string, value: number | null) {
    if (value !== null) localStorage.setItem(key, value.toString());
  }

  // Save to localStorage
  $effect(() => {
    saveNumber("label_width_mm", label_width_mm);
    saveNumber("label_height_mm", label_height_mm);
    saveNumber("margin_mm", margin_width_mm);
    saveNumber("margin_height_mm", margin_height_mm);
  });

  // Save font settings to localStorage
  $effect(() => {
    localStorage.setItem("auto_font_size", auto_font_size.toString());
    saveNumber("font_size", font_size);
    localStorage.setItem("reverse_print", reverse_print.toString());
  });

  // Save text to sessionStorage
  $effect(() => {
    sessionStorage.setItem("text", text);
  });
  let canvas: HTMLCanvasElement | undefined = $state();
  let pixelData = new Uint8Array();

  function renderLine(
    ctx: CanvasContext,
    line: string,
    size: number,
    render_fn: (
      str: string,
      vectorIcon?: LucideIcon | TablerIcon | HeroIcon | IonIcon | SimpleIcon | DevIcon,
      size?: number,
    ) => void,
  ) {
    type ParsedTag = {
      pos: number;
      type: string;
      end?: number;
      icon?: string;
    };

    // Split line into components:
    const match_bold = /(?<!\*)\*(?! )([^*]*?[^* ]\*)/g;
    const match_italic = /(?<!_)_(?! )([^_]*?[^_ ]_)/g;
    const match_barcode = /\[\|.*?\|\]/g;
    const match_font_awesome = /\{fa:(?:(?:solid|regular|brands):)?[a-z0-9-]+\}/g;
    const match_material_icons = /\{mi:(?:(?:filled|outlined|round|sharp|two-tone):)?[a-z0-9_]+\}/g;
    const match_lucide_icons = /\{lu:[a-z0-9-]+\}/g;
    const match_remix_icons = /\{ri:[a-z0-9-]+\}/g;
    const match_box_icons = /\{bx:(?:bx|bxs|bxl)-[a-z0-9-]+\}/g;
    const match_tabler_icons = /\{ti:(?:(?:outline|filled):)?[a-z0-9-]+\}/g;
    const match_bootstrap_icons = /\{bi:[a-z0-9-]+\}/g;
    const match_hero_icons = /\{hi:(?:(?:outline|solid):)?[a-z0-9-]+\}/g;
    const match_phosphor_icons = /\{ph:(?:(?:thin|light|regular|bold|fill|duotone):)?[a-z0-9-]+\}/g;
    const match_ion_icons = /\{io:[a-z0-9-]+\}/g;
    const match_simple_icons = /\{si:[a-z0-9]+\}/g;
    const match_dev_icons = /\{dv:(?:(?:plain|line):)?[a-z0-9-]+\}/g;
    const match_big = /\^\^.*?\^\^/g;
    const match_small = /__.*?__/g;

    const parsed: ParsedTag[] = [];

    // Start by matching "barcode" tags to avoid matching inside
    var clean_line = line;
    for (const m of clean_line.matchAll(match_barcode)) {
      // Add to parsed array
      const start = m.index;
      const end = m.index + m[0].length;
      parsed.push({ pos: start, type: "barcode" });
      parsed.push({ pos: end - 2, type: "barcode end" });
      clean_line =
        clean_line.substring(0, start) +
        "\n".repeat(m[0].length) +
        clean_line.substring(end);
    }

    for (const m of clean_line.matchAll(match_font_awesome)) {
      const start = m.index;
      const end = start + m[0].length;
      parsed.push({
        pos: start,
        type: "font awesome",
        end,
        icon: m[0].slice(4, -1),
      });
      clean_line =
        clean_line.substring(0, start) +
        "\n".repeat(m[0].length) +
        clean_line.substring(end);
    }

    for (const m of clean_line.matchAll(match_material_icons)) {
      const start = m.index;
      const end = start + m[0].length;
      parsed.push({
        pos: start,
        type: "material icon",
        end,
        icon: m[0].slice(4, -1),
      });
      clean_line =
        clean_line.substring(0, start) +
        "\n".repeat(m[0].length) +
        clean_line.substring(end);
    }

    for (const m of clean_line.matchAll(match_lucide_icons)) {
      const start = m.index;
      const end = start + m[0].length;
      parsed.push({
        pos: start,
        type: "lucide icon",
        end,
        icon: m[0].slice(4, -1),
      });
      clean_line =
        clean_line.substring(0, start) +
        "\n".repeat(m[0].length) +
        clean_line.substring(end);
    }

    for (const m of clean_line.matchAll(match_remix_icons)) {
      const start = m.index;
      const end = start + m[0].length;
      parsed.push({
        pos: start,
        type: "remix icon",
        end,
        icon: m[0].slice(4, -1),
      });
      clean_line =
        clean_line.substring(0, start) +
        "\n".repeat(m[0].length) +
        clean_line.substring(end);
    }

    for (const m of clean_line.matchAll(match_box_icons)) {
      const start = m.index;
      const end = start + m[0].length;
      parsed.push({
        pos: start,
        type: "box icon",
        end,
        icon: m[0].slice(4, -1),
      });
      clean_line =
        clean_line.substring(0, start) +
        "\n".repeat(m[0].length) +
        clean_line.substring(end);
    }

    for (const m of clean_line.matchAll(match_tabler_icons)) {
      const start = m.index;
      const end = start + m[0].length;
      parsed.push({
        pos: start,
        type: "tabler icon",
        end,
        icon: m[0].slice(4, -1),
      });
      clean_line =
        clean_line.substring(0, start) +
        "\n".repeat(m[0].length) +
        clean_line.substring(end);
    }

    for (const m of clean_line.matchAll(match_bootstrap_icons)) {
      const start = m.index;
      const end = start + m[0].length;
      parsed.push({
        pos: start,
        type: "bootstrap icon",
        end,
        icon: m[0].slice(4, -1),
      });
      clean_line =
        clean_line.substring(0, start) +
        "\n".repeat(m[0].length) +
        clean_line.substring(end);
    }

    for (const m of clean_line.matchAll(match_hero_icons)) {
      const start = m.index;
      const end = start + m[0].length;
      parsed.push({
        pos: start,
        type: "hero icon",
        end,
        icon: m[0].slice(4, -1),
      });
      clean_line =
        clean_line.substring(0, start) +
        "\n".repeat(m[0].length) +
        clean_line.substring(end);
    }

    for (const m of clean_line.matchAll(match_phosphor_icons)) {
      const start = m.index;
      const end = start + m[0].length;
      parsed.push({
        pos: start,
        type: "phosphor icon",
        end,
        icon: m[0].slice(4, -1),
      });
      clean_line =
        clean_line.substring(0, start) +
        "\n".repeat(m[0].length) +
        clean_line.substring(end);
    }

    for (const m of clean_line.matchAll(match_ion_icons)) {
      const start = m.index;
      const end = start + m[0].length;
      parsed.push({
        pos: start,
        type: "ion icon",
        end,
        icon: m[0].slice(4, -1),
      });
      clean_line =
        clean_line.substring(0, start) +
        "\n".repeat(m[0].length) +
        clean_line.substring(end);
    }
    for (const m of clean_line.matchAll(match_simple_icons)) {
      const start = m.index;
      const end = start + m[0].length;
      parsed.push({
        pos: start,
        type: "simple icon",
        end,
        icon: m[0].slice(4, -1),
      });
      clean_line =
        clean_line.substring(0, start) +
        "\n".repeat(m[0].length) +
        clean_line.substring(end);
    }
    for (const m of clean_line.matchAll(match_dev_icons)) {
      const start = m.index;
      const end = start + m[0].length;
      parsed.push({
        pos: start,
        type: "dev icon",
        end,
        icon: m[0].slice(4, -1),
      });
      clean_line =
        clean_line.substring(0, start) +
        "\n".repeat(m[0].length) +
        clean_line.substring(end);
    }

    // Now, add all matches
    const add = (type: string, regex: RegExp, ln: number) => {
      for (const m of clean_line.matchAll(regex)) {
        const start = m.index;
        const end = m.index + m[0].length;
        parsed.push({ pos: start, type });
        parsed.push({ pos: end - ln, type: type + " end" });
      }
    };

    add("big", match_big, 2);
    add("small", match_small, 2);
    add("bold", match_bold, 1);
    add("italic", match_italic, 1);

    // Add a last tag at string end
    parsed.push({ pos: line.length, type: "" });

    // Sort tags
    const tags = parsed.sort((a, b) => a.pos - b.pos);

    // Now, process the line keeping the state of the font
    var pos = 0;
    var current_font = { size, name: "sans", italic: false, bold: false };
    const font_stack: (typeof current_font)[] = [];
    const make_font = (f: typeof current_font) => {
      if (f.name.search(" "))
        return `${f.italic ? "italic" : ""} ${f.bold ? "bold" : ""} ${f.size}px "${f.name}"`;
      else
        return `${f.italic ? "italic" : ""} ${f.bold ? "bold" : ""} ${f.size}px ${f.name}`;
    };
    for (const tag of tags) {
      if (tag.pos > pos) {
        // Add current string
        ctx.font = make_font(current_font);
        render_fn(line.substring(pos, tag.pos));
      }
      // Modify font
      switch (tag.type) {
        case "bold":
          current_font.bold = true;
          pos = tag.pos + 1;
          break;
        case "italic":
          current_font.italic = true;
          pos = tag.pos + 1;
          break;
        case "big":
          current_font.size *= 3.0 / 2.0;
          pos = tag.pos + 2;
          break;
        case "small":
          current_font.size *= 2.0 / 3.0;
          pos = tag.pos + 2;
          break;
        case "bold end":
          current_font.bold = false;
          pos = tag.pos + 1;
          break;
        case "italic end":
          current_font.italic = false;
          pos = tag.pos + 1;
          break;
        case "big end":
          current_font.size *= 2.0 / 3.0;
          pos = tag.pos + 2;
          break;
        case "small end":
          current_font.size *= 3.0 / 2.0;
          pos = tag.pos + 2;
          break;
        case "barcode":
          font_stack.push(current_font);
          current_font.bold = current_font.italic = false;
          current_font.name = "Libre Barcode 39";
          pos = tag.pos + 2;
          break;
        case "barcode end":
          const s = font_stack.pop();
          if (s) current_font = s;
          pos = tag.pos + 2;
          break;
        case "font awesome": {
          const icon = tag.icon ? fontAwesomeIconMap.get(tag.icon) : undefined;
          if (icon) {
            ctx.font = `${icon.fontWeight} ${current_font.size}px "${icon.fontFamily}"`;
            render_fn(icon.unicode);
          } else if (tag.end !== undefined) {
            ctx.font = make_font(current_font);
            render_fn(line.substring(tag.pos, tag.end));
          }
          pos = tag.end ?? tag.pos;
          break;
        }
        case "material icon": {
          const icon = tag.icon ? materialIconMap.get(tag.icon) : undefined;
          if (icon) {
            ctx.font = `${current_font.size}px "${icon.fontFamily}"`;
            render_fn(icon.name);
          } else if (tag.end !== undefined) {
            ctx.font = make_font(current_font);
            render_fn(line.substring(tag.pos, tag.end));
          }
          pos = tag.end ?? tag.pos;
          break;
        }
        case "lucide icon": {
          const icon = tag.icon ? lucideIconMap.get(tag.icon) : undefined;
          if (icon) {
            render_fn("", icon, current_font.size);
          } else if (tag.end !== undefined) {
            ctx.font = make_font(current_font);
            render_fn(line.substring(tag.pos, tag.end));
          }
          pos = tag.end ?? tag.pos;
          break;
        }
        case "remix icon": {
          const icon = tag.icon ? remixIconMap.get(tag.icon) : undefined;
          if (icon) {
            ctx.font = `${current_font.size}px "remixicon"`;
            render_fn(icon.unicode);
          } else if (tag.end !== undefined) {
            ctx.font = make_font(current_font);
            render_fn(line.substring(tag.pos, tag.end));
          }
          pos = tag.end ?? tag.pos;
          break;
        }
        case "box icon": {
          const icon = tag.icon ? boxIconMap.get(tag.icon) : undefined;
          if (icon) {
            ctx.font = `${current_font.size}px "boxicons"`;
            render_fn(icon.unicode);
          } else if (tag.end !== undefined) {
            ctx.font = make_font(current_font);
            render_fn(line.substring(tag.pos, tag.end));
          }
          pos = tag.end ?? tag.pos;
          break;
        }
        case "tabler icon": {
          const icon = tag.icon ? tablerIconMap.get(tag.icon) : undefined;
          if (icon) {
            render_fn("", icon, current_font.size);
          } else if (tag.end !== undefined) {
            ctx.font = make_font(current_font);
            render_fn(line.substring(tag.pos, tag.end));
          }
          pos = tag.end ?? tag.pos;
          break;
        }
        case "bootstrap icon": {
          const icon = tag.icon ? bootstrapIconMap.get(tag.icon) : undefined;
          if (icon) {
            ctx.font = `${current_font.size}px "bootstrap-icons"`;
            render_fn(icon.unicode);
          } else if (tag.end !== undefined) {
            ctx.font = make_font(current_font);
            render_fn(line.substring(tag.pos, tag.end));
          }
          pos = tag.end ?? tag.pos;
          break;
        }
        case "hero icon": {
          const icon = tag.icon ? heroIconMap.get(tag.icon) : undefined;
          if (icon) {
            render_fn("", icon, current_font.size);
          } else if (tag.end !== undefined) {
            ctx.font = make_font(current_font);
            render_fn(line.substring(tag.pos, tag.end));
          }
          pos = tag.end ?? tag.pos;
          break;
        }
        case "phosphor icon": {
          const icon = tag.icon ? phosphorIconMap.get(tag.icon) : undefined;
          if (icon) {
            ctx.font = `${current_font.size}px "${icon.fontFamily}"`;
            render_fn(icon.unicode);
          } else if (tag.end !== undefined) {
            ctx.font = make_font(current_font);
            render_fn(line.substring(tag.pos, tag.end));
          }
          pos = tag.end ?? tag.pos;
          break;
        }
        case "ion icon": {
          const icon = tag.icon ? ionIconMap.get(tag.icon) : undefined;
          if (icon) {
            render_fn("", icon, current_font.size);
          } else if (tag.end !== undefined) {
            ctx.font = make_font(current_font);
            render_fn(line.substring(tag.pos, tag.end));
          }
          pos = tag.end ?? tag.pos;
          break;
        }
        case "simple icon": {
          const icon = tag.icon ? simpleIconMap.get(tag.icon) : undefined;
          if (icon) {
            render_fn("", icon, current_font.size);
          } else if (tag.end !== undefined) {
            ctx.font = make_font(current_font);
            render_fn(line.substring(tag.pos, tag.end));
          }
          pos = tag.end ?? tag.pos;
          break;
        }
        case "dev icon": {
          const icon = tag.icon ? devIconMap.get(tag.icon) : undefined;
          if (icon) {
            render_fn("", icon, current_font.size);
          } else if (tag.end !== undefined) {
            ctx.font = make_font(current_font);
            render_fn(line.substring(tag.pos, tag.end));
          }
          pos = tag.end ?? tag.pos;
          break;
        }
      }
    }
  }

  function measureLine(ctx: CanvasContext, line: string, size: number) {
    // To properly measure, we need to return:
    //  - Right as the first actualBoundingBoxRight;
    //  - Left as the sum of all the widths minus the last width and plus the last actualBoundingBoxLeft.

    var first = true;
    var right = 0;
    var left = 0;
    var ascent = 0;
    var descent = 0;
    let lastRightAdjustment = 0;
    renderLine(ctx, line, size, (str, vectorIcon, iconSize = size) => {
      if (vectorIcon) {
        if (first) {
          ascent = iconSize;
          descent = 0;
          left = 0;
          right = iconSize;
          first = false;
        } else {
          ascent = Math.max(ascent, iconSize);
          right += iconSize;
        }
        lastRightAdjustment = 0;
        return;
      }

      const m = ctx.measureText(str);
      if (first) {
        ascent = m.actualBoundingBoxAscent;
        descent = m.actualBoundingBoxDescent;
        left = m.actualBoundingBoxLeft;
        right = m.width;
        first = false;
      } else {
        ascent = Math.max(ascent, m.actualBoundingBoxAscent);
        descent = Math.max(descent, m.actualBoundingBoxDescent);
        right += m.width;
      }
      lastRightAdjustment = m.actualBoundingBoxRight - m.width;
    });
    right += lastRightAdjustment;
    return { right, left, ascent, descent };
  }

  function drawVectorIcon(
    ctx: CanvasContext,
    icon: LucideIcon | TablerIcon | HeroIcon | IonIcon | SimpleIcon | DevIcon,
    x: number,
    baseline: number,
    size: number,
  ) {
    const n = (value: string | number | undefined, fallback = 0) => {
      if (value === undefined) return fallback;
      const parsed = typeof value === "number" ? value : parseFloat(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const points = (value: string | number | undefined) =>
      String(value ?? "")
        .trim()
        .split(/\s+/)
        .map((point) => point.split(",").map(Number))
        .filter((point) => point.length === 2 && point.every(Number.isFinite));

    ctx.save();
    ctx.translate(x, baseline - size);
    const viewBoxSize = "viewBoxSize" in icon ? icon.viewBoxSize : 24;
    ctx.scale(size / viewBoxSize, size / viewBoxSize);
    const filled =
      "style" in icon &&
      ["filled", "solid", "plain", "line"].includes(icon.style);
    ctx.fillStyle = filled ? "#000" : "transparent";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = viewBoxSize === 512 ? 32 : 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const [tag, attrs] of icon.node) {
      const fillNone = String(attrs.class ?? "").includes("ionicon-fill-none");
      const shouldFill = filled && !fillNone;
      ctx.lineWidth = n(attrs["stroke-width"], viewBoxSize === 512 ? 32 : 2);
      ctx.beginPath();
      switch (tag) {
        case "path":
          if (attrs.d !== undefined) {
            const path = new Path2D(String(attrs.d));
            if (shouldFill) {
              const fillRule = attrs["fill-rule"] === "evenodd" ? "evenodd" : "nonzero";
              ctx.fill(path, fillRule);
            }
            else ctx.stroke(path);
          }
          break;
        case "line":
          ctx.moveTo(n(attrs.x1), n(attrs.y1));
          ctx.lineTo(n(attrs.x2), n(attrs.y2));
          ctx.stroke();
          break;
        case "circle":
          ctx.arc(n(attrs.cx), n(attrs.cy), n(attrs.r), 0, Math.PI * 2);
          if (shouldFill) ctx.fill();
          else ctx.stroke();
          break;
        case "ellipse":
          ctx.ellipse(
            n(attrs.cx),
            n(attrs.cy),
            n(attrs.rx),
            n(attrs.ry),
            0,
            0,
            Math.PI * 2,
          );
          if (shouldFill) ctx.fill();
          else ctx.stroke();
          break;
        case "rect": {
          const rx = n(attrs.rx);
          if (rx && "roundRect" in ctx) {
            ctx.roundRect(
              n(attrs.x),
              n(attrs.y),
              n(attrs.width),
              n(attrs.height),
              rx,
            );
          } else {
            ctx.rect(n(attrs.x), n(attrs.y), n(attrs.width), n(attrs.height));
          }
          if (shouldFill) ctx.fill();
          else ctx.stroke();
          break;
        }
        case "polyline":
        case "polygon": {
          const pts = points(attrs.points);
          if (!pts.length) break;
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (const point of pts.slice(1)) ctx.lineTo(point[0], point[1]);
          if (tag === "polygon") ctx.closePath();
          if (shouldFill) ctx.fill();
          else ctx.stroke();
          break;
        }
      }
    }
    ctx.restore();
  }

  function fullSize(ctx: CanvasContext, lines: string[], sz: number) {
    const line_hg = Math.round((sz * 7) / 6);
    var wd = 0;
    var total_hg = 0;
    // Get all lines
    for (var i = 0; i < lines.length; i++) {
      const m = measureLine(ctx, lines[i], sz);
      wd = Math.max(wd, m.right + m.left);
      total_hg += i == 0 ? m.ascent : line_hg;
      if (i == lines.length - 1) {
        total_hg += m.descent;
      }
    }
    return { wd, line_hg, total_hg };
  }

  function bestSize(
    ctx: CanvasContext,
    lines: string[],
    min_size = 8,
    max_size = 144,
  ) {
    var wd = ctx.canvas.width - margin_x * 2;
    var hg = ctx.canvas.height - margin_y * 2;

    while (min_size + 0.1 < max_size) {
      var size = (min_size + max_size) / 2;
      var s = fullSize(ctx, lines, size);
      if (s.wd >= wd || s.total_hg >= hg) {
        max_size = size;
      } else {
        min_size = size;
      }
    }
    return min_size;
  }

  function drawText(ctx: CanvasContext, text: string) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, label_width, label_height);

    // Draw text lines:
    const lines = text.split("\n");
    const sz = auto_font_size ? bestSize(ctx, lines) : font_size;
    const font_sz = fullSize(ctx, lines, sz);

    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#000";
    var y = (label_height - font_sz.total_hg) / 2;
    for (var i = 0; i < lines.length; i++) {
      const line = lines[i];

      // We have to render twice, once to measure, another to draw
      const m = measureLine(ctx, line, sz);

      const line_wd = m.right + m.left;
      var x = (label_width - line_wd) / 2 + m.left;
      y += i ? font_sz.line_hg : m.ascent;

      renderLine(ctx, lines[i], sz, (str, vectorIcon, iconSize = sz) => {
        if (vectorIcon) {
          drawVectorIcon(ctx, vectorIcon, x, y, iconSize);
          x += iconSize;
          return;
        }

        const m = ctx.measureText(str);
        ctx.fillText(str, x, y);
        x += m.width;
      });
    }
  }

  function convertToData(ctx: CanvasContext) {
    // Get image data
    const imageData = ctx.getImageData(0, 0, label_width, label_height);

    // Dither pattern
    const dither = (x: number, y: number) => {
      const pattern = [
        [24, 406, 120, 502],
        [598, 215, 693, 311],
        [167, 550, 72, 454],
        [741, 359, 645, 263],
      ];
      const p = label_width - x - 1 + y * label_width;
      const val =
        imageData.data[4 * p + 0] + // red
        imageData.data[4 * p + 1] + // green
        imageData.data[4 * p + 2]; // blue
      return val > pattern[x % 4][y % 4] ? 0 : 1;
    };

    const inkMask = reverse_print
      ? new Uint8Array(label_width * label_height)
      : undefined;
    const reverseMask = reverse_print
      ? new Uint8Array(label_width * label_height)
      : undefined;

    if (inkMask && reverseMask) {
      const reverse_padding = 14;
      const reverse_padding_squared = reverse_padding * reverse_padding;

      for (let y = 0; y < label_height; y++) {
        for (let x = 0; x < label_width; x++) {
          const idx = x + y * label_width;
          const bit = dither(x, y);
          inkMask[idx] = bit;
          if (!bit) continue;

          for (let dy = -reverse_padding; dy <= reverse_padding; dy++) {
            const yy = y + dy;
            if (yy < 0 || yy >= label_height) continue;

            for (let dx = -reverse_padding; dx <= reverse_padding; dx++) {
              const xx = x + dx;
              if (xx < 0 || xx >= label_width) continue;
              if (dx * dx + dy * dy > reverse_padding_squared) continue;

              reverseMask[xx + yy * label_width] = 1;
            }
          }
        }
      }
    }

    const printBit = (x: number, y: number) => {
      if (y >= label_height) return 0;
      if (!inkMask || !reverseMask) return dither(x, y);

      const idx = x + y * label_width;
      if (!reverseMask[idx]) return 0;
      return inkMask[idx] ? 0 : 1;
    };

    // Dither to binary image data, in the printer format
    const rows = Math.floor((label_height + 7) / 8);
    const pixels = new Uint8Array(rows * label_width);
    for (let x = 0, pos = 0; x < label_width; x++) {
      for (let y = 0; y < label_height; y += 8) {
        const val =
          printBit(x, y) * 128 +
          printBit(x, y + 1) * 64 +
          printBit(x, y + 2) * 32 +
          printBit(x, y + 3) * 16 +
          printBit(x, y + 4) * 8 +
          printBit(x, y + 5) * 4 +
          printBit(x, y + 6) * 2 +
          printBit(x, y + 7);
        pixels[pos] = val;
        pos++;
      }
    }

    return pixels;
  }

  function draw() {
    // Skip while a dimension input is cleared or invalid mid-edit.
    if (!canvas || !(label_width > 0 && label_height > 0)) return;

    const offscreenCanvas = new OffscreenCanvas(label_width, label_height);
    const off_ctx = offscreenCanvas.getContext("2d");
    if (!off_ctx) return;

    drawText(off_ctx, text);
    pixelData = convertToData(off_ctx);

    // Convert back to image data for preview
    const img = new ImageData(label_width, label_height);

    const setPix = (x: number, y: number, v: number) => {
      const p = v ? 0 : 255;
      const t = label_width - 1 - x + y * label_width;
      img.data[t * 4 + 0] = p;
      img.data[t * 4 + 1] = p;
      img.data[t * 4 + 2] = p;
      img.data[t * 4 + 3] = 255;
    };

    for (let x = 0, pos = 0; x < label_width; x++) {
      for (let y = 0; y < label_height; y += 8) {
        const val = pixelData[pos];
        setPix(x, y + 0, val & 128);
        setPix(x, y + 1, val & 64);
        setPix(x, y + 2, val & 32);
        setPix(x, y + 3, val & 16);
        setPix(x, y + 4, val & 8);
        setPix(x, y + 5, val & 4);
        setPix(x, y + 6, val & 2);
        setPix(x, y + 7, val & 1);
        pos++;
      }
    }

    // Copy to preview canvas
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.putImageData(img, 0, 0);
  }

  $effect(() => {
    draw();
  });

  onMount(() => {
    // Force loading of fonts at start, so the canvas renderer can measure them.
    const fonts = [
      new FontFace(
        "Libre Barcode 39",
        "url('fonts/LibreBarcode39Text-Regular.ttf')",
      ),
      new FontFace(
        "Font Awesome 7 Free",
        `url("${fontAwesomeSolidFontUrl}")`,
        { weight: "900" },
      ),
      new FontFace(
        "Font Awesome 7 Free",
        `url("${fontAwesomeRegularFontUrl}")`,
        { weight: "400" },
      ),
      new FontFace(
        "Font Awesome 7 Brands",
        `url("${fontAwesomeBrandsFontUrl}")`,
        { weight: "400" },
      ),
      new FontFace("Material Icons", `url("${materialIconsFontUrl}")`),
      new FontFace(
        "Material Icons Outlined",
        `url("${materialIconsOutlinedFontUrl}")`,
      ),
      new FontFace(
        "Material Icons Round",
        `url("${materialIconsRoundFontUrl}")`,
      ),
      new FontFace(
        "Material Icons Sharp",
        `url("${materialIconsSharpFontUrl}")`,
      ),
      new FontFace(
        "Material Icons Two Tone",
        `url("${materialIconsTwoToneFontUrl}")`,
      ),
      new FontFace("remixicon", `url("${remixIconFontUrl}")`),
      new FontFace("boxicons", `url("${boxIconFontUrl}")`),
      new FontFace("bootstrap-icons", `url("${bootstrapIconFontUrl}")`),
      new FontFace("Phosphor-Thin", `url("${phosphorThinFontUrl}")`),
      new FontFace("Phosphor-Light", `url("${phosphorLightFontUrl}")`),
      new FontFace("Phosphor", `url("${phosphorRegularFontUrl}")`),
      new FontFace("Phosphor-Bold", `url("${phosphorBoldFontUrl}")`),
      new FontFace("Phosphor-Fill", `url("${phosphorFillFontUrl}")`),
      new FontFace("Phosphor-Duotone", `url("${phosphorDuotoneFontUrl}")`),
    ];
    for (const font of fonts) document.fonts.add(font);
    Promise.all(fonts.map((font) => font.load())).then(() => {
      draw();
    });
  });

  async function requestPrinterDevice() {
    printer_device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [PRINTER_SERVICE_UUID] },
          { services: ["00001110-0000-1000-8000-00805f9b34fb"] },
          { services: ["0000af30-0000-1000-8000-00805f9b34fb"] },
        ],
        optionalServices: [PRINTER_SERVICE_UUID],
      });
      return printer_device;
  }

  async function getPrintCharacteristic() {
    const device = printer_device ?? (await requestPrinterDevice());
    const server = device.gatt?.connected
      ? device.gatt
      : await device.gatt?.connect();
    if (!server) throw new Error("Could not connect to the printer");

    const service = await server.getPrimaryService(PRINTER_SERVICE_UUID);
    return service.getCharacteristic(PRINT_CHARACTERISTIC_UUID);
  }

  async function getReusablePrintCharacteristic() {
    const had_saved_device = Boolean(printer_device);
    try {
      return await getPrintCharacteristic();
    } catch (err) {
      if (!had_saved_device) throw err;
      console.log(`Saved printer connection failed, choosing again: ${err}`);
      printer_device = undefined;
      return getPrintCharacteristic();
    }
  }

  async function printLabel() {
    try {
      const characteristic = await getReusablePrintCharacteristic();

      // Ok, will print our data
      const bytes_height = Math.floor((label_height + 7) / 8);
      // ESC/POS reference:
      //   https://download4.epson.biz/sec_pubs/pos/reference_en/escpos/commands.html
      const header = new Uint8Array([
        0x1b, // ESC @ : initialize printer
        0x40,
        0x1d, // GS v 0 : Print raster image
        0x76,
        0x30,
        0x00, // normal image
        bytes_height % 256, // bytes in horizontal direction
        Math.floor(bytes_height / 256),
        label_width % 256, // lines in vertical direction
        Math.floor(label_width / 256),
      ]);
      // ESC d 00 : Print and feed 0 lines.
      const footer = new Uint8Array([0x1b, 0x64, 0x00]);

      await characteristic.writeValueWithResponse(header);
      for (let i = 0; i < pixelData.length; i += 128) {
        const buf = pixelData.slice(i, i + 128);
        // TODO: last packet should be padded??
        await characteristic.writeValueWithoutResponse(buf);
      }
      await characteristic.writeValueWithResponse(footer);
    } catch (err) {
      console.log(`Error printing: ${err}`);
    }
  }

  async function insertText(str: string) {
    if (!textarea) return;
    const pos0 = textarea.selectionStart ?? 0;
    const pos1 = textarea.selectionEnd ?? 0;
    text = text.substring(0, pos1) + str + text.substring(pos1);
    await settled();
    textarea.setSelectionRange(pos0, pos1 + str.length);
    textarea.focus();
  }

  async function setAttribute(attr1: string, attr2 = attr1) {
    if (!textarea) return;
    let pos0 = textarea.selectionStart ?? 0;
    let pos1 = textarea.selectionEnd ?? 0;
    const sel = text.substring(pos0, pos1);

    // Check if selection already has attribute
    if (sel.startsWith(attr1) && sel.endsWith(attr2)) {
      text =
        text.substring(0, pos0) +
        sel.substring(attr1.length, sel.length - attr2.length) +
        text.substring(pos1);
      pos1 = pos1 - attr1.length - attr2.length;
    } else {
      text =
        text.substring(0, pos0) + attr1 + sel + attr2 + text.substring(pos1);
      pos1 = pos1 + attr1.length + attr2.length;
    }
    await settled();
    textarea.setSelectionRange(pos0, pos1);
    textarea.focus();
  }
</script>

<main>
  <h1>LabelForge</h1>
  <div class="r">
    <div class="editor">
      <div class="editor-card">
        <div class="config" role="group" aria-label="Label settings">
          <div class="group">
            <label title="Label width (mm)">
              Dimensions
              <input
                type="number"
                bind:value={label_width_mm}
                min="1"
                max="150"
                step="0.1"
              />
            </label>
            <label title="Label height (mm)">
              ×
              <input
                type="number"
                bind:value={label_height_mm}
                min="1"
                max="18"
                step="0.1"
              />
            </label>
            <span>mm</span>
          </div>
          <div class="group">
            <label title="Margin width (mm)">
              Margin
              <input
                type="number"
                bind:value={margin_width_mm}
                min="0"
                max="10"
                step="0.1"
              />
            </label>
            <label title="Margin height (mm)">
              ×
              <input
                type="number"
                bind:value={margin_height_mm}
                min="0"
                max="10"
                step="0.1"
              />
            </label>
            <span>mm</span>
          </div>
          <div class="group">
            <label>
              <input type="checkbox" bind:checked={auto_font_size} />
              Auto size
            </label>
            <label>
              <input type="checkbox" bind:checked={reverse_print} />
              Reverse
            </label>
          </div>
          <div class="group">
            {#if !auto_font_size}
              <label title="Font size (px)">
                Size
                <input
                  type="number"
                  bind:value={font_size}
                  min="8"
                  max="144"
                  step="1"
                />
              </label>
            {/if}
          </div>
        </div>
        <div class="bar">
          <button
            onclick={() => setAttribute("*")}
            class="bold"
            aria-label="Bold Text"
          >
          </button>
          <button
            onclick={() => setAttribute("_")}
            class="italic"
            aria-label="Italic Text"
          >
          </button>
          <button
            onclick={() => setAttribute("__", "__")}
            class="fnt-small"
            aria-label="Smaller Font"
          >
          </button>
          <button
            onclick={() => setAttribute("^^", "^^")}
            class="fnt-big"
            aria-label="Bigger Font"
          >
          </button>
          <button
            onclick={() => setAttribute("[|", "|]")}
            class="barcode"
            aria-label="Barcode"
          >
          </button>
        </div>
        <textarea
          bind:this={textarea}
          bind:value={text}
          placeholder="Write text here..."
        ></textarea>
      </div>
      <section class="asset-picker" aria-label="Emoji and icon picker">
        <IconPicker onselect={insertText} />
      </section>
    </div>
    <aside class="side-panel">
      <div class="l">
        <canvas bind:this={canvas} width={label_width} height={label_height}>
        </canvas>
        <span>
          Label size:
          {(label_width * 0.125).toFixed(1)}
          ×
          {(label_height * 0.125).toFixed(1)}
          mm
        </span>
        <span>
          Margin:
          {(margin_x * 0.125).toFixed(1)}
          ×
          {(margin_y * 0.125).toFixed(1)}
          mm
        </span>
      </div>
      <button class="print-button" onclick={printLabel}>Print Label</button>
    </aside>
  </div>
</main>

<style>
  main {
    --container-width: 1400px;
    --gutter: 1.5rem;

    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #f1f3f4;
  }

  h1 {
    flex: none;
    box-sizing: border-box;
    height: 4rem;
    margin: 0;
    /* Align the title with the centered content below. */
    padding: 0.75rem max(var(--gutter), (100% - var(--container-width)) / 2 + var(--gutter)) 0.25rem;
    border-bottom: 1px solid #dadce0;
    background: #fff;
    color: #3c4043;
    font-size: 1.25rem;
    font-weight: 400;
    line-height: 1.2;
  }

  h1::after {
    content: "Web Bluetooth label editor";
    display: block;
    margin-top: 0.15rem;
    color: #5f6368;
    font-size: 0.75rem;
  }

  div.r {
    display: grid;
    flex: 1;
    grid-template-columns: minmax(0, 1fr) clamp(320px, 32vw, 560px);
    gap: 1.5rem;
    box-sizing: border-box;
    width: 100%;
    max-width: var(--container-width);
    min-height: 0;
    margin-inline: auto;
    padding: var(--gutter);
  }

  .editor {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 0;
  }

  .editor-card,
  .asset-picker,
  .l,
  .editor-card,
  .asset-picker,
  .l {
    box-sizing: border-box;
    overflow: hidden;
    border: 1px solid #dadce0;
    border-radius: 4px;
    background: #fff;
    box-shadow: 0 1px 2px rgb(60 64 67 / 0.16);
  }

  .editor-card {
    flex: none;
    transition: box-shadow 0.18s ease;
  }

  .editor-card:focus-within {
    box-shadow:
      0 0 0 1px #1a73e8,
      0 2px 3px rgb(60 64 67 / 0.3);
  }

  div.bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.125rem;
    padding: 0.25rem 0.5rem;
    border-bottom: 1px solid #e8eaed;
  }

  .asset-picker {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  .side-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 0;
    overflow-y: auto;
  }

  .l {
    flex: none;
    padding: 1rem;
  }

  .l::before {
    content: "Print preview";
    display: block;
    margin-bottom: 0.75rem;
    color: #3c4043;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .l > * {
    display: block;
    width: 100%;
  }

  .l span {
    margin-top: 0.35rem;
    color: #5f6368;
    font-size: 0.78rem;
    text-align: left;
  }

  textarea,
  button,
  canvas {
    box-sizing: border-box;
    border: 1px solid #dadce0;
    border-radius: 4px;
  }

  textarea {
    display: block;
    width: 100%;
    height: 7.5rem;
    min-height: 4rem;
    padding: 1rem 1.25rem;
    border: none;
    border-radius: 0;
    outline: none;
    background: #fff;
    color: #202124;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 1.05rem;
    line-height: 1.6;
    resize: vertical;
  }

  canvas {
    border: 1px solid #dadce0;
    border-radius: 4px;
    background: #fff;
    image-rendering: pixelated;
  }

  button {
    width: 100%;
    padding: 0.55rem 1rem;
    border: 1px solid #dadce0;
    border-radius: 4px;
    background-color: #fff;
    color: #3c4043;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 500;
    transition:
      background-color 0.18s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease;
  }

  .bar button:hover,
  button:hover {
    background-color: #f8fafd;
    box-shadow: 0 1px 2px rgb(60 64 67 / 0.3);
  }

  .print-button {
    flex: none;
    width: 100%;
    padding-block: 0.75rem;
    font-size: 1rem;
    border-color: #1a73e8;
    background: #1a73e8;
    color: #fff;
    box-shadow: 0 1px 2px rgb(26 115 232 / 0.35);
  }

  .print-button:hover {
    border-color: #185abc;
    background: #185abc;
    box-shadow: 0 2px 4px rgb(26 115 232 / 0.35);
  }

  .config {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 1.5rem;
    padding: 0.45rem 0.75rem;
    border-bottom: 1px solid #e8eaed;
    color: #5f6368;
    font-size: 0.8rem;
  }

  .config label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: #3c4043;
    font-weight: 500;
  }

  .config .group {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    white-space: nowrap;
  }

  .config input {
    box-sizing: border-box;
    width: 2.75rem;
    appearance: textfield;
    padding: 0.2rem 0.35rem;
    border: 1px solid #dadce0;
    border-radius: 3px;
    background: #fff;
    color: #202124;
    font: inherit;
    text-align: center;
  }

  .config input::-webkit-inner-spin-button {
    appearance: none;
  }

  .config input:focus {
    outline: 2px solid #d2e3fc;
    border-color: #1a73e8;
  }

  .config input[type="checkbox"] {
    width: auto;
    margin: 0;
  }

  .bar button {
    width: 1.75rem;
    height: 1.75rem;
    max-width: none;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 4px;
    background-color: transparent;
    background-position: center;
    background-repeat: no-repeat;
    background-size: 17px 17px;
    color: #3c4043;
  }

  .bar button:hover {
    border-color: transparent;
    background-color: #f1f3f4;
    box-shadow: none;
  }

  @media (max-width: 960px) {
    main {
      --gutter: 1rem;

      height: auto;
      min-height: 100vh;
    }

    /* One column: flatten both panels so the preview sits right under the editor. */
    div.r {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .editor,
    .side-panel {
      display: contents;
    }

    .l {
      order: 1;
    }

    .print-button {
      order: 2;
    }

    .asset-picker {
      flex: none;
      order: 3;
      height: 24rem;
    }
  }

  .italic {
    background: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWl0YWxpYy1pY29uIGx1Y2lkZS1pdGFsaWMiPjxsaW5lIHgxPSIxOSIgeDI9IjEwIiB5MT0iNCIgeTI9IjQiLz48bGluZSB4MT0iMTQiIHgyPSI1IiB5MT0iMjAiIHkyPSIyMCIvPjxsaW5lIHgxPSIxNSIgeDI9IjkiIHkxPSI0IiB5Mj0iMjAiLz48L3N2Zz4=")
      no-repeat;
  }
  .bold {
    background: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWJvbGQtaWNvbiBsdWNpZGUtYm9sZCI+PHBhdGggZD0iTTYgMTJoOWE0IDQgMCAwIDEgMCA4SDdhMSAxIDAgMCAxLTEtMVY1YTEgMSAwIDAgMSAxLTFoN2E0IDQgMCAwIDEgMCA4Ii8+PC9zdmc+")
      no-repeat;
  }
  .barcode {
    background: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWJhcmNvZGUtaWNvbiBsdWNpZGUtYmFyY29kZSI+PHBhdGggZD0iTTMgNXYxNCIvPjxwYXRoIGQ9Ik04IDV2MTQiLz48cGF0aCBkPSJNMTIgNXYxNCIvPjxwYXRoIGQ9Ik0xNyA1djE0Ii8+PHBhdGggZD0iTTIxIDV2MTQiLz48L3N2Zz4=")
      no-repeat;
  }
  .fnt-small {
    background: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWFhcnJvdy1kb3duLWljb24gbHVjaWRlLWEtYXJyb3ctZG93biI+PHBhdGggZD0ibTE0IDEyIDQgNCA0LTQiLz48cGF0aCBkPSJNMTggMTZWNyIvPjxwYXRoIGQ9Im0yIDE2IDQuMDM5LTkuNjlhLjUuNSAwIDAgMSAuOTIzIDBMMTEgMTYiLz48cGF0aCBkPSJNMy4zMDQgMTNoNi4zOTIiLz48L3N2Zz4=")
      no-repeat;
  }
  .fnt-big {
    background: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWFhcnJvdy11cC1pY29uIGx1Y2lkZS1hLWFycm93LXVwIj48cGF0aCBkPSJtMTQgMTEgNC00IDQgNCIvPjxwYXRoIGQ9Ik0xOCAxNlY3Ii8+PHBhdGggZD0ibTIgMTYgNC4wMzktOS42OWEuNS41IDAgMCAxIC45MjMgMEwxMSAxNiIvPjxwYXRoIGQ9Ik0zLjMwNCAxM2g2LjM5MiIvPjwvc3ZnPg==")
      no-repeat;
  }
</style>
