import bootstrapIconData from "virtual:bootstrap-icons";

export type BootstrapIconStyle = "regular" | "fill";

export type BootstrapIcon = {
  name: string;
  token: string;
  label: string;
  style: BootstrapIconStyle;
  unicode: string;
  searchText: string;
};

type BootstrapIconData = {
  name: string;
  label: string;
  style: BootstrapIconStyle;
  unicode: string;
  searchText: string;
};

export const bootstrapIcons: BootstrapIcon[] = (
  bootstrapIconData as BootstrapIconData[]
).map((icon) => ({
  ...icon,
  token: icon.name,
}));

export const bootstrapIconMap = new Map(
  bootstrapIcons.map((icon) => [icon.token, icon]),
);
