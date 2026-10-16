# Bracket for 8, 16 and 32 Teams — How It Works

## What does this do?

The bracket on the home page (and on `bracket.html`) is not typed by hand.
A JavaScript file builds it from a size: 8, 16 or 32 teams.

- Every box holds **one item**, and every box has its own Vote button.
- The box across the connector line is its opponent. The two boxes are one matchup, and people vote for one of them.
- The winner of a matchup moves into the next column.
- The box in the middle is the **Winner**. It has no Vote button.
- The bracket is empty for now: every box says TBD and the Vote buttons are disabled.

---

## The files

| File | Job |
|---|---|
| `frontend/js/bracket.js` | Builds the bracket HTML for a given size |
| `frontend/css/bracket.css` | Draws the boxes, columns and connecting lines |
| `frontend/index.html` | Has a place for the bracket (`bracket-root`) and loads the script |
| `frontend/pages/bracket.html` | Same place and same script, as its own page |

The flow:

```
page loads -> bracket.js reads the size -> builds the HTML -> bracket.css styles it
```

---

## Section 1 — index.html and bracket.html

The hand-typed bracket was replaced with an empty box:

```html
<section class="bracket-section">
  <h2 class="bracket-heading">Current Bracket</h2>
  <div id="bracket-root"></div>
</section>
```

- `bracket-root` is the spot where JavaScript puts the bracket.
- `bracket.css` is linked in the `<head>`.
- `bracket.js` is loaded at the bottom with `type="module"`.

```html
<script type="module" src="/js/bracket.js"></script>
```

`type="module"` is needed because `bracket.js` uses `export`.

---

## Section 2 — bracket.js

### How the size becomes a bracket

- Each round has half as many matchups as the one before.
- A matchup has two boxes, one for each item.
- A side of the bracket has one column for each round. The Winner is in the middle.

| Size | Rounds on each side | Matchups | Boxes in total | Columns on screen |
|---|---|---|---|---|
| 8 | 3 | 7 | 15 | 7 |
| 16 | 4 | 15 | 31 | 9 |
| 32 | 5 | 31 | 63 | 11 |

- Rounds = `Math.log2(size)`.
- Matchups = size - 1.
- Boxes = size × 2 - 1, including the Winner box.

Round names, from the outside in:

| Size | Names |
|---|---|
| 8 | Round 1/4, Semi-final, Final, then Winner |
| 16 | Round 1/8, Round 1/4, Semi-final, Final, then Winner |
| 32 | Round 1/16, Round 1/8, Round 1/4, Semi-final, Final, then Winner |

The last column on each side is labelled Final. It holds one finalist. The two finalists meet in the middle at the Winner box.

### The functions

**`roundName(matchCount)`**
- 1 matchup gives "Final".
- 2 matchups give "Semi-final".
- Anything else gives "Round 1/" and the number, for example "Round 1/8".

**`makeMatchup(showVote)`**
- Makes one box: one TBD slot, and a Vote button only when `showVote` is true.
- The default is `true`. `makeMatchup(false)` makes a box with no button.
- It uses `innerHTML` because the text is fixed.
- When real item names are added, set them with `textContent`. This stops a user from putting HTML into an item name.

**`makeRound(roundNumber, totalRounds, size)`**
- Makes one column with its label and its boxes.
- `matchCount = size / 2 ** roundNumber` is the number of matchups in that round, both sides together.
- Each matchup has two boxes, so one side gets `matchCount` boxes.
- It sets `--span` (1, 2, 4, 8...) and adds classes that tell the CSS which lines to draw:

| Class | Which round | Used for |
|---|---|---|
| `round-first` | Round 1 | No line coming in, solid borders |
| `round-pairs` | Every round except the last | A line out, then a vertical line |
| `round-in` | Every round except round 1 | A short line coming in |
| `round-last` | The last round on each side | A straight line to the Winner |
| `round-winner` | The middle column | No lines |

**`makeWinner()`**
- Makes the middle column with the label "Winner" and one box with no Vote button.

**`renderBracket(container, size)`**
- If the size is not 8, 16 or 32, it uses 8.
- It builds a left half, the Winner, and a right half.
- The left half adds rounds with `append`, so round 1 is on the far left.
- The right half adds rounds with `prepend`, so round 1 is on the far right.
- It sets `--rows` to `size / 2`. This is how many boxes round 1 has on one side.
- `replaceChildren` puts the finished bracket in the page.

**The last lines of the file**
- If the page has `bracket-root`, the bracket is drawn.
- For now the size is read from the address: `?size=16`. If it is missing, the size is 8.

---

## Section 3 — bracket.css

### The variables

They are at the top of `.bracket`. Change them in one place to resize everything.

| Variable | Meaning |
|---|---|
| `--match-w` | Width of one box |
| `--slot-h` and `--vote-h` | Height of the item slot and of the Vote button |
| `--cell` | Height given to one round-1 box. It must be bigger than a box (about 62px) |
| `--gap` | Space between columns (the lines live here) |
| `--line` | Style of the connecting lines |
| `--rows` | Set by JavaScript: boxes in round 1 on one side |
| `--span` | Set by JavaScript: how many cells tall each box of that round is |

### The layout

```
.bracket                      gray box, scrolls sideways on small screens
  .bracket-tree               one row of columns, centered
    .bracket-half .bracket-left     round 1 ... Final
    .round .round-winner            the Winner
    .bracket-half .bracket-right    Final ... round 1
```

- Every `.round` has the same height: `--cell * --rows`.
- `justify-content: space-around` puts each box in the middle of its own equal-size cell.
- Round 1 has the most boxes, so its cells are the smallest. Each later round has half as many boxes, so its cells are twice as tall.
- Because of this, each box sits exactly halfway between the two boxes that feed into it.
- The round labels use `position: absolute`, so they do not move the boxes.
- `overflow-x: auto` on `.bracket` lets the gray box scroll sideways. The whole page does not scroll.

### The connecting lines

The lines are drawn with borders on `::before` and `::after` pieces. No images are used.

- **`round-in` `::before`:** a short line on the side facing the previous round.
- **`round-pairs` `::after`:** a short line out, then a vertical line.
  - The first box of a pair (odd) goes down.
  - The second box of a pair (even) goes up.
  - The vertical length is half of the round's cell height: `--cell * --span / 2`.
  - The two vertical lines meet at the height of the next round's box.
- **`round-last` `::after`:** a straight line to the Winner.
- **Left and right:** `.bracket-left` and `.bracket-right` mirror the same lines.
- **The `+ 1px` values:** they cover the box border so the lines touch with no gaps.

### Later rounds look faded

Every column except round 1 has dashed borders and gray text. This includes the Winner.

### The Winner box

- It has one slot and no Vote button.
- `.slot:last-child { border-bottom: 0; }` removes the bottom line from a slot that is the last thing in its box. This only happens in the Winner box.

---

## Section 4 — Testing

Start the emulator:

```
firebase emulators:start --only hosting
```

Open these addresses:

- `http://localhost:5000/?size=8`
- `http://localhost:5000/?size=16`
- `http://localhost:5000/?size=32`
- `http://localhost:5000/pages/bracket.html?size=16`

Check that:
- Round 1 has 4, 8 or 16 boxes on each side, depending on the size.
- Every box has a Vote button, except the Winner.
- The lines connect with no gaps at every size.
- `?size=10` falls back to 8.
- On a narrow window, the gray box scrolls sideways.

---

## Section 5 — What changes later

- The size will come from the challenge in Firestore (`bracketSize`), not from `?size=`.
- The bracket page will read `?challenge=ID` from the address and load that challenge.
- Two boxes that face each other will be one matchup document. The first box shows `itemA` and the second shows `itemB`.
- The winner of a matchup will move into the next round's box.
- TBD will be replaced with real item names. Use `textContent` for them.
- Vote buttons will be enabled for the active round only.
- The bracket is big. With the default sizes, 8 teams is about 1290px wide, 16 teams about 1670px wide, and 32 teams about 2050px wide and 1280px tall. We can shrink the variables if needed.

---
