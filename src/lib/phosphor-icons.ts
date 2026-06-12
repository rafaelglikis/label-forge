import phosphorIconData from "virtual:phosphor-icons";

export type PhosphorIconStyle =
  | "thin"
  | "light"
  | "regular"
  | "bold"
  | "fill"
  | "duotone";

export type PhosphorIcon = {
  name: string;
  token: string;
  label: string;
  style: PhosphorIconStyle;
  fontFamily: string;
  unicode: string;
  searchText: string;
};

type PhosphorIconData = {
  name: string;
  label: string;
  style: PhosphorIconStyle;
  unicode: string;
  searchText: string;
};

const phosphorFonts: Record<PhosphorIconStyle, string> = {
  thin: "Phosphor-Thin",
  light: "Phosphor-Light",
  regular: "Phosphor",
  bold: "Phosphor-Bold",
  fill: "Phosphor-Fill",
  duotone: "Phosphor-Duotone",
};

export const phosphorIcons: PhosphorIcon[] = (
  phosphorIconData as PhosphorIconData[]
).map((icon) => ({
  ...icon,
  token: `${icon.style}:${icon.name}`,
  fontFamily: phosphorFonts[icon.style],
}));

export const phosphorIconMap = new Map(
  phosphorIcons.flatMap((icon) => {
    const entries: [string, PhosphorIcon][] = [[icon.token, icon]];
    if (icon.style === "regular") entries.push([icon.name, icon]);
    return entries;
  }),
);
