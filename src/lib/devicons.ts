import devIconData from "virtual:devicons";

export type DevIconStyle = "plain" | "line";

export type DevIconNode = [
  tag: string,
  attrs: Record<string, string | number | undefined>,
][];

export type DevIcon = {
  name: string;
  token: string;
  label: string;
  style: DevIconStyle;
  viewBoxSize: number;
  node: DevIconNode;
  searchText: string;
};

type DevIconData = {
  name: string;
  label: string;
  style: DevIconStyle;
  node: DevIconNode;
  searchText: string;
};

export const devIcons: DevIcon[] = (devIconData as DevIconData[]).map(
  (icon) => ({
    ...icon,
    token: `${icon.style}:${icon.name}`,
    viewBoxSize: 128,
  }),
);

export const devIconMap = new Map(
  devIcons.flatMap((icon) => {
    const entries: [string, DevIcon][] = [[icon.token, icon]];
    if (icon.style === "plain") entries.push([icon.name, icon]);
    return entries;
  }),
);
