import heroIconData from "virtual:heroicons";

export type HeroIconStyle = "outline" | "solid";

export type HeroIconNode = [
  tag: string,
  attrs: Record<string, string | number | undefined>,
][];

export type HeroIcon = {
  name: string;
  token: string;
  label: string;
  style: HeroIconStyle;
  node: HeroIconNode;
  searchText: string;
};

type HeroIconData = {
  name: string;
  label: string;
  style: HeroIconStyle;
  node: HeroIconNode;
  searchText: string;
};

export const heroIcons: HeroIcon[] = (heroIconData as HeroIconData[]).map(
  (icon) => ({
    ...icon,
    token: `${icon.style}:${icon.name}`,
  }),
);

export const heroIconMap = new Map(
  heroIcons.flatMap((icon) => {
    const entries: [string, HeroIcon][] = [[icon.token, icon]];
    if (icon.style === "outline") entries.push([icon.name, icon]);
    return entries;
  }),
);
