import tablerIconData from "virtual:tabler-icons";

export type TablerIconStyle = "outline" | "filled";

export type TablerIconNode = [
  tag: string,
  attrs: Record<string, string | number | undefined>,
][];

export type TablerIcon = {
  name: string;
  token: string;
  label: string;
  style: TablerIconStyle;
  category: string;
  node: TablerIconNode;
  searchText: string;
};

type TablerIconData = {
  name: string;
  label: string;
  style: TablerIconStyle;
  category: string;
  node: TablerIconNode;
  searchText: string;
};

export const tablerIcons: TablerIcon[] = (tablerIconData as TablerIconData[]).map(
  (icon) => ({
    ...icon,
    token: `${icon.style}:${icon.name}`,
  }),
);

export const tablerIconMap = new Map(
  tablerIcons.flatMap((icon) => {
    const entries: [string, TablerIcon][] = [[icon.token, icon]];
    if (icon.style === "outline") entries.push([icon.name, icon]);
    return entries;
  }),
);
