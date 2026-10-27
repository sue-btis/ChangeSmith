# Vendored libraries

`render-package.mjs` inlines these files into the generated HTML so the page works offline. The plugin installs no dependencies.

| File | Package | Version | npm integrity (tarball) | License |
|---|---|---|---|---|
| `mermaid-12.1.0.min.js` | `mermaid` (`dist/mermaid.min.js`) | 12.1.0 | `sha512-wlVCp+8eTupfCeeFvoZNNiTuHrvag0P2jz/ILgb/f/6jkVokUefOcujefi8qUe/j2asHiSePncVsz/xzzA80LQ==` | MIT, `mermaid-LICENSE` |
| `marked-18.1.0.umd.js` | `marked` (`lib/marked.umd.js`) | 18.1.0 | `sha512-PamYXWWWg2nboG3oX5Ffzpy3EFZROqZJK9hSlMmUnekp7TxPs5DcT95vwd46m73/exfKCRVMtgXoPMI4FEJL6w==` | MIT, `marked-LICENSE` |
| `manrope-5.3.0-latin-wght.woff2` | `@fontsource-variable/manrope` (`files/manrope-latin-wght-normal.woff2`) | 5.3.0 | `sha512-6D5dgokHsWDDMtmXHznKa0hK229NN+1a4BLPmUCLqcO1Pw5EEhWY5RFt0AcXnVRAljFFPfRtLkJePQj6LSsV6g==` | OFL-1.1, `manrope-LICENSE` |

To update one: `npm pack <package>@<version>`, check the tarball against `npm view <package>@<version> dist.integrity`, copy the file above, and change the version in its name and in `render-package.mjs`.
