LYNE puzzle solver
==================

This is a solver for [LYNE][] game. It can also gradually show the connections, which is a helpful way to get a hint without showing the entire solution.

The solver is written in JavaScript and HTML+CSS+SVG. It should work on any modern browser, desktop or mobile. It has been tested on Google Chrome 43 and Mozilla Firefox 38.

[Open the solver online, in your browser!][solver]

How to use this solver
----------------------

Write the puzzle description as text in the main text box. Click `Solve it!` to find a solution. Drag the slider to gradually reveal random lines until the full solution is shown.

The puzzle description is plain text formed by the following characters:

* Lower-case `t`, `s`, `d`, `p`, `h` letters denote shapes.
* Upper-case `T`, `S`, `D`, `P`, `H` letters denote terminator nodes (shapes that have a white inside). Paths will always start and end in a terminator node.
* Numbers `1`, `2`, `3`, `4` denote gray shapes that have 1, 2, 3 or 4 paths passing through them.
* Space character denotes an empty space.

Note that the original LYNE game only contains 3 shapes and does not have all 4 types of gray nodes. Also, the largest puzzle size in the original game seems to be 3x7. This solver does not have such limitations.

About LYNE
----------

[LYNE][] is a puzzle game written by [Thomas Bowker][tb] using [Unity][]. It is available on digital distribution platforms: [Google Play][play], [Amazon App Store][amazon], [iTunes][itunes], [Windows Phone Store][wp], [Steam][steam], [Humble Bundle Store][humble], [itch.io][itch]. It is also available [DRM-free][lyne].

About this solver (under-the-hood information)
----------------------------------------------

This solver was written by [Denilson Sá][denilsonsa] using modern web technologies. The list below contains some highlights of the underlying code:

* The gray diamond shape in the background was written using pure CSS, with a combination of [`linear-gradient()`][linear-gradient] and [`background-size`][background-size], inspired by [CSS3 Patterns Gallery][css3patterns].
* The layout is done using [`flex`][flex] and [viewport-relative units][viewport-units], which means it is responsive and should adapt to any screen size. Some scrolling might be required if the display is not wide enough, and this was a deliberate choice.
* The slider is HTML5 `<input type="range">`.
* [Pure JavaScript code][vanillajs] without using any additional library.
* Event-handling through `oninput` event, which fires as soon as the text or the slider changes their value. This gives a faster feedback than `onchange` and is much better than using `onkeydown`/`onkeyup`/`onkeypress` events, because it will work even if the value is changed by the mouse, and it won't run the even handler if the user just presses keys without changing the content (e.g. arrow keys).
* Graphics built using SVG. Each shape is defined once using `<defs>` and `<symbol>`, and later used as many times as needed with `<use>`.
* Dynamically-generated SVG content. For some reason, browsers do not allow modifying `viewBox` attribute in `<svg>` element, nor modifying any of the relevant attributes of `<use>` element. For this reason, the entire SVG source-code is rewritten into a string and then added to the document (using `innerHTML`).
* The solver is implemented as a simple recursive [backtracking][] algorithm.
* Many LYNE puzzles have multiple solutions. The solver finds one arbitrary solution. It is possible to adapt the code to find all solutions, but it would also require additional code to remove duplicate solutions.
* There is function to output a plain text representation of the solution, but there is no UI for it. It was implemented as a way to check if the algorithm worked, before the SVG-building function was written.

[solver]: http://denilsonsa.github.io/lyne-solver/lyne-solver.html
[lyne]: http://www.lynegame.com/
[play]: https://play.google.com/store/apps/details?id=com.thomasbowker.lynerelease
[amazon]: http://www.amazon.com/Thomas-Bowker-LYNE/dp/B00HA8WNZ0
[itunes]: https://itunes.apple.com/us/app/lyne/id731753333
[wp]: http://www.windowsphone.com/en-us/store/app/lyne/bf04e86a-cf61-491e-b095-a257fb725f5e
[steam]: http://store.steampowered.com/app/266010/
[humble]: https://www.humblebundle.com/store/p/lyne_storefront
[itch]: http://thomasbowker.itch.io/lyne
[tb]: http://thomasbowker.com/
[unity]: https://unity3d.com/
[denilsonsa]: http://denilson.sa.nom.br/
[linear-gradient]: https://developer.mozilla.org/en-US/docs/Web/CSS/linear-gradient
[background-size]: https://developer.mozilla.org/en-US/docs/Web/CSS/background-size
[css3patterns]: http://lea.verou.me/css3patterns/
[flex]: https://css-tricks.com/snippets/css/a-guide-to-flexbox/
[viewport-units]: http://www.w3.org/TR/css3-values/#viewport-relative-lengths
[vanillajs]: http://vanilla-js.com/
[backtracking]: https://en.wikipedia.org/wiki/Backtracking
