# masterbelt.dev

[![Deploy Pages](https://github.com/masterbelt/masterbelt.github.io/actions/workflows/pages.yml/badge.svg)](https://github.com/masterbelt/masterbelt.github.io/actions/workflows/pages.yml)

Static documentation site for Masterbelt, published at <https://masterbelt.dev/>.

The site is deployed with GitHub Pages and uses `masterbelt.dev` as its custom domain.

## Development

```sh
pnpm install
pnpm generate:spec ../masterbelt
pnpm dev
```

## Checks

```sh
pnpm biome:check
pnpm check
pnpm test
pnpm build
```

## License

MIT
