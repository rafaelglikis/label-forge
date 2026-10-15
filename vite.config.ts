import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

type FontAwesomeStyle = 'solid' | 'regular' | 'brands'

type IconMetadata = {
  unicode: string
  label: string
  search?: {
    terms?: string[]
  }
  familyStylesByLicense?: {
    free?: {
      family: string
      style: FontAwesomeStyle
    }[]
  }
}

type LucideIconNode = [string, Record<string, string | number | undefined>][]
type TablerIconStyle = 'outline' | 'filled'
type HeroIconStyle = 'outline' | 'solid'
type DevIconStyle = 'plain' | 'line'
type PhosphorIconStyle = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'

type TablerIconMetadata = {
  name: string
  category?: string
  tags?: (string | number)[]
  styles?: Partial<Record<TablerIconStyle, unknown>>
}

const fontAwesomeIconModuleId = 'virtual:font-awesome-icons'
const materialIconModuleId = 'virtual:material-icons'
const lucideIconModuleId = 'virtual:lucide-icons'
const remixIconModuleId = 'virtual:remix-icons'
const boxIconModuleId = 'virtual:boxicons'
const tablerIconModuleId = 'virtual:tabler-icons'
const bootstrapIconModuleId = 'virtual:bootstrap-icons'
const heroIconModuleId = 'virtual:heroicons'
const phosphorIconModuleId = 'virtual:phosphor-icons'
const ionIconModuleId = 'virtual:ionicons'
const simpleIconModuleId = 'virtual:simple-icons'
const devIconModuleId = 'virtual:devicons'
const emojiModuleId = 'virtual:emojis'

function parseSvgAttrs(source: string) {
  const attrs: Record<string, string | number | undefined> = {}
  for (const match of source.matchAll(/([\w-]+)=['"]([^'"]*)['"]/g)) {
    const name = match[1].replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
    const value = match[2]
    const numeric = Number(value)
    attrs[name] = value && Number.isFinite(numeric) ? numeric : value
  }
  return attrs
}

function parseSvgNode(source: string): LucideIconNode {
  return [
    ...source.matchAll(/<(path|circle|ellipse|line|rect|polyline|polygon)\b([^>]*)\/?>(?:<\/\1>)?/g),
  ].map((match) => [match[1], parseSvgAttrs(match[2])])
}

function fontAwesomeIconData(): Plugin {
  return {
    name: 'font-awesome-icon-data',
    resolveId(id) {
      if (id === fontAwesomeIconModuleId) return id
    },
    load(id) {
      if (id !== fontAwesomeIconModuleId) return

      const metadataPath = fileURLToPath(
        new URL(
          './node_modules/@fortawesome/fontawesome-free/metadata/icon-families.json',
          import.meta.url,
        ),
      )
      const metadata = JSON.parse(readFileSync(metadataPath, 'utf8')) as Record<
        string,
        IconMetadata
      >
      const styles = ['solid', 'regular', 'brands'] satisfies FontAwesomeStyle[]
      const icons = Object.entries(metadata)
        .flatMap(([name, icon]) => {
          const freeStyles = icon.familyStylesByLicense?.free ?? []
          return styles
            .filter((style) =>
              freeStyles.some(
                (freeStyle) =>
                  freeStyle.family === 'classic' && freeStyle.style === style,
              ),
            )
            .map((style) => ({
              name,
              unicode: icon.unicode,
              label: icon.label,
              style,
              searchText: [
                name,
                icon.label,
                style,
                ...(icon.search?.terms ?? []),
              ]
                .join(' ')
                .toLowerCase(),
            }))
        })
        .sort(
          (a, b) =>
            a.label.localeCompare(b.label) || a.style.localeCompare(b.style),
        )

      return `export default ${JSON.stringify(icons)}`
    },
  }
}

function materialIconData(): Plugin {
  return {
    name: 'material-icon-data',
    resolveId(id) {
      if (id === materialIconModuleId) return id
    },
    load(id) {
      if (id !== materialIconModuleId) return

      const packagePath = fileURLToPath(
        new URL('./node_modules/@material-design-icons/svg/', import.meta.url),
      )
      const styles = ['filled', 'outlined', 'round', 'sharp', 'two-tone']
      const icons = styles.flatMap((style) =>
        readdirSync(`${packagePath}/${style}`)
          .filter((file) => file.endsWith('.svg'))
          .map((file) => {
            const name = file.slice(0, -4)
            const label = name
              .split('_')
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' ')

            return {
              name,
              label,
              style,
              searchText: `${name} ${label} ${style}`.toLowerCase(),
            }
          }),
      )

      return `export default ${JSON.stringify(icons)}`
    },
  }
}

function lucideIconData(): Plugin {
  return {
    name: 'lucide-icon-data',
    resolveId(id) {
      if (id === lucideIconModuleId) return id
    },
    load(id) {
      if (id !== lucideIconModuleId) return

      const iconsPath = fileURLToPath(
        new URL('./node_modules/lucide/dist/esm/icons/', import.meta.url),
      )
      const icons = readdirSync(iconsPath)
        .filter((file) => file.endsWith('.mjs'))
        .map((file) => {
          const name = file.slice(0, -4)
          const source = readFileSync(`${iconsPath}/${file}`, 'utf8')
          const match = source.match(/const\s+\w+\s*=\s*(\[[\s\S]*?\]);\s*export/)
          if (!match) throw new Error(`Could not parse Lucide icon: ${file}`)

          const node = Function(`"use strict"; return (${match[1]})`)() as LucideIconNode
          const label = name
            .split('-')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')

          return {
            name,
            label,
            node,
            searchText: `${name} ${label}`.toLowerCase(),
          }
        })
        .sort((a, b) => a.label.localeCompare(b.label))

      return `export default ${JSON.stringify(icons)}`
    },
  }
}

function remixIconData(): Plugin {
  return {
    name: 'remix-icon-data',
    resolveId(id) {
      if (id === remixIconModuleId) return id
    },
    load(id) {
      if (id !== remixIconModuleId) return

      const iconsPath = fileURLToPath(
        new URL('./node_modules/remixicon/icons/', import.meta.url),
      )
      const cssPath = fileURLToPath(
        new URL('./node_modules/remixicon/fonts/remixicon.css', import.meta.url),
      )
      const unicodeByName = new Map(
        [...readFileSync(cssPath, 'utf8').matchAll(/\.ri-([^:]+):before\s*\{\s*content:\s*"\\([a-f0-9]+)";\s*\}/g)].map(
          (match) => [match[1], String.fromCodePoint(parseInt(match[2], 16))],
        ),
      )
      const files = (dir: string): string[] =>
        readdirSync(dir).flatMap((entry) => {
          const path = `${dir}/${entry}`
          if (statSync(path).isDirectory()) return files(path)
          return entry.endsWith('.svg') ? [path] : []
        })

      const icons = files(iconsPath)
        .map((path) => {
          const file = path.split('/').at(-1) ?? ''
          const category = path.split('/').at(-2) ?? ''
          const name = file.slice(0, -4)
          const style = name.endsWith('-fill') ? 'fill' : 'line'
          const label = name
            .replace(/-(?:fill|line)$/, '')
            .split('-')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')

          return {
            name,
            label,
            category,
            style,
            unicode: unicodeByName.get(name),
            searchText: `${name} ${label} ${category} ${style}`.toLowerCase(),
          }
        })
        .filter((icon) => icon.unicode !== undefined)
        .sort(
          (a, b) =>
            a.label.localeCompare(b.label) || a.style.localeCompare(b.style),
        )

      return `export default ${JSON.stringify(icons)}`
    },
  }
}

function boxIconData(): Plugin {
  return {
    name: 'box-icon-data',
    resolveId(id) {
      if (id === boxIconModuleId) return id
    },
    load(id) {
      if (id !== boxIconModuleId) return

      const cssPath = fileURLToPath(
        new URL('./node_modules/boxicons/css/boxicons.css', import.meta.url),
      )
      const styleByPrefix = {
        bx: 'regular',
        bxs: 'solid',
        bxl: 'logos',
      } as const
      const icons = [
        ...readFileSync(cssPath, 'utf8').matchAll(
          /\.((?:bx|bxs|bxl)-[^:]+):before\s*\{\s*content:\s*"\\([a-f0-9]+)";\s*\}/g,
        ),
      ]
        .map((match) => {
          const name = match[1]
          const prefix = name.split('-')[0] as keyof typeof styleByPrefix
          const label = name
            .replace(/^(?:bx|bxs|bxl)-/, '')
            .split('-')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')
          const style = styleByPrefix[prefix]

          return {
            name,
            label,
            style,
            unicode: String.fromCodePoint(parseInt(match[2], 16)),
            searchText: `${name} ${label} ${style}`.toLowerCase(),
          }
        })
        .sort(
          (a, b) =>
            a.label.localeCompare(b.label) || a.style.localeCompare(b.style),
        )

      return `export default ${JSON.stringify(icons)}`
    },
  }
}

function tablerIconData(): Plugin {
  return {
    name: 'tabler-icon-data',
    resolveId(id) {
      if (id === tablerIconModuleId) return id
    },
    load(id) {
      if (id !== tablerIconModuleId) return

      const metadataPath = fileURLToPath(
        new URL('./node_modules/@tabler/icons/icons.json', import.meta.url),
      )
      const outlineNodesPath = fileURLToPath(
        new URL(
          './node_modules/@tabler/icons/tabler-nodes-outline.json',
          import.meta.url,
        ),
      )
      const filledNodesPath = fileURLToPath(
        new URL(
          './node_modules/@tabler/icons/tabler-nodes-filled.json',
          import.meta.url,
        ),
      )
      const metadata = JSON.parse(readFileSync(metadataPath, 'utf8')) as Record<
        string,
        TablerIconMetadata
      >
      const nodes = {
        outline: JSON.parse(readFileSync(outlineNodesPath, 'utf8')) as Record<
          string,
          LucideIconNode
        >,
        filled: JSON.parse(readFileSync(filledNodesPath, 'utf8')) as Record<
          string,
          LucideIconNode
        >,
      }
      const styles = ['outline', 'filled'] satisfies TablerIconStyle[]
      const icons = Object.values(metadata)
        .flatMap((icon) =>
          styles
            .filter((style) => icon.styles?.[style] && nodes[style][icon.name])
            .map((style) => {
              const label = icon.name
                .split('-')
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ')

              return {
                name: icon.name,
                label,
                style,
                category: icon.category ?? '',
                node: nodes[style][icon.name],
                searchText: [
                  icon.name,
                  label,
                  style,
                  icon.category ?? '',
                  ...(icon.tags ?? []),
                ]
                  .join(' ')
                  .toLowerCase(),
              }
            }),
        )
        .sort(
          (a, b) =>
            a.label.localeCompare(b.label) || a.style.localeCompare(b.style),
        )

      return `export default ${JSON.stringify(icons)}`
    },
  }
}

function bootstrapIconData(): Plugin {
  return {
    name: 'bootstrap-icon-data',
    resolveId(id) {
      if (id === bootstrapIconModuleId) return id
    },
    load(id) {
      if (id !== bootstrapIconModuleId) return

      const cssPath = fileURLToPath(
        new URL(
          './node_modules/bootstrap-icons/font/bootstrap-icons.css',
          import.meta.url,
        ),
      )
      const icons = [
        ...readFileSync(cssPath, 'utf8').matchAll(
          /\.bi-([^:]+)::before\s*\{\s*content:\s*"\\([a-f0-9]+)";\s*\}/g,
        ),
      ]
        .map((match) => {
          const name = match[1]
          const style = name.endsWith('-fill') ? 'fill' : 'regular'
          const label = name
            .replace(/-fill$/, '')
            .split('-')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')

          return {
            name,
            label,
            style,
            unicode: String.fromCodePoint(parseInt(match[2], 16)),
            searchText: `${name} ${label} ${style}`.toLowerCase(),
          }
        })
        .sort(
          (a, b) =>
            a.label.localeCompare(b.label) || a.style.localeCompare(b.style),
        )

      return `export default ${JSON.stringify(icons)}`
    },
  }
}

function heroIconData(): Plugin {
  return {
    name: 'hero-icon-data',
    resolveId(id) {
      if (id === heroIconModuleId) return id
    },
    load(id) {
      if (id !== heroIconModuleId) return

      const packagePath = fileURLToPath(
        new URL('./node_modules/@heroicons/react/24/', import.meta.url),
      )
      const styles = ['outline', 'solid'] satisfies HeroIconStyle[]
      const attrName = (name: string) => name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
      const parseAttrs = (source: string) => {
        const attrs: Record<string, string | number | undefined> = {}
        for (const match of source.matchAll(/("?[A-Za-z-]+"?):\s*("[^"]*"|[0-9.]+)/g)) {
          const name = match[1].replaceAll('"', '')
          const raw = match[2]
          attrs[attrName(name)] = raw.startsWith('"') ? raw.slice(1, -1) : Number(raw)
        }
        return attrs
      }
      const icons = styles.flatMap((style) => {
        const iconsPath = `${packagePath}/${style}`
        return readdirSync(iconsPath)
          .filter((file) => file.endsWith('Icon.js') && file !== 'index.js')
          .map((file) => {
            const componentName = file.slice(0, -7)
            const name = componentName
              .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
              .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
              .toLowerCase()
            const label = name
              .split('-')
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' ')
            const source = readFileSync(`${iconsPath}/${file}`, 'utf8')
            const node = [
              ...source.matchAll(/React\.createElement\("(path)"\s*,\s*\{([\s\S]*?)\}\)/g),
            ].map((match) => [match[1], parseAttrs(match[2])] as LucideIconNode[number])

            return {
              name,
              label,
              style,
              node,
              searchText: `${name} ${label} ${style}`.toLowerCase(),
            }
          })
          .filter((icon) => icon.node.length > 0)
      })

      return `export default ${JSON.stringify(
        icons.sort(
          (a, b) =>
            a.label.localeCompare(b.label) || a.style.localeCompare(b.style),
        ),
      )}`
    },
  }
}

function phosphorIconData(): Plugin {
  return {
    name: 'phosphor-icon-data',
    resolveId(id) {
      if (id === phosphorIconModuleId) return id
    },
    load(id) {
      if (id !== phosphorIconModuleId) return

      const packagePath = fileURLToPath(
        new URL('./node_modules/@phosphor-icons/web/src/', import.meta.url),
      )
      const styles = ['thin', 'light', 'regular', 'bold', 'fill', 'duotone'] satisfies PhosphorIconStyle[]
      const icons = styles.flatMap((style) => {
        const cssPath = `${packagePath}/${style}/style.css`
        return [...readFileSync(cssPath, 'utf8').matchAll(/\.ph\.ph-([^:]+):before\s*\{\s*content:\s*"\\([a-f0-9]+)";\s*\}/g)].map(
          (match) => {
            const name = match[1]
            const label = name
              .split('-')
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' ')

            return {
              name,
              label,
              style,
              unicode: String.fromCodePoint(parseInt(match[2], 16)),
              searchText: `${name} ${label} ${style}`.toLowerCase(),
            }
          },
        )
      })

      return `export default ${JSON.stringify(
        icons.sort(
          (a, b) =>
            a.label.localeCompare(b.label) || a.style.localeCompare(b.style),
        ),
      )}`
    },
  }
}

function ionIconData(): Plugin {
  return {
    name: 'ion-icon-data',
    resolveId(id) {
      if (id === ionIconModuleId) return id
    },
    load(id) {
      if (id !== ionIconModuleId) return

      const metadataPath = fileURLToPath(
        new URL('./node_modules/ionicons/dist/ionicons.json', import.meta.url),
      )
      const svgPath = fileURLToPath(
        new URL('./node_modules/ionicons/dist/svg/', import.meta.url),
      )
      const metadata = JSON.parse(readFileSync(metadataPath, 'utf8')) as {
        icons: { name: string; tags?: string[] }[]
      }
      const icons = metadata.icons
        .map((icon) => {
          const node = parseSvgNode(readFileSync(`${svgPath}/${icon.name}.svg`, 'utf8'))
          const style = icon.name.endsWith('-outline')
            ? 'outline'
            : icon.name.endsWith('-sharp')
              ? 'sharp'
              : 'filled'
          const label = icon.name
            .replace(/-(?:outline|sharp)$/, '')
            .split('-')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')

          return {
            name: icon.name,
            label,
            style,
            viewBoxSize: 512,
            node,
            searchText: [icon.name, label, style, ...(icon.tags ?? [])]
              .join(' ')
              .toLowerCase(),
          }
        })
        .filter((icon) => icon.node.length > 0)
        .sort(
          (a, b) =>
            a.label.localeCompare(b.label) || a.style.localeCompare(b.style),
        )

      return `export default ${JSON.stringify(icons)}`
    },
  }
}

function simpleIconData(): Plugin {
  return {
    name: 'simple-icon-data',
    resolveId(id) {
      if (id === simpleIconModuleId) return id
    },
    load(id) {
      if (id !== simpleIconModuleId) return

      const packagePath = fileURLToPath(
        new URL('./node_modules/simple-icons/', import.meta.url),
      )
      const metadata = JSON.parse(
        readFileSync(`${packagePath}/data/simple-icons.json`, 'utf8'),
      ) as { title: string; slug: string; aliases?: { aka?: string[] } }[]
      const icons = metadata
        .map((icon) => ({
          name: icon.slug,
          label: icon.title,
          node: parseSvgNode(readFileSync(`${packagePath}/icons/${icon.slug}.svg`, 'utf8')),
          searchText: [icon.slug, icon.title, ...(icon.aliases?.aka ?? [])]
            .join(' ')
            .toLowerCase(),
        }))
        .sort((a, b) => a.label.localeCompare(b.label))

      return `export default ${JSON.stringify(icons)}`
    },
  }
}

function devIconData(): Plugin {
  return {
    name: 'dev-icon-data',
    resolveId(id) {
      if (id === devIconModuleId) return id
    },
    load(id) {
      if (id !== devIconModuleId) return

      const packagePath = fileURLToPath(
        new URL('./node_modules/devicon/', import.meta.url),
      )
      const metadata = JSON.parse(readFileSync(`${packagePath}/devicon.json`, 'utf8')) as {
        name: string
        altnames?: string[]
        tags?: string[]
        versions: { svg: string[] }
      }[]
      // Only monochrome variants; colored "original" ones would print as solid blobs.
      const styles = ['plain', 'line'] satisfies DevIconStyle[]
      // Nodes are drawn flat, so skip SVGs relying on groups, transforms or gradients.
      const unsupported = /<(?:g|use|defs|style|mask|clipPath|linearGradient|radialGradient)\b|transform=/
      const icons = metadata
        .flatMap((icon) =>
          styles
            .filter((style) => icon.versions.svg.includes(style))
            .flatMap((style) => {
              const source = readFileSync(
                `${packagePath}/icons/${icon.name}/${icon.name}-${style}.svg`,
                'utf8',
              )
              if (unsupported.test(source)) return []

              const label = icon.name
                .split('-')
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ')

              return [{
                name: icon.name,
                label,
                style,
                node: parseSvgNode(source).map(
                  ([tag, { fill: _fill, ...attrs }]) => [tag, attrs] as LucideIconNode[number],
                ),
                searchText: [
                  icon.name,
                  label,
                  style,
                  ...(icon.altnames ?? []),
                  ...(icon.tags ?? []),
                ]
                  .join(' ')
                  .toLowerCase(),
              }]
            }),
        )
        .filter((icon) => icon.node.length > 0)
        .sort(
          (a, b) =>
            a.label.localeCompare(b.label) || a.style.localeCompare(b.style),
        )

      return `export default ${JSON.stringify(icons)}`
    },
  }
}

function emojiData(): Plugin {
  return {
    name: 'emoji-data',
    resolveId(id) {
      if (id === emojiModuleId) return id
    },
    load(id) {
      if (id !== emojiModuleId) return

      const packagePath = fileURLToPath(
        new URL('./node_modules/emojibase-data/', import.meta.url),
      )
      const emojis = JSON.parse(readFileSync(`${packagePath}/en/compact.json`, 'utf8')) as {
        label: string
        unicode: string
        group?: number
        order?: number
        tags?: string[]
      }[]
      const { groups } = JSON.parse(
        readFileSync(`${packagePath}/meta/groups.json`, 'utf8'),
      ) as { groups: Record<string, string> }
      const componentGroup = 2
      const icons = emojis
        .filter((emoji) => emoji.group !== undefined && emoji.group !== componentGroup)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((emoji) => ({
          emoji: emoji.unicode,
          label: emoji.label,
          searchText: [emoji.label, groups[emoji.group ?? ''], ...(emoji.tags ?? [])]
            .join(' ')
            .toLowerCase(),
        }))

      return `export default ${JSON.stringify(icons)}`
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    fontAwesomeIconData(),
    materialIconData(),
    lucideIconData(),
    remixIconData(),
    boxIconData(),
    tablerIconData(),
    bootstrapIconData(),
    heroIconData(),
    phosphorIconData(),
    ionIconData(),
    simpleIconData(),
    devIconData(),
    emojiData(),
    svelte(),
  ],
})
