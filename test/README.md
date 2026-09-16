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

`cleaners.test.js` fills the pile past its cap and asserts that a cleaner runs
its whole routine and leaves nothing on the stage. Which one turns up is a coin
toss in the page, so the test pins it with `data-cleaner` on `<html>` and takes
the name as an argument.

```sh
node test/cleaners.test.js gorilla
node test/cleaners.test.js cat
```

`warmup.test.js` checks the two things that make the first click feel like any
other: the engine and its ledges are built while the browser is idle, before
anyone clicks, and a burst of clicks arriving during that load all land rather
than only the last.

```sh
node test/warmup.test.js
```
