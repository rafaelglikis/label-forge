import boxIconData from "virtual:boxicons";

export type BoxIconStyle = "regular" | "solid" | "logos";

export type BoxIcon = {
  name: string;
  token: string;
  label: string;
  style: BoxIconStyle;
  unicode: string;
  searchText: string;
};

type BoxIconData = {
  name: string;
  label: string;
  style: BoxIconStyle;
  unicode: string;
  searchText: string;
};

export const boxIcons: BoxIcon[] = (boxIconData as BoxIconData[]).map(
  (icon) => ({
    ...icon,
    token: icon.name,
  }),
);

export const boxIconMap = new Map(boxIcons.map((icon) => [icon.token, icon]));
