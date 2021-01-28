# S.P.U.D.S

**S**uper **P**ixellated... umm... "underground"? "united"? I don't have an acronym, I just saw a potato while trying to think of a name. Names are hard, sorry.

Spuds is a tiny PICO-8 inspired game framework for HTML5.

## Example

Access framework functions/variables through global `s` object.

```javascript
import { init } from "spuds";

let x, y;

init({
  setup() {
    // set x/y to screen center
    x = s.width / 2;
    y = s.height / 2;
  },

  loop() {
    // clear screen with bg color
    s.clear([32, 64, 0]);

    // move circle
    if (s.isDown("up")) y -= 32 * s.deltaTime;
    if (s.isDown("down")) y += 32 * s.deltaTime;
    if (s.isDown("left")) x -= 32 * s.deltaTime;
    if (s.isDown("right")) x += 32 * s.deltaTime;

    // draw white circle
    s.circle(x, y, 32, [255, 255, 255]);
  }
});
```
