# LabelForge

Web Bluetooth label editor for Phomemo D30/Q30-style label printers.

Live site: <https://labelforge.minotaur-lizard.gr/>

## Features

- Design labels directly in the browser.
- Print over Web Bluetooth.
- Configure label size, margins, font size, and reverse printing.
- Insert emoji, barcodes, and icons from Font Awesome, Material Icons, Lucide, Remix, Boxicons, Tabler, Bootstrap Icons, Heroicons, Phosphor, and Ionicons.
- Deploy as a static Vite/Svelte app on GitHub Pages.

## Requirements

- A browser with Web Bluetooth support.
- HTTPS for Bluetooth access outside local development.
- A compatible Phomemo D30/Q30-style printer.

## Development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run check
npm run build
```

## Deployment

The site deploys to GitHub Pages from `.github/workflows/deploy.yml` when changes are pushed to `main`.

The custom domain is configured through `public/CNAME`:

```text
labelforge.minotaur-lizard.gr
```

## Reference

This project was originally based on <https://github.com/dmsc/web-label-printer>.
