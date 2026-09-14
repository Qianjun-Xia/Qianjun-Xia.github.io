# qianjun-xia.github.io

Personal site for Qianjun Xia — robotics and physical intelligence.
Built with Jekyll, served by GitHub Pages from `master`.

## Layout

| Path | What lives there |
| --- | --- |
| `_pages/` | The landing page and each section page |
| `_projects/` | One file per project; a `permalink` becomes its page, an `external` link sends visitors to the project's own site |
| `_publications/` | One file per paper, grouped on the page by `status` |
| `_data/cv.yml` | Education, experience and skills, read by the About page |
| `_data/navigation.yml` | The numbered index on the landing page and the header nav |
| `_layouts/`, `_includes/` | Templates. `arm.html` is the landing illustration, `drops.html` the falling props |
| `_sass/` | `_tokens.scss` holds the palette and type; `_site.scss` the layout |
| `assets/js/drop.js` | The click-to-drop toy |

## Design

One committed light palette, set once in `_sass/_tokens.scss`:

| Token | Value |
| --- | --- |
| Ground | `#f6efd8` |
| Panel | `#fbf6e7` |
| Type | `#453718` |
| Accent | `#b0802a` |
| Display / body | Fredoka / Nunito |

The illustration and the falling props are drawn in these same tokens, so
changing the palette recolours them with no edits to the artwork.

## Running it

```sh
docker compose up          # http://localhost:4000, rebuilds on save
```

Jekyll does not reload `_config.yml`; restart the container after editing it.

## Tests

```sh
npm install --no-save jsdom
node test/drop.test.js
```

## Adding content

**A project** — add a file to `_projects/` with `title`, `tagline`, `teaser`,
`date`, `status` and `permalink`. Add `external:` instead of writing a body if
the project has its own site.

**A paper** — add a file to `_publications/` with `authors`, `venue`, `year` and
a `status` of `published`, `under-review`, `preprint` or `in-preparation`. Your
own name is bolded in the author list automatically.

**A falling prop** — add a `<symbol id="d-…">` to `_includes/drops.html` and an
entry to `PROPS` in `assets/js/drop.js`.

## Credit

Rebuilt from the [Academic Pages](https://github.com/academicpages/academicpages.github.io)
template, which the earlier version of this site used; the original is preserved
on the `legacy-academicpages` branch. Physics by
[matter-js](https://brm.io/matter-js/) (MIT).
