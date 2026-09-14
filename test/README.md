# Tests

`drop.test.js` loads the real landing markup, the real `assets/js/drop.js` and
the vendored matter-js into jsdom, clicks the page, and asserts that props
spawn, are driven by physics, and come to rest on the type and the arm rather
than falling to the floor.

It exists because a refactor once silently deleted `start()`: the file still
parsed, so a syntax check passed, and clicking did nothing.

```sh
npm install --no-save jsdom
node test/drop.test.js
```

Exits non-zero on failure.

`gorilla.test.js` fills the pile past its cap and asserts that the gorilla runs
its whole routine — hops in, beats, inhales every prop, leaves and removes
itself — with nothing left on the stage.

```sh
node test/gorilla.test.js
```
