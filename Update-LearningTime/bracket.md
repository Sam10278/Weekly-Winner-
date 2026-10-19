# Bracket Branch — Changes and bracket.js Line by Line


## 1. What this branch does


- `bracket.js` builds the bracket from a size: 8, 16 or 32 teams.
- Every box is **one item** with its own Vote button.
- The box across the connector line is its opponent. The two boxes are one matchup.
- The winner of a matchup moves into the next column.
- The box in the middle is the **Winner**. It has no Vote button.
- `index.html` and `bracket.html` show the same bracket.

---

## 2. Files changed

| File | Change |
|---|---|
| `frontend/js/bracket.js` | New. Builds the bracket |
| `frontend/css/bracket.css` | Replaced. Styles the boxes and draws the lines |
| `frontend/index.html` | Hand-typed bracket removed. Empty bracket spot, CSS link and script added |
| `frontend/pages/bracket.html` | Copy of `base.html` with the same bracket spot, CSS link and script |


---

## 3. The changes, file by file

### index.html

1. Add this line in the `<head>`, after the `navbar.css` link:
```html
   <link rel="stylesheet" href="/css/bracket.css">
```

2. In its place, under `<!-- PAGE CONTENT GOES HERE -->`, put:
```html
   <section class="bracket-section">
     <h2 class="bracket-heading">Current Bracket</h2>
     <div id="bracket-root"></div>
   </section>
```
4. Add this script under the `auth.js` line:
```html
   <script type="module" src="/js/bracket.js"></script>
```

### bracket.html

1. Title: `Bracket`
2. Add the `bracket.css` link in the `<head>`.
3. Put the same `<section class="bracket-section">` block inside `<main>`.
4. Add the `bracket.js` script under the `auth.js` script.

```

What each part of the CSS does:

| Part | Job |
|---|---|
| `.bracket` and its variables | Gray box. Sets sizes. `overflow-x: auto` scrolls sideways on small screens |
| `.bracket-tree`, `.bracket-half` | Put the columns in a row, left side, Winner, right side |
| `.round` | One column. `space-around` centers each box in an equal cell |
| `.round-label` | The title above each column |
| `.matchup`, `.slot`, `.vote-btn` | One box, its item name, and its Vote button |
| `.round:not(.round-first)` | Later columns look faded (dashed border, gray text) |
| `.round-in` `::before` | A short line coming in from the previous round |
| `.round-pairs` `::after` | A line out, then a vertical line to the middle of the pair |
| `.round-last` `::after` | A straight line to the Winner box |
| `.bracket-left` and `.bracket-right` | Mirror the lines for each side |



---

## 4. bracket.js line by line

Top of the file:

```javascript
const ALLOWED_SIZES = [8, 16, 32];
```

- `const` makes a name that cannot be changed later.
- `[8, 16, 32]` is a list (an array) of the sizes we support.

###  roundName

```javascript
function roundName(matchCount) {
  if (matchCount === 1) 
  return "Final";
  if (matchCount === 2) 
  return "Semi-final";
  return `Round 1/${matchCount}`;
}
```

- `function roundName(matchCount)` makes a function. It receives one value: the number of matchups in a round.
- `if (matchCount === 1) return "Final";` means: if the number is exactly 1, give back "Final" and stop. `===` means "is exactly equal".
- The next line does the same for 2 and gives "Semi-final".
- The last line runs for every other number. The backticks make a template string, and ``${matchCount}`` puts the value inside the text. If `matchCount` is 8, the result is `Round 1/8`.

### makeMatchup

```javascript
function makeMatchup(showVote = true) {
```

- This function makes one box. One box is one item.
- `showVote = true` means: if no value is given, the box gets a Vote button.
- `makeMatchup()` and `makeMatchup(true)` make a box with a button. `makeMatchup(false)` makes a box without one.

```javascript
  let voteButton = "";
```

- `let` makes a name whose value can change.
- It starts as empty text, `""`.

```javascript
  if (showVote) {
    voteButton = '<button type="button" class="vote-btn" disabled>Vote</button>';
  } else {
    voteButton = "";
  }
```

- If `showVote` is true, the button HTML goes into `voteButton`.
  - `type="button"` means the button does not submit a form.
  - `disabled` means nobody can click it yet.
- `else` runs when `showVote` is false. It sets `voteButton` to empty text, so no button is added.
- The `else` part repeats the starting value, so it could be removed. It is there to show both cases clearly.

```javascript
  const matchup = document.createElement("div");
  matchup.className = "matchup";
  matchup.innerHTML = `
    <div class="slot">TBD</div>
    ${voteButton}`;
  return matchup;
}
```

- `document.createElement("div")` makes a new `div`. It only exists in memory. It is not on the page yet.
- `matchup.className = "matchup"` sets the CSS class. `bracket.css` uses this name.
- `matchup.innerHTML = ...` puts HTML inside the div: one slot, then the Vote button (or nothing).
- `return matchup;` gives the finished element back to the caller.
- Safety note: `innerHTML` is fine here because the text is fixed. When we add real item names, use `textContent` instead. If someone writes HTML in an item name, `innerHTML` would run it.
- The class is named `matchup`, but one box is one item. Two boxes next to each other are the real matchup.

### makeRound

```javascript
function makeRound(roundNumber, totalRounds, size) {
```

- This function builds one column on one side. It receives three values:
  - `roundNumber`: 1 for the first round, 2 for the second, and so on
  - `totalRounds`: how many rounds each side has
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
  const perSide = matchCount;
```

- A matchup has two boxes. A round has `matchCount * 2` boxes in total.
- Each side gets half of them, which is `matchCount`.
- Example, size 8: round 1 has 4 boxes on each side, round 2 has 2, and round 3 has 1.

```javascript
  const round = document.createElement("div");
  round.className = "round";
  round.style.setProperty("--span", 2 ** (roundNumber - 1));
```

- The first two lines make the column element and give it the class `round`.
- `style.setProperty("--span", ...)` sets a CSS variable on this column.
- `2 ** (roundNumber - 1)` gives 1, 2, 4, 8 for rounds 1, 2, 3, 4.
- The CSS uses `--span` to know how tall each box's cell is, so the lines have the right length.

```javascript
  if (roundNumber === 1) round.classList.add("round-first");
  if (roundNumber <= totalRounds - 1) round.classList.add("round-pairs");
  if (roundNumber >= 2) round.classList.add("round-in");
  if (roundNumber === totalRounds) round.classList.add("round-last");
```

- `classList.add("name")` adds one more class to the element.
- Each class tells the CSS which lines to draw:

| Class | Added when | CSS uses it for |
|---|---|---|
| `round-first` | round 1 | no line coming in, solid borders |
| `round-pairs` | every round except the last | a line out, then a vertical line |
| `round-in` | every round except round 1 | a short line coming in |
| `round-last` | the last round | a straight line to the Winner |

Example, size 16 (4 rounds on each side):

| Round | Classes |
|---|---|
| 1 | `round-first`, `round-pairs` |
| 2 | `round-pairs`, `round-in` |
| 3 | `round-pairs`, `round-in` |
| 4 | `round-in`, `round-last` |

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
  for (let i = 0; i < perSide; i++) {
    round.append(makeMatchup(true));
  }
  return round;
}
```

- This is a loop.
  - `let i = 0` starts a counter at 0.
  - `i < perSide` keeps going while the counter is smaller than `perSide`.
  - `i++` adds 1 to the counter each time.
- Each time, it makes a box with a Vote button and puts it in the column.
- `return round;` gives the finished column back.

### 4.5 makeWinner

```javascript
function makeWinner() {
  const round = document.createElement("div");
  round.className = "round round-winner";
```

- Makes the middle column. It has two classes: `round` and `round-winner`.

```javascript
  const label = document.createElement("h3");
  label.className = "round-label";
  label.textContent = "Winner";
  round.append(label);
```

- Makes the heading "Winner" and puts it in the column.

```javascript
  round.append(makeMatchup(false));
  return round;
}
```

- Adds one box. `false` means no Vote button, because nobody votes on the winner.

### 4.6 renderBracket

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
- This is the number of rounds on each side.

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
  for (let r = 1; r <= totalRounds; r++) {
    left.append(makeRound(r, totalRounds, size));
    right.prepend(makeRound(r, totalRounds, size));
  }
```

- The loop goes from round 1 to the last round. `<=` includes the last round.
- `append` adds at the end. `prepend` adds at the start.
- Left side: round 1 is added first, so it is on the far left.
- Right side: each new round is added before the others, so round 1 ends up on the far right.
- `makeRound` is called twice for each round. Each call makes its own new element.

| Size 16 | Order on screen, left to right |
|---|---|
| Left side | round 1, round 2, round 3, round 4 |
| Right side | round 4, round 3, round 2, round 1 |

```javascript
  const tree = document.createElement("div");
  tree.className = "bracket-tree";
  tree.append(left, makeWinner(), right);
```

- `tree` is one row that holds everything.
- `append` can take several items. They go in this order: left side, the Winner, right side.

```javascript
  const bracket = document.createElement("div");
  bracket.className = "bracket";
  bracket.style.setProperty("--rows", size / 2);
  bracket.append(tree);
```

- `bracket` is the gray outer box.
- `--rows` is the number of boxes in round 1 on one side: 8 gives 4, 16 gives 8, 32 gives 16.
- The CSS uses `--rows` to set the height of every column.

```javascript
  container.replaceChildren(bracket);
}
```

- Removes everything inside the container, then puts the new bracket in.
- This means that calling the function again does not draw two brackets.

### 4.7 The last lines

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
- If the size is a number we do not allow, such as 10, `renderBracket` falls back to 8.

```javascript
  renderBracket(root, size);
}
```

- Draws the bracket inside the element.

---

## 5. Walk-through for size 8

`renderBracket(root, 8)` runs like this:

1. 8 is allowed. `totalRounds` is 3.
2. Round 1: `matchCount` is 4, so 4 boxes per side. `--span` is 1. Classes: `round-first`, `round-pairs`. Label: "Round 1/4".
3. Round 2: `matchCount` is 2, so 2 boxes per side. `--span` is 2. Classes: `round-pairs`, `round-in`. Label: "Semi-final".
4. Round 3: `matchCount` is 1, so 1 box per side. `--span` is 4. Classes: `round-in`, `round-last`. Label: "Final".
5. The middle: `makeWinner()` makes one box with no Vote button. Label: "Winner".
6. `--rows` is set to 4.

What you see, left to right:

| Column | Boxes |
|---|---|
| Round 1/4 | 4 |
| Semi-final | 2 |
| Final | 1 |
| **Winner** | **1 (no Vote button)** |
| Final | 1 |
| Semi-final | 2 |
| Round 1/4 | 4 |

That is 15 boxes in total (size × 2 − 1) and 7 columns.

| Size | Boxes | Columns | Default width | Default height |
|---|---|---|---|---|
| 8 | 15 | 7 | about 1290px | 320px |
| 16 | 31 | 9 | about 1670px | 640px |
| 32 | 63 | 11 | about 2050px | 1280px |

The gray box scrolls sideways when the bracket is wider than the page.

---

## 6. Testing

Start the emulator:

```
firebase emulators:start --only hosting
```

Open these addresses and press Ctrl + Shift + R:

- `http://localhost:5000/?size=8`
- `http://localhost:5000/?size=16`
- `http://localhost:5000/?size=32`
- `http://localhost:5000/pages/bracket.html?size=16`

Check that:
- Round 1 has 4, 8 or 16 boxes on each side, depending on the size.
- Every box has a Vote button, except the Winner.
- The lines connect with no gaps at every size.
- `?size=10` falls back to 8.
- The Console tab shows no red errors.



## What changes later

- The size will come from the challenge in Firestore (`bracketSize`), not from `?size=`.
- The bracket page will read `?challenge=ID` from the address and load that challenge.
- Two boxes that face each other will be one matchup document. The first box shows `itemA` and the second shows `itemB`.
- The winner of a matchup will move into the next round's box.
- TBD will be replaced with real item names. Use `textContent` for them.
- Vote buttons will be enabled for the active round only.
- The bracket is big. We can shrink the CSS variables if needed.

---

