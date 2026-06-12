import ionIconData from "virtual:ionicons";

export type IonIconStyle = "filled" | "outline" | "sharp";

export type IonIconNode = [
  tag: string,
  attrs: Record<string, string | number | undefined>,
][];

export type IonIcon = {
  name: string;
  token: string;
  label: string;
  style: IonIconStyle;
  viewBoxSize: number;
  node: IonIconNode;
  searchText: string;
};

type IonIconData = {
  name: string;
  label: string;
  style: IonIconStyle;
  viewBoxSize: number;
  node: IonIconNode;
  searchText: string;
};

export const ionIcons: IonIcon[] = (ionIconData as IonIconData[]).map(
  (icon) => ({
    ...icon,
    token: icon.name,
  }),
);

export const ionIconMap = new Map(ionIcons.map((icon) => [icon.token, icon]));
