import customIconData from "virtual:custom-icons";

export type CustomIconNode = [
  tag: string,
  attrs: Record<string, string | number | undefined>,
][];

export type CustomIcon = {
  name: string;
  token: string;
  label: string;
  // Custom icons are single-colour SVGs, always painted filled.
  style: "filled";
  viewBoxSize: number;
  viewBoxOrigin: [number, number];
  node: CustomIconNode;
  searchText: string;
};

type CustomIconData = {
  name: string;
  label: string;
  viewBoxSize: number;
  viewBoxOrigin: [number, number];
  node: CustomIconNode;
  searchText: string;
};

export const customIcons: CustomIcon[] = (customIconData as CustomIconData[]).map(
  (icon) => ({
    ...icon,
    token: icon.name,
    style: "filled" as const,
  }),
);

export const customIconMap = new Map(
  customIcons.map((icon) => [icon.token, icon]),
);
