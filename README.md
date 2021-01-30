# POTA-8

POTA-8 is a HTML5 engine for potato-quality games, inspired by PICO-8. I made it for my own prototyping and game jams and is a little thin on documentation, but anyone else is welcome to try it out or tinker with it.

## Example

Access framework functions/variables through global `p` object.

```javascript
import { init } from "pota-8";

let x, y;

init({
  setup() {
    // set x/y to screen center
    x = p.width / 2;
    y = p.height / 2;
  },

  loop() {
    // clear screen with bg color
    p.clear([32, 64, 0]);

    // move circle
    if (p.isDown("up")) y -= 32 * p.deltaTime;
    if (p.isDown("down")) y += 32 * p.deltaTime;
    if (p.isDown("left")) x -= 32 * p.deltaTime;
    if (p.isDown("right")) x += 32 * p.deltaTime;

    // draw white circle
    p.circle(x, y, 32, [255, 255, 255]);
  }
});
```
