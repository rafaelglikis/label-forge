import simpleIconData from "virtual:simple-icons";

export type SimpleIconNode = [
  tag: string,
  attrs: Record<string, string | number | undefined>,
][];

export type SimpleIcon = {
  name: string;
  token: string;
  label: string;
  // Simple Icons ships a single filled style.
  style: "filled";
  viewBoxSize: number;
  node: SimpleIconNode;
  searchText: string;
};

type SimpleIconData = {
  name: string;
  label: string;
  node: SimpleIconNode;
  searchText: string;
};

export const simpleIcons: SimpleIcon[] = (simpleIconData as SimpleIconData[]).map(
  (icon) => ({
    ...icon,
    token: icon.name,
    style: "filled" as const,
    viewBoxSize: 24,
  }),
);

export const simpleIconMap = new Map(
  simpleIcons.map((icon) => [icon.token, icon]),
);
