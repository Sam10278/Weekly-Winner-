# Bracket Code, Line by Line

This file explains the bracket code one line at a time.
Open the real files next to this document and read both together.

| File | Job |
|---|---|
| `frontend/js/bracket.js` | Builds the bracket HTML |
| `frontend/index.html` and `frontend/pages/bracket.html` | Give the bracket a place on the page |
| `frontend/css/bracket.css` | Styles the boxes and draws the lines |

How they connect:

```
page loads -> bracket.js builds elements with class names -> bracket.css styles those class names
```

---

# Part 1 — bracket.js

## Top of the file

```javascript
// Builds an empty bracket for 8, 16 or 32 teams.
// For now the size comes from the address, e.g. index.html?size=16
// Later it will come from the challenge in Firestore (bracketSize).
```

- `//` starts a comment. The browser ignores it. Comments are notes for people.

```javascript
const ALLOWED_SIZES = [8, 16, 32];
```

- `const` makes a name that cannot be changed later.
- `[8, 16, 32]` is a list (an array) of the sizes we support.
- The name is in capital letters because the value is fixed. This is a common habit.

## roundName

```javascript
function roundName(matchCount) {
  if (matchCount === 1) return "Final";
  if (matchCount === 2) return "Semi-final";
  return `Round 1/${matchCount}`;
}
```

- `function roundName(matchCount)` makes a function. It receives one value, the number of matchups in a round.
- `if (matchCount === 1) return "Final";` means: if the number is exactly 1, give back "Final" and stop. `===` means "is exactly equal".
- The next line does the same for 2 and gives "Semi-final".
- `return \`Round 1/${matchCount}\`` runs for every other number.
  - The backticks make a template string.
  - `${matchCount}` puts the value inside the text.
  - If `matchCount` is 8, the result is `Round 1/8`.

## makeMatchup

```javascript
function makeMatchup() {
  const matchup = document.createElement("div");
  matchup.className = "matchup";
  matchup.innerHTML = `
    <div class="slot">TBD</div>
    <div class="slot">TBD</div>
    <button type="button" class="vote-btn" disabled>Vote</button>`;
  return matchup;
}
```

- `function makeMatchup()` makes a function that takes no values.
- `document.createElement("div")` makes a new `div`. It is only in memory. It is not on the page yet.
- `matchup.className = "matchup"` sets the CSS class. `bracket.css` uses this name.
- `matchup.innerHTML = ...` puts HTML inside the div: two slots and a Vote button.
  - `type="button"` means the button does not submit a form.
  - `disabled` means the user cannot click it.
- `return matchup;` gives the finished element back to the caller.
- Safety note: `innerHTML` is fine here because the text is fixed. When we add real item names, use `textContent` instead. If someone writes HTML in an item name, `innerHTML` would run it.

## makeRound

```javascript
function makeRound(roundNumber, totalRounds, size) {
```

- This function builds one column. It receives three values:
  - `roundNumber`: 1 for the first round, 2 for the second, and so on
  - `totalRounds`: how many rounds the whole bracket has
  - `size`: 8, 16 or 32

```javascript
  const matchCount = size / 2 ** roundNumber;
```

- `2 ** roundNumber` means 2 to the power of the round number. The power runs first, then the division.
- The result is the number of matchups in this round, both sides together.

| Size | Round 1 | Round 2 | Round 3 | Round 4 | Round 5 |
|---|---|---|---|---|---|
| 8 | 4 | 2 | 1 | | |
| 16 | 8 | 4 | 2 | 1 | |
| 32 | 16 | 8 | 4 | 2 | 1 |

```javascript
  const isFinal = roundNumber === totalRounds;
```

- This is `true` when this is the last round, and `false` otherwise.

```javascript
  const perSide = isFinal ? 1 : matchCount / 2;
```

- `condition ? A : B` means: if the condition is true use A, otherwise use B.
- The final has 1 matchup. Every other round is split into a left side and a right side, so each side gets half.

```javascript
  const round = document.createElement("div");
  round.className = "round";
  round.style.setProperty("--span", 2 ** (roundNumber - 1));
```

- The first two lines make the column element and give it the class `round`.
- `style.setProperty("--span", ...)` sets a CSS variable on this column.
- `2 ** (roundNumber - 1)` gives 1, 2, 4, 8 for rounds 1, 2, 3, 4.
- The CSS uses `--span` to know how tall each matchup's cell is, so the lines have the right length.

```javascript
  if (roundNumber === 1) round.classList.add("round-first");
  if (roundNumber <= totalRounds - 2) round.classList.add("round-pairs");
  if (roundNumber >= 2 && roundNumber <= totalRounds - 1) round.classList.add("round-in");
  if (roundNumber === totalRounds - 1) round.classList.add("round-semi");
  if (isFinal) round.classList.add("round-final");
```

- `classList.add("name")` adds one more class to the element.
- `&&` means "and". Both sides must be true.
- Each class tells the CSS which lines to draw:

| Class | Added when | CSS uses it for |
|---|---|---|
| `round-first` | round 1 | no line coming in, solid borders |
| `round-pairs` | a round before the semi-final | a line out, then a vertical line |
| `round-in` | round 2 up to the semi-final | a short line coming in |
| `round-semi` | the last round on each side | a straight line to the final |
| `round-final` | the final | no lines |

Example, size 16 (4 rounds):

| Round | Classes |
|---|---|
| 1 | `round-first`, `round-pairs` |
| 2 | `round-pairs`, `round-in` |
| 3 | `round-in`, `round-semi` |
| 4 | `round-final` |

```javascript
  const label = document.createElement("h3");
  label.className = "round-label";
  label.textContent = roundName(matchCount);
  round.append(label);
```

- Makes a heading for the column.
- `textContent` sets plain text. It is safe because the browser does not run it as HTML.
- `roundName(matchCount)` gives the name, for example "Semi-final".
- `round.append(label)` puts the label inside the column.

```javascript
  for (let i = 0; i < perSide; i++) round.append(makeMatchup());
  return round;
}
```

- This is a loop.
  - `let i = 0` starts a counter at 0.
  - `i < perSide` keeps going while the counter is smaller than `perSide`.
  - `i++` adds 1 to the counter each time.
- Each time, it makes a matchup and puts it in the column.
- `return round;` gives the finished column back.

## renderBracket

```javascript
export function renderBracket(container, size = 8) {
```

- `export` lets other files import this function later.
- `container` is the element where the bracket will go.
- `size = 8` means: if no size is given, use 8.

```javascript
  if (!ALLOWED_SIZES.includes(size)) size = 8;
```

- `ALLOWED_SIZES.includes(size)` is true when the size is in the list.
- `!` means "not". If the size is not allowed, use 8.

```javascript
  const totalRounds = Math.log2(size);
```

- `Math.log2` tells how many times you divide by 2 to reach 1.
- 8 gives 3, 16 gives 4, 32 gives 5.

```javascript
  const left = document.createElement("div");
  left.className = "bracket-half bracket-left";
  const right = document.createElement("div");
  right.className = "bracket-half bracket-right";
```

- Makes two containers, one for each side.
- Two class names are separated by a space. An element can have many classes.
- `bracket-left` and `bracket-right` let the CSS mirror the lines.

```javascript
  for (let r = 1; r < totalRounds; r++) {
    left.append(makeRound(r, totalRounds, size));
    right.prepend(makeRound(r, totalRounds, size));
  }
```

- The loop goes from round 1 to the round before the final.
- `append` adds at the end. `prepend` adds at the start.
- Left side: round 1 is added first, so it is on the far left.
- Right side: each new round is added before the others, so round 1 ends up on the far right.
- Example, size 16:

| Side | Order on screen, left to right |
|---|---|
| Left | round 1, round 2, round 3 |
| Right | round 3, round 2, round 1 |

- `makeRound` is called twice for each round. Each call makes its own new element.

```javascript
  const tree = document.createElement("div");
  tree.className = "bracket-tree";
  tree.append(left, makeRound(totalRounds, totalRounds, size), right);
```

- `tree` is one row that holds everything.
- `append` can take several items. They go in this order: left side, the final, right side.
- `makeRound(totalRounds, ...)` makes the final.

```javascript
  const bracket = document.createElement("div");
  bracket.className = "bracket";
  bracket.style.setProperty("--rows", size / 4);
  bracket.append(tree);
```

- `bracket` is the gray outer box.
- `--rows` is the number of first-round matchups on one side: 8 gives 2, 16 gives 4, 32 gives 8.
- The CSS uses `--rows` to set the height of every column.

```javascript
  container.replaceChildren(bracket);
}
```

- Removes everything inside the container, then puts the new bracket in.
- This means that calling the function again does not draw two brackets.

## The last lines

```javascript
const root = document.getElementById("bracket-root");
```

- Looks for the element with `id="bracket-root"`. It gives the element, or `null` if the page does not have it.

```javascript
if (root) {
```

- Run the next lines only if the element exists.

```javascript
  const size = Number(new URLSearchParams(location.search).get("size")) || 8;
```

- `location.search` is the part of the address that starts with `?`, for example `?size=16`.
- `new URLSearchParams(...)` is a helper that reads the values.
- `.get("size")` gives the value as text, `"16"`. If it is missing, it gives `null`.
- `Number(...)` turns the text into a number. `Number("16")` is 16. `Number(null)` is 0.
- `|| 8` means "or 8". If the result is 0 or not a number, use 8.

```javascript
  renderBracket(root, size);
}
```

- Draws the bracket inside the element.

---

# Part 2 — index.html and bracket.html

```html
<link rel="stylesheet" href="/css/bracket.css">
```

- Goes in the `<head>`. It loads a CSS file.
- `rel="stylesheet"` says that the file is a style file.
- `href="/css/bracket.css"` starts with `/`, so it always starts from the root of the site.

```html
<section class="bracket-section">
  <h2 class="bracket-heading">Current Bracket</h2>
  <div id="bracket-root"></div>
</section>
```

- `section` groups this part of the page.
- `h2` is the title.
- `<div id="bracket-root">` is an empty box. `bracket.js` puts the bracket here.
- The `id` must be exactly `bracket-root`. The same name is in `getElementById("bracket-root")`.

```html
<script type="module" src="/js/bracket.js"></script>
```

- Loads the JavaScript file.
- `type="module"` is needed because the file uses `export`.
- A module script waits until the page HTML is read. So `bracket-root` already exists when the code runs.

`bracket.html` uses the same three pieces: the CSS link, the section, and the script.

---

# Part 3 — bracket.css

Lines that start with `/*` are comments. They are not explained here.

## Page spacing

```css
.bracket-section {
  padding: 24px 20px;
}
```

- `.bracket-section` selects every element with this class.
- `padding: 24px 20px` adds inside space: 24px on top and bottom, 20px on the left and right.

```css
.bracket-heading {
  margin: 0 0 16px;
  font-size: 20px;
}
```

- `margin: 0 0 16px` adds outside space: 0 on top, 0 on the sides, 16px below.
- `font-size: 20px` sets the text size.

## The gray box and its variables

```css
.bracket {
  --match-w: 150px;
  --slot-h: 32px;
  --vote-h: 28px;
  --cell: 120px;
  --gap: 40px;
  --line: 2px solid #888;
```

- Names that start with `--` are CSS variables. You use them later with `var(--name)`.
- `--match-w`: width of one matchup box.
- `--slot-h`: height of one team slot.
- `--vote-h`: height of the Vote button.
- `--cell`: height given to one first-round matchup. It must be bigger than a matchup box (about 94px).
- `--gap`: empty space between columns. The lines are drawn in this space.
- `--line`: style of the connecting lines (2px, solid, gray). It is used as a whole `border` value.
- `--rows` and `--span` are set by JavaScript, not here.

```css
  padding: 44px 20px 24px;
  background: #f1f1f1;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow-x: auto;
}
```

- `padding: 44px 20px 24px` is top, left and right, bottom. The big top space is for the round labels.
- `background: #f1f1f1` is light gray.
- `border: 1px solid #ddd` is a thin gray outline.
- `border-radius: 6px` rounds the corners.
- `overflow-x: auto` adds a sideways scroll bar when the bracket is wider than the box. The whole page does not scroll.

```css
.bracket *,
.bracket *::before,
.bracket *::after {
  box-sizing: border-box;
}
```

- `.bracket *` means every element inside the bracket. The `::before` and `::after` lines include the line pieces.
- `box-sizing: border-box` means a width includes the border and padding. This keeps the sizes easy to calculate.

## Layout

```css
.bracket-tree {
  display: flex;
  align-items: center;
  gap: var(--gap);
  width: max-content;
  margin: 0 auto;
}
```

- `display: flex` puts the children in one row.
- `align-items: center` centers them top to bottom. This puts the final in the middle.
- `gap: var(--gap)` adds the space between columns.
- `width: max-content` makes the row as wide as all its columns.
- `margin: 0 auto` centers the row when there is extra room. When the row is wider than the box, it starts at the left and the user scrolls.

```css
.bracket-half {
  display: flex;
  gap: var(--gap);
}
```

- Each side is also a row of columns with the same space between them.

```css
.round {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  height: calc(var(--cell) * var(--rows, 2));
}
```

- `position: relative` makes this column the reference point for the label, which is placed with `position: absolute`.
- `display: flex` with `flex-direction: column` stacks the matchups top to bottom.
- `justify-content: space-around` gives each matchup an equal slice of the column, and puts the matchup in the middle of its slice. This is why the lines meet exactly.
- `height: calc(var(--cell) * var(--rows, 2))` is cell height times the number of rows. All columns have the same height. `2` after the comma is a backup value if `--rows` is missing.

```css
.round-label {
  position: absolute;
  top: -28px;
  left: 0;
  right: 0;
  margin: 0;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: #000;
}
```

- `position: absolute` takes the label out of the normal flow, so it does not move the matchups.
- `top: -28px` moves it above the column. The padding of `.bracket` makes room for it.
- `left: 0` and `right: 0` make it as wide as the column.
- `margin: 0` removes the default space of a heading.
- `text-align: center` centers the text.
- `font-size: 12px` and `font-weight: 700` make small bold text.
- `color: #000` is black.

## Boxes

```css
.matchup {
  position: relative;
  width: var(--match-w);
  background: #fff;
  border: 1px solid #999;
}
```

- `position: relative` makes the box the reference point for its line pieces.
- `width: var(--match-w)` uses the width variable.
- `background: #fff` is white.
- `border: 1px solid #999` is a gray outline.

```css
.slot {
  display: flex;
  align-items: center;
  height: var(--slot-h);
  padding: 0 10px;
  font-size: 13px;
  color: #000;
  border-bottom: 1px solid #ddd;
}
```

- `display: flex` with `align-items: center` centers the text up and down.
- `height: var(--slot-h)` uses the slot height variable.
- `padding: 0 10px` adds 10px on the left and right of the text.
- `font-size: 13px` and `color: #000` set black text.
- `border-bottom` draws a light line under each slot.

```css
.vote-btn {
  display: block;
  width: 100%;
  height: var(--vote-h);
  border: 0;
  background: #fff;
  color: #c0392b;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
}
```

- `display: block` makes the button fill a whole row like a box.
- `width: 100%` makes it as wide as the matchup.
- `height: var(--vote-h)` uses the button height variable.
- `border: 0` removes the default button border.
- `background: #fff` is white.
- `color: #c0392b` is red text.
- `font-family: inherit` copies the page font. Buttons do not do this by default.
- `font-size: 12px` and `font-weight: 600` make small semi-bold text.

```css
.vote-btn:disabled {
  cursor: not-allowed;
  opacity: 0.75;
}
```

- `:disabled` matches only buttons with the `disabled` attribute.
- `cursor: not-allowed` shows the "no" mouse pointer.
- `opacity: 0.75` makes the button a little faded.

```css
.round:not(.round-first) .matchup {
  border-style: dashed;
}

.round:not(.round-first) .slot {
  color: #666;
}
```

- `.round:not(.round-first)` means every round that does not have the class `round-first`.
- Matchups in later rounds get a dashed border.
- Their text becomes darker gray, so they look faded.

## Connecting lines

**How to read the selectors.** `.bracket-left .round-in .matchup::before` means: the `::before` piece of a `.matchup` that is inside a `.round-in`, inside `.bracket-left`.

**Pseudo-elements.** `::before` and `::after` are extra pieces drawn by CSS next to an element. They have no HTML. We use them to draw the lines with borders. Each one needs `content: ""` to appear.

### A short line coming in

```css
.round-in .matchup::before {
  content: "";
  position: absolute;
  top: calc(50% - 1px);
  width: calc(var(--gap) / 2);
  border-top: var(--line);
}
```

- `content: ""` is required for the piece to appear.
- `position: absolute` places it relative to the matchup.
- `top: calc(50% - 1px)` puts it in the middle of the box. The `- 1px` is half the line width, so the line is exactly centered.
- `width: calc(var(--gap) / 2)` makes it half of the space between columns.
- `border-top: var(--line)` is the line itself. A piece with no height and a top border looks like a line.

```css
.bracket-left  .round-in .matchup::before { right: calc(100% + 1px); }
.bracket-right .round-in .matchup::before { left:  calc(100% + 1px); }
```

- On the left side, the line comes in from the left. `right: calc(100% + 1px)` puts the piece just outside the left edge of the box. The `+ 1px` covers the box border, so there is no gap.
- On the right side, it is the opposite.

### A line out, then a vertical line

```css
.round-pairs .matchup::after {
  content: "";
  position: absolute;
  width: calc(var(--gap) / 2);
  height: calc(var(--cell) * var(--span, 1) / 2 + 1px);
}
```

- `width` is half of the space between columns.
- `height` is half of this round's cell height. This is the distance from the matchup's middle to the middle of the pair.
- `+ 1px` makes the two pieces of a pair meet with no gap.

```css
.bracket-left  .round-pairs .matchup::after { left:  calc(100% + 1px); border-right: var(--line); }
.bracket-right .round-pairs .matchup::after { right: calc(100% + 1px); border-left:  var(--line); }
```

- On the left side the piece is to the right of the box. Its right border is the vertical line.
- On the right side the piece is to the left of the box. Its left border is the vertical line.

```css
.round-pairs .matchup:nth-of-type(odd)::after  { top:    calc(50% - 1px); border-top:    var(--line); }
.round-pairs .matchup:nth-of-type(even)::after { bottom: calc(50% - 1px); border-bottom: var(--line); }
```

- `:nth-of-type(odd)` means the 1st, 3rd, 5th... matchup. The label is not a `div`, so it is not counted.
- Odd matchups: the piece starts at the middle of the box and goes down. The top border is the short line out.
- Even matchups: the piece ends at the middle of the box and goes up. The bottom border is the short line out.
- Together, one odd and one even matchup make a bracket shape that meets in the middle:

```
[matchup 1] ---+
               |---- [next round matchup]
[matchup 2] ---+
```

### A straight line to the final

```css
.round-semi .matchup::after {
  content: "";
  position: absolute;
  top: calc(50% - 1px);
  width: var(--gap);
  border-top: var(--line);
}

.bracket-left  .round-semi .matchup::after { left:  calc(100% + 1px); }
.bracket-right .round-semi .matchup::after { right: calc(100% + 1px); }
```

- The semi-final has one matchup per side, so there is no pair.
- The line is the full width of the gap. It reaches the final.
- Left side: the line goes right. Right side: the line goes left.

---

# Worked example

**Size 8** (`--rows` is 2, `--cell` is 120px):

- Column height: 120 × 2 = 240px.
- Round 1 has 2 matchups per side. Their middles are at 60px and 180px.
- Round 2 (the semi-final) has 1 matchup. Its middle is at 120px.
- The vertical line piece is 120 × 1 / 2 = 60px long. It goes from 60 to 120, and from 180 up to 120. They meet exactly.

**Size 16** (`--rows` is 4):

- Column height: 480px.
- Round 1 middles: 60, 180, 300, 420px.
- Round 2 has `--span` 2, with middles at 120 and 360px. Its line pieces are 120 × 2 / 2 = 120px long. They go from 120 to 240, and from 360 up to 240.
- The semi-final's middle is at 240px, where they meet.

Everything lines up because each round has half as many matchups, and each cell is twice as tall.

---

# Words to know

| Word | Meaning |
|---|---|
| Element | One piece of HTML, such as a `div` or a `button` |
| Class | A name on an element. CSS uses it to find the element |
| CSS variable | A value like `--gap` that you set once and use many times |
| Pseudo-element | An extra piece drawn by CSS with `::before` or `::after` |
| Flexbox | A way to put items in a row or a column |
| Module | A JavaScript file that can use `export` and `import` |

---

# What I Learned

- (write your own notes here)

# Contribution

Developer: (your name) (2026-10-16)