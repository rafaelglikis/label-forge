import emojiData from "virtual:emojis";
import { bootstrapIcons } from "./bootstrap-icons";
import { boxIcons } from "./boxicons";
import { customIcons } from "./custom-icons";
import { devIcons } from "./devicons";
import { fontAwesomeIcons } from "./font-awesome-icons";
import { heroIcons } from "./heroicons";
import { ionIcons } from "./ionicons";
import { lucideIcons } from "./lucide-icons";
import { materialIcons } from "./material-icons";
import { phosphorIcons } from "./phosphor-icons";
import { remixIcons } from "./remix-icons";
import { simpleIcons } from "./simple-icons";
import { tablerIcons } from "./tabler-icons";

export type IconNode = [
  tag: string,
  attrs: Record<string, string | number | undefined>,
][];

export type PickerGlyph =
  | {
      kind: "text";
      text: string;
      fontFamily?: string;
      fontWeight?: string;
    }
  | {
      kind: "svg";
      node: IconNode;
      viewBoxSize: number;
      // Top-left corner of the square viewBox; defaults to 0 0.
      viewBoxOrigin?: [number, number];
      // Picker CSS class describing how the SVG is painted.
      paint: "stroke" | "stroke-thin" | "fill" | "ion";
    };

export type PickerIcon = {
  insert: string;
  title: string;
  label: string;
  searchText: string;
  glyph: PickerGlyph;
};

export type IconPack = {
  id: string;
  title: string;
  icons: PickerIcon[];
};

type SourceIcon = {
  token: string;
  label: string;
  searchText: string;
  style?: string;
};

function pack<T extends SourceIcon>({
  id,
  title,
  prefix,
  icons,
  glyph,
}: {
  id: string;
  title: string;
  prefix: string;
  icons: T[];
  glyph: (icon: T) => PickerGlyph;
}): IconPack {
  return {
    id,
    title,
    icons: icons.map((icon) => ({
      insert: `{${prefix}:${icon.token}}`,
      title: icon.style !== undefined
        ? `${icon.label} (${icon.style})`
        : icon.label,
      label: icon.label.toLowerCase(),
      searchText: icon.searchText,
      glyph: glyph(icon),
    })),
  };
}

const emojiPack: IconPack = {
  id: "emoji",
  title: "Emoji",
  icons: emojiData.map((emoji) => ({
    insert: emoji.emoji,
    title: emoji.label,
    label: emoji.label.toLowerCase(),
    searchText: emoji.searchText,
    glyph: {
      kind: "text",
      text: emoji.emoji,
    },
  })),
};

export const iconPacks: IconPack[] = [
  emojiPack,
  pack({
    id: "custom",
    title: "Custom",
    prefix: "cu",
    // The style is always "filled", so leave it out of the tooltip.
    icons: customIcons.map(({ style: _style, ...icon }) => icon),
    glyph: (icon) => ({
      kind: "svg",
      node: icon.node,
      viewBoxSize: icon.viewBoxSize,
      viewBoxOrigin: icon.viewBoxOrigin,
      paint: "fill",
    }),
  }),
  pack({
    id: "font-awesome",
    title: "Font Awesome",
    prefix: "fa",
    icons: fontAwesomeIcons,
    glyph: (icon) => ({
      kind: "text",
      text: icon.unicode,
      fontFamily: icon.fontFamily,
      fontWeight: icon.fontWeight,
    }),
  }),
  pack({
    id: "material-icons",
    title: "Material Icons",
    prefix: "mi",
    icons: materialIcons,
    // Material Icons renders its glyphs through font ligatures on the icon name.
    glyph: (icon) => ({
      kind: "text",
      text: icon.name,
      fontFamily: icon.fontFamily,
    }),
  }),
  pack({
    id: "lucide",
    title: "Lucide",
    prefix: "lu",
    icons: lucideIcons,
    glyph: (icon) => ({
      kind: "svg",
      node: icon.node,
      viewBoxSize: 24,
      paint: "stroke",
    }),
  }),
  pack({
    id: "remix",
    title: "Remix Icon",
    prefix: "ri",
    icons: remixIcons,
    glyph: (icon) => ({
      kind: "text",
      text: icon.unicode,
      fontFamily: "remixicon",
    }),
  }),
  pack({
    id: "boxicons",
    title: "Boxicons",
    prefix: "bx",
    icons: boxIcons,
    glyph: (icon) => ({
      kind: "text",
      text: icon.unicode,
      fontFamily: "boxicons",
    }),
  }),
  pack({
    id: "tabler",
    title: "Tabler Icons",
    prefix: "ti",
    icons: tablerIcons,
    glyph: (icon) => ({
      kind: "svg",
      node: icon.node,
      viewBoxSize: 24,
      paint: icon.style === "filled"
        ? "fill"
        : "stroke",
    }),
  }),
  pack({
    id: "bootstrap",
    title: "Bootstrap Icons",
    prefix: "bi",
    icons: bootstrapIcons,
    glyph: (icon) => ({
      kind: "text",
      text: icon.unicode,
      fontFamily: "bootstrap-icons",
    }),
  }),
  pack({
    id: "heroicons",
    title: "Heroicons",
    prefix: "hi",
    icons: heroIcons,
    glyph: (icon) => ({
      kind: "svg",
      node: icon.node,
      viewBoxSize: 24,
      paint: icon.style === "solid"
        ? "fill"
        : "stroke-thin",
    }),
  }),
  pack({
    id: "phosphor",
    title: "Phosphor",
    prefix: "ph",
    icons: phosphorIcons,
    glyph: (icon) => ({
      kind: "text",
      text: icon.unicode,
      fontFamily: icon.fontFamily,
    }),
  }),
  pack({
    id: "ionicons",
    title: "Ionicons",
    prefix: "io",
    icons: ionIcons,
    glyph: (icon) => ({
      kind: "svg",
      node: icon.node,
      viewBoxSize: icon.viewBoxSize,
      paint: "ion",
    }),
  }),
  pack({
    id: "simple-icons",
    title: "Simple Icons",
    prefix: "si",
    // The style is always "filled", so leave it out of the tooltip.
    icons: simpleIcons.map(({ style: _style, ...icon }) => icon),
    glyph: (icon) => ({
      kind: "svg",
      node: icon.node,
      viewBoxSize: icon.viewBoxSize,
      paint: "fill",
    }),
  }),
  pack({
    id: "devicon",
    title: "Devicon",
    prefix: "dv",
    icons: devIcons,
    glyph: (icon) => ({
      kind: "svg",
      node: icon.node,
      viewBoxSize: icon.viewBoxSize,
      paint: "fill",
    }),
  }),
];

export const emojiByText = new Map(
  emojiPack.icons.map((icon) => [icon.insert, icon]),
);
