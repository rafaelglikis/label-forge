declare module "virtual:font-awesome-icons" {
  const icons: {
    name: string;
    unicode: string;
    label: string;
    style: "solid" | "regular" | "brands";
    searchText: string;
  }[];

  export default icons;
}

declare module "virtual:material-icons" {
  const icons: {
    name: string;
    label: string;
    style: "filled" | "outlined" | "round" | "sharp" | "two-tone";
    searchText: string;
  }[];

  export default icons;
}

declare module "virtual:lucide-icons" {
  const icons: {
    name: string;
    label: string;
    node: [string, Record<string, string | number | undefined>][];
    searchText: string;
  }[];

  export default icons;
}

declare module "virtual:remix-icons" {
  const icons: {
    name: string;
    label: string;
    category: string;
    style: "fill" | "line";
    unicode: string;
    searchText: string;
  }[];

  export default icons;
}

declare module "virtual:boxicons" {
  const icons: {
    name: string;
    label: string;
    style: "regular" | "solid" | "logos";
    unicode: string;
    searchText: string;
  }[];

  export default icons;
}

declare module "virtual:tabler-icons" {
  const icons: {
    name: string;
    label: string;
    style: "outline" | "filled";
    category: string;
    node: [string, Record<string, string | number | undefined>][];
    searchText: string;
  }[];

  export default icons;
}

declare module "virtual:bootstrap-icons" {
  const icons: {
    name: string;
    label: string;
    style: "regular" | "fill";
    unicode: string;
    searchText: string;
  }[];

  export default icons;
}

declare module "virtual:heroicons" {
  const icons: {
    name: string;
    label: string;
    style: "outline" | "solid";
    node: [string, Record<string, string | number | undefined>][];
    searchText: string;
  }[];

  export default icons;
}

declare module "virtual:phosphor-icons" {
  const icons: {
    name: string;
    label: string;
    style: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
    unicode: string;
    searchText: string;
  }[];

  export default icons;
}

declare module "virtual:ionicons" {
  const icons: {
    name: string;
    label: string;
    style: "filled" | "outline" | "sharp";
    viewBoxSize: number;
    node: [string, Record<string, string | number | undefined>][];
    searchText: string;
  }[];

  export default icons;
}
