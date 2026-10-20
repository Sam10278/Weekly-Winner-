# Bracket Page — Line by Line

This file explains how the bracket page reads a challenge from Firestore and draws it.
Open the real files next to this document and read both together.

---

## What does the bracket page do?

- It opens a challenge that Start Challenge saved.
- It draws the bracket with the real item names and the vote counts.
- It updates by itself when the data changes. Nobody needs to refresh.
- It shows a line above the bracket: the category, the size, and a countdown for the active round.
- Winners are bold. Losers are crossed out. Boxes that are not decided yet say TBD.
- The Vote buttons are disabled. Voting comes later, with a Cloud Function.

## The files

| File | Job |
|---|---|
| `frontend/js/bracket.js` | Loads the data and builds the bracket |
| `frontend/css/bracket.css` | Styles the boxes and draws the lines |
| `frontend/pages/bracket.html` | The page for one challenge |
| `frontend/index.html` | The home page. It shows the newest challenge |
| `frontend/js/app.js` | Starts Firebase. Exports `db` |

The flow:

```
page opens -> bracket.js reads the address -> listens to Firestore -> builds the boxes -> bracket.css styles them
```

## What the address decides

| Address | What the page shows |
|---|---|
| `/pages/bracket.html?challenge=ID` | That challenge, live |
| `/index.html` (no `challenge` in the address) | The newest challenge |
| `?size=16` and no `challenge` | An empty demo bracket with that size |
| No challenges exist | The message "No challenges yet..." and an empty 8-team bracket |

---

## The data it reads

Start Challenge saves these. The bracket page only reads them.

**`challenges/{id}`**

| Field | Meaning |
|---|---|
| `bracketSize` | 8, 16 or 32 |
| `roundEndsAt` | When the first round ends (a Firestore timestamp) |
| `categoryId` | The category the items came from |
| `status` | `"open"` |
| `createdBy`, `createdAt` | Who made it, and when |
| `categoryName` | Optional. Not saved now. If it exists, it is used as the title |

**`matchups/{id}`**

| Field | Meaning |
|---|---|
| `challengeId` | Which challenge this matchup belongs to |
| `round` | 1 is the first round |
| `position` | 0 is the first matchup of that round |
| `itemA`, `itemB` | `{ id, name, imageUrl }`, or `null` (null means TBD) |
| `votesA`, `votesB` | Vote counts. They start at 0 |
| `winnerId` | The id of the winning item, or `null` |

Example of one matchup:

```javascript
{
  challengeId: "abc123",
  round: 1,
  position: 0,
  itemA: { id: "i1", name: "CC's Coffee", imageUrl: "" },
  itemB: { id: "i2", name: "PJ's Coffee", imageUrl: "" },
  votesA: 3,
  votesB: 1,
  winnerId: null
}
```

---

## How the data becomes boxes

- Every box is one item.
- One matchup is two boxes facing each other. The first is `itemA`, the second is `itemB`.
- The left side of the bracket shows the first half of the matchups. The right side shows the second half.

Example, 8 teams:

| Column | Box (top to bottom) | Matchup (`round-position`) | Slot |
|---|---|---|---|
| Round 1, left | 1st | `1-0` | A |
| Round 1, left | 2nd | `1-0` | B |
| Round 1, left | 3rd | `1-1` | A |
| Round 1, left | 4th | `1-1` | B |
| Round 1, right | 1st | `1-2` | A |
| Round 1, right | 2nd | `1-2` | B |
| Round 1, right | 3rd | `1-3` | A |
| Round 1, right | 4th | `1-3` | B |
| Semi-final, left | 1st | `2-0` | A |
| Semi-final, left | 2nd | `2-0` | B |
| Semi-final, right | 1st | `2-1` | A |
| Semi-final, right | 2nd | `2-1` | B |
| Final, left | only box | `3-0` | A |
| Final, right | only box | `3-0` | B |
| Winner | only box | `3-0` | the item whose id is `winnerId` |

**The rule for moving a winner forward** (the Cloud Function will follow it later):

- The winner of position `p` in round `r` goes to round `r + 1`, position `floor(p / 2)`.
- It goes in `itemA` if `p` is even, and in `itemB` if `p` is odd.
- It saves the same object: `{ id, name, imageUrl }`.

---

# Part 1 — The HTML (bracket.html and index.html)

```html
<link rel="stylesheet" href="/css/bracket.css">
```

- Goes in the `<head>`. It loads the bracket styles.
- It starts with `/`, so it always starts from the root of the site.

```html
<section class="bracket-section">
  <h2 class="bracket-heading">Current Bracket</h2>
  <div id="bracket-root"></div>
</section>
```

- `<div id="bracket-root">` is an empty box. `bracket.js` puts the bracket here.
- The `id` must be exactly `bracket-root`. The same name is in `getElementById("bracket-root")`.
- `bracket.js` also makes a `<p id="bracket-info">` and puts it just before this box.

```html
<script type="module" src="/js/auth.js"></script>
<script type="module" src="/js/bracket.js"></script>
```

- `auth.js` makes the navbar work (Login, Logout, profile).
- `bracket.js` draws the bracket.
- `type="module"` is needed because `bracket.js` uses `import`.
- `bracket.html` is a copy of `base.html` with these three pieces added.

---

# Part 2 — bracket.js

## The comment at the top

```javascript
// Draws the bracket.
//   bracket.html?challenge=ID  -> loads that challenge from Firestore (live)
//   index.html with no address -> loads the newest challenge
//   ?size=16 with no challenge -> empty demo bracket, for testing the layout
//
// What Start Challenge saves, and what this file reads:
//   challenges/{id}: bracketSize, roundEndsAt, categoryId
//   matchups/{id}:   challengeId, round, position, itemA, itemB, votesA, votesB, winnerId
//   itemA and itemB are { id, name, imageUrl }, or null (null = TBD).
//   winnerId is the id of the winning item, or null.
```

- `//` starts a comment. The browser ignores it.
- This comment lists the three ways to open the page, and the shape of the data.

## Imports

```javascript
import { db } from "./app.js";
```

- `db` is the database connection. `app.js` starts it.
- `./` means "the same folder as this file".

```javascript
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
```

| Name | What it does |
|---|---|
| `doc` | Points to one document by its path |
| `getDoc` | Reads one document, one time |
| `getDocs` | Reads many documents, one time |
| `collection` | Points to a collection |
| `query` | Builds a search over a collection |
| `where` | A filter inside a search |
| `orderBy` | Sorts the answer |
| `limit` | Keeps only the first few answers |
| `onSnapshot` | Listens live. It runs again every time the data changes |

- Every Firebase import uses version `10.0.0`, the same as `app.js`.

```javascript
const ALLOWED_SIZES = [8, 16, 32];
```

- A list (an array) of the sizes we support.
- It is in capital letters because the value never changes.

## roundName

```javascript
function roundName(matchCount) {
  if (matchCount === 1) {
    return "Final";
  }
  if (matchCount === 2) {
    return "Semi-final";
  }
  return `Round 1/${matchCount}`;
}
```

- It receives the number of matchups in a round, both sides together.
- `===` means "is exactly equal".
- 1 matchup gives "Final". 2 matchups give "Semi-final".
- Any other number gives `Round 1/` and the number, for example `Round 1/8`.
- The backticks make a template string. `${matchCount}` puts the value inside the text.

## getContender

It turns one slot of a matchup into a small object for one box.

```javascript
function getContender(matchup, slotName) {
  if (!matchup) {
    return null;
  }
```

- `matchup` is one matchup document, or `undefined` if there is none.
- `!matchup` means "there is no matchup". Then the box is TBD, so it returns `null`.

```javascript
  let item = null;
  let votes = 0;

  if (slotName === "A") {
    item = matchup.itemA;
    votes = matchup.votesA;
  } else {
    item = matchup.itemB;
    votes = matchup.votesB;
  }
```

- `let` makes a name whose value can change.
- It picks `itemA` and `votesA` for slot "A", and `itemB` and `votesB` for slot "B".

```javascript
  if (!item) {
    return null;
  }
```

- The slot is `null` when the round has not been decided yet. The box says TBD.

```javascript
  const decided = matchup.winnerId !== null && matchup.winnerId !== undefined;
```

- `!==` means "is not exactly equal". `&&` means "and".
- `decided` is true when `winnerId` has a value. Start Challenge saves `winnerId: null`, so a new matchup is not decided.

```javascript
  return {
    name: item.name || "(no name)",
    imageUrl: item.imageUrl || "",
    votes: Number(votes) || 0,
    isWinner: decided && matchup.winnerId === item.id,
    isLoser: decided && matchup.winnerId !== item.id
  };
}
```

- `||` means "or". `item.name || "(no name)"` uses the name, or "(no name)" if it is empty.
- `Number(votes) || 0` makes sure the vote count is a number.
- `isWinner` is true when the matchup is decided and this item won.
- `isLoser` is true when the matchup is decided and this item did not win.

## findSlot

It answers: which matchup, and which slot, belongs to a box?

```javascript
function findSlot(matchCount, side, i) {
```

- `matchCount`: matchups in this round, both sides together.
- `side`: `"left"` or `"right"`.
- `i`: the box number from the top (0, 1, 2...).

```javascript
  if (matchCount === 1) {
    // the final: the left finalist is A, the right finalist is B
    if (side === "left") {
      return { position: 0, slotName: "A" };
    }
    return { position: 0, slotName: "B" };
  }
```

- The final has one matchup. The left box is slot A, and the right box is slot B.

```javascript
  // the left side has the first half of the matchups, the right side the rest
  let start = 0;
  if (side === "right") {
    start = matchCount / 2;
  }
```

- The left side starts at position 0.
- The right side starts halfway. With 4 matchups, the right side starts at position 2.

```javascript
  let slotName = "A";
  if (i % 2 === 1) {
    slotName = "B";
  }

  return { position: start + Math.floor(i / 2), slotName: slotName };
}
```

- `%` gives the rest of a division. `i % 2` is 0 for even `i` and 1 for odd `i`.
- Even boxes (0, 2, 4...) are slot A. Odd boxes (1, 3, 5...) are slot B.
- `Math.floor(i / 2)` rounds down. Boxes 0 and 1 are matchup 0. Boxes 2 and 3 are matchup 1.
- `start + ...` adds the starting position of the side.

## makeBox

It builds one box.

```javascript
function makeBox(contender, showVote) {
  const box = document.createElement("div");
  box.className = "matchup";

  const slot = document.createElement("div");
  slot.className = "slot";
```

- `contender` is the object from `getContender`, or `null`.
- `showVote` is `true` for a box with a Vote button, and `false` for none.
- `document.createElement("div")` makes a new element in memory. It is not on the page yet.
- `className` sets the CSS class. `bracket.css` uses these names.
- The class is named `matchup`, but one box is one item.

```javascript
  if (contender && contender.imageUrl) {
    const image = document.createElement("img");
    image.className = "slot-image";
    image.src = contender.imageUrl;
    image.alt = "";
    image.referrerPolicy = "no-referrer";
    slot.append(image);
  }
```

- It adds a picture only when the item has an `imageUrl`.
- `alt = ""` is right here, because the name is written next to the picture.
- `referrerPolicy = "no-referrer"` keeps some image sites from blocking the picture.
- The rules allow only `https://` links.

```javascript
  const name = document.createElement("span");
  name.className = "slot-name";
  if (contender) {
    name.textContent = contender.name;
  } else {
    name.textContent = "TBD";
  }
  slot.append(name);
```

- It uses `textContent`, never `innerHTML`. A user typed the name. With `textContent`, HTML in a name is shown as plain text and never runs.
- `null` gives "TBD".

```javascript
  if (contender && contender.votes !== undefined) {
    const votes = document.createElement("span");
    votes.className = "slot-votes";
    votes.textContent = contender.votes;
    slot.append(votes);
  }

  box.append(slot);
```

- The vote count is shown only when the box has an item. The winner box has no `votes`, so it shows none.
- `box.append(slot)` puts the slot in the box.

```javascript
  if (contender && contender.isWinner) {
    box.classList.add("is-winner");
  }
  if (contender && contender.isLoser) {
    box.classList.add("is-loser");
  }
```

- `classList.add` adds one more class. The CSS makes a winner bold and a loser crossed out.

```javascript
  if (showVote) {
    const voteBtn = document.createElement("button");
    voteBtn.type = "button";
    voteBtn.className = "vote-btn";
    voteBtn.textContent = "Vote";
    voteBtn.disabled = true;   // voting comes later, with a Cloud Function
    box.append(voteBtn);
  }

  return box;
}
```

- `disabled = true` means nobody can click it yet.
- `return box` gives the finished box back to the caller.

## makeRound

It builds one column on one side.

```javascript
function makeRound(roundNumber, totalRounds, size, side, matchupMap) {
  const matchCount = size / 2 ** roundNumber;
  const perSide = matchCount;
```

- `2 ** roundNumber` means 2 to the power of the round number. The power runs first.
- `matchCount` is the number of matchups in this round, both sides together.
- A matchup has two boxes, and one side has half of the matchups. So one side has `matchCount` boxes.

| Size | Round 1 | Round 2 | Round 3 | Round 4 | Round 5 |
|---|---|---|---|---|---|
| 8 | 4 | 2 | 1 | | |
| 16 | 8 | 4 | 2 | 1 | |
| 32 | 16 | 8 | 4 | 2 | 1 |

```javascript
  const round = document.createElement("div");
  round.className = "round";
  round.style.setProperty("--span", 2 ** (roundNumber - 1));
```

- `style.setProperty("--span", ...)` sets a CSS variable on the column.
- It gives 1, 2, 4, 8 for rounds 1, 2, 3, 4. The CSS uses it for the length of the lines.

```javascript
  if (roundNumber === 1) {
    round.classList.add("round-first");
  }
  if (roundNumber <= totalRounds - 1) {
    round.classList.add("round-pairs");
  }
  if (roundNumber >= 2) {
    round.classList.add("round-in");
  }
  if (roundNumber === totalRounds) {
    round.classList.add("round-last");
  }
```

| Class | Added when | CSS uses it for |
|---|---|---|
| `round-first` | round 1 | No line coming in. Solid borders |
| `round-pairs` | every round except the last | A line out, then a vertical line |
| `round-in` | every round except round 1 | A short line coming in |
| `round-last` | the last round on each side | A straight line to the Winner |

```javascript
  const label = document.createElement("h3");
  label.className = "round-label";
  label.textContent = roundName(matchCount);
  round.append(label);
```

- The heading above the column, such as "Semi-final".

```javascript
  for (let i = 0; i < perSide; i++) {
    const spot = findSlot(matchCount, side, i);
    const matchup = matchupMap.get(`${roundNumber}-${spot.position}`);

    round.append(makeBox(getContender(matchup, spot.slotName), true));
  }

  return round;
}
```

- This is a loop. `i` starts at 0, and goes up by 1 (`i++`) while `i < perSide`.
- `findSlot` tells which matchup and slot this box needs.
- `matchupMap.get("1-0")` finds the matchup for round 1, position 0.
- `getContender` makes the box object. `makeBox` builds the box. `true` means it has a Vote button.
- `return round` gives the column back.

## makeWinner

It builds the middle column.

```javascript
function makeWinner(totalRounds, matchupMap) {
  const round = document.createElement("div");
  round.className = "round round-winner";

  const label = document.createElement("h3");
  label.className = "round-label";
  label.textContent = "Winner";
  round.append(label);
```

- Two class names are separated by a space. An element can have many classes.

```javascript
  let winner = null;
  const finalMatchup = matchupMap.get(`${totalRounds}-0`);

  if (finalMatchup && finalMatchup.winnerId) {
    if (finalMatchup.itemA && finalMatchup.itemA.id === finalMatchup.winnerId) {
      winner = finalMatchup.itemA;
    } else if (finalMatchup.itemB && finalMatchup.itemB.id === finalMatchup.winnerId) {
      winner = finalMatchup.itemB;
    }
  }
```

- The final is the last round, position 0. For 8 teams, the key is `3-0`.
- If it has a `winnerId`, the code finds which item has that id.
- `else if` runs only when the first test was false.

```javascript
  let contender = null;
  if (winner) {
    contender = {
      name: winner.name || "(no name)",
      imageUrl: winner.imageUrl || "",
      isWinner: true
    };
  }

  round.append(makeBox(contender, false));
  return round;
}
```

- With no winner yet, `contender` is `null`, and the box says TBD.
- `false` means no Vote button, because nobody votes on the winner.

## renderBracket

```javascript
export function renderBracket(container, size = 8, matchups = []) {
```

- `export` lets other files use this function.
- `size = 8` and `matchups = []` are default values. With no matchups, the bracket is empty (all TBD).

```javascript
  if (!ALLOWED_SIZES.includes(size)) {
    size = 8;
  }
  const totalRounds = Math.log2(size);   // 8 -> 3, 16 -> 4, 32 -> 5
```

- A size that is not allowed becomes 8.
- `Math.log2` tells how many times you divide by 2 to reach 1. It is the number of rounds on each side.

```javascript
  const matchupMap = new Map();
  matchups.forEach((matchup) => {
    matchupMap.set(`${matchup.round}-${matchup.position}`, matchup);
  });
```

- A `Map` is a lookup table. The key is `round-position`, like `1-0`.
- This lets `makeRound` find a matchup fast.

```javascript
  const oldBracket = container.querySelector(".bracket");
  let scrollLeft = 0;
  if (oldBracket) {
    scrollLeft = oldBracket.scrollLeft;
  }
```

- The bracket is drawn again on every change. This remembers how far the user scrolled sideways.

```javascript
  const left = document.createElement("div");
  left.className = "bracket-half bracket-left";
  const right = document.createElement("div");
  right.className = "bracket-half bracket-right";

  for (let r = 1; r <= totalRounds; r++) {
    left.append(makeRound(r, totalRounds, size, "left", matchupMap));
    right.prepend(makeRound(r, totalRounds, size, "right", matchupMap));
  }
```

- Two containers, one for each side.
- `<=` includes the last round.
- `append` adds at the end. `prepend` adds at the start.
- Left side: round 1 is added first, so it is on the far left.
- Right side: each new round goes before the others, so round 1 is on the far right.

```javascript
  const tree = document.createElement("div");
  tree.className = "bracket-tree";
  tree.append(left, makeWinner(totalRounds, matchupMap), right);

  const bracket = document.createElement("div");
  bracket.className = "bracket";
  bracket.style.setProperty("--rows", size / 2);
  bracket.append(tree);
```

- `tree` is one row: left side, the Winner, right side.
- `bracket` is the gray outer box.
- `--rows` is the number of boxes in round 1 on one side: 8 gives 4, 16 gives 8, 32 gives 16.

```javascript
  container.replaceChildren(bracket);
  bracket.scrollLeft = scrollLeft;
}
```

- `replaceChildren` removes what was inside, then puts the new bracket in. Calling it again does not draw two brackets.
- The last line puts the sideways scroll back.

## formatTime

```javascript
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}
```

- `ms` is a number of milliseconds. 1000 ms is 1 second.
- `Math.floor` rounds down.
- `%` gives the rest of a division. `totalSeconds % 3600` is what is left after full hours.
- `padStart(2, "0")` adds a zero in front, so 5 becomes `05`.
- The result looks like `23h 59m 58s`.

## activeRound

```javascript
function activeRound(matchups, totalRounds) {
  for (let r = 1; r <= totalRounds; r++) {
    const undecided = matchups.some((m) => m.round === r && !m.winnerId);
    if (undecided) {
      return r;
    }
  }
  return null;
}
```

- It checks the rounds one by one, from round 1.
- `some` is true when at least one matchup passes the test.
- The test: the matchup is in round `r` and has no winner.
- It returns the first round with an undecided matchup. That round is the active one.
- `null` means every round is decided. The challenge is finished.

## loadCategoryName

```javascript
async function loadCategoryName(categoryId) {
  try {
    const snap = await getDoc(doc(db, "categories", categoryId));
    if (snap.exists()) {
      return snap.data().name || "";
    }
    return "";
  } catch (error) {
    console.error("Error loading the category name:", error);
    return "";
  }
}
```

- `async` lets the function wait with `await`.
- `doc(db, "categories", categoryId)` points to one category. `getDoc` reads it one time.
- `snap.exists()` is true when the document is there. `snap.data()` gives its fields.
- If something fails, `catch` writes the error in the Console and returns empty text. The page still works.
- Start Challenge does not save `categoryName` now, so the page reads the category to get its name. This is 1 extra read.

## findLatestChallengeId

```javascript
async function findLatestChallengeId() {
  const newest = query(
    collection(db, "challenges"),
    orderBy("createdAt", "desc"),
    limit(1)
  );

  const snap = await getDocs(newest);

  if (snap.empty) {
    return null;
  }
  return snap.docs[0].id;
}
```

- The search: all challenges, newest first (`"desc"` is large to small), and keep only 1.
- `snap.empty` is true when there are no challenges. Then it returns `null`.
- `snap.docs[0].id` is the id of the first document.
- `orderBy` on one field needs no special index.

## watchChallenge

It listens to one challenge and its matchups, and redraws when they change.

```javascript
function watchChallenge(root, info, challengeId) {
  let challenge = null;
  let matchups = [];
  let matchupsReady = false;
  let categoryName = "";
  let categoryRequested = false;
```

- These variables remember what the page knows: the challenge, its matchups, whether the matchups arrived, and the category name.
- `categoryRequested` makes sure the category is read only once.

```javascript
  function updateInfo() {
    if (!challenge) {
      return;
    }

    const size = challenge.bracketSize;
    const totalRounds = Math.log2(size);
    const title = challenge.categoryName || categoryName || "Challenge";
```

- `updateInfo` writes the line above the bracket.
- With no challenge yet, it stops.
- The title: the saved `categoryName`, or the category read from Firestore, or the word "Challenge".

```javascript
    let status = "";

    if (matchupsReady && matchups.length > 0) {
      const round = activeRound(matchups, totalRounds);

      if (round === null) {
        status = "Finished";
      } else {
        const name = roundName(size / 2 ** round);

        let end = 0;
        if (challenge.roundEndsAt) {
          end = challenge.roundEndsAt.toMillis();
        }

        const remaining = end - Date.now();

        if (remaining <= 0) {
          status = `${name} has ended`;
        } else {
          status = `${name} ends in ${formatTime(remaining)}`;
        }
      }
    }
```

- It builds the status only when the matchups have arrived.
- `null` from `activeRound` means "Finished".
- `roundName(size / 2 ** round)` gives the name of the active round.
- `roundEndsAt` is a Firestore timestamp. `toMillis()` turns it into milliseconds.
- `Date.now()` is the time now, in milliseconds. The difference is the time left.
- If no time is left, it says the round "has ended".

```javascript
    const parts = [title, `${size} teams`];
    if (status) {
      parts.push(status);
    }
    info.textContent = parts.join(" · ");
  }
```

- It joins the pieces with ` · `, for example `Best Coffee · 8 teams · Round 1/4 ends in 23h 59m 58s`.

```javascript
  function redraw() {
    if (!challenge || !matchupsReady) {
      return;
    }
    renderBracket(root, challenge.bracketSize, matchups);
    updateInfo();
  }
```

- It draws only when both the challenge and its matchups have arrived.

```javascript
  onSnapshot(
    doc(db, "challenges", challengeId),
    (snap) => {
      if (!snap.exists()) {
        info.textContent = "This challenge was not found.";
        root.replaceChildren();
        return;
      }

      challenge = snap.data();

      if (!ALLOWED_SIZES.includes(challenge.bracketSize)) {
        info.textContent = "This challenge has an invalid bracket size.";
        root.replaceChildren();
        challenge = null;
        return;
      }

      if (!categoryRequested && !challenge.categoryName && challenge.categoryId) {
        categoryRequested = true;
        loadCategoryName(challenge.categoryId).then((name) => {
          categoryName = name;
          updateInfo();
        });
      }

      redraw();
    },
    (error) => {
      console.error("Error loading the challenge:", error);
      info.textContent = `Could not load the challenge (${error.code || "unknown error"}).`;
    }
  );
```

- `onSnapshot` has three parts: what to listen to, what to do with an answer, and what to do with an error.
- The answer function runs once at the start, and again every time the challenge changes.
- No document: it shows "This challenge was not found." and empties the bracket.
- A bad size: it shows a message and stops.
- If there is no saved `categoryName`, it reads the category one time. `.then` runs when the answer arrives.
- The error function shows the error code, like `permission-denied`.

```javascript
  onSnapshot(
    query(collection(db, "matchups"), where("challengeId", "==", challengeId)),
    (snap) => {
      matchups = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      matchupsReady = true;
      redraw();
    },
    (error) => {
      console.error("Error loading the matchups:", error);
      info.textContent = `Could not load the matchups (${error.code || "unknown error"}).`;
    }
  );
```

- The search: all matchups where `challengeId` is this challenge.
- `.docs.map(...)` turns each document into an object. `id: d.id` adds the document id, and `...d.data()` copies all its fields.
- This runs at the start, and again every time any matchup changes. A new vote or a new winner updates every open page.

```javascript
  setInterval(updateInfo, 1000);
}
```

- `setInterval` runs a function again and again. This one runs every 1000 ms, which is 1 second.
- It only updates the line of text, so the countdown ticks. The whole bracket is redrawn only when the data changes.

## start

```javascript
async function start() {
  const root = document.getElementById("bracket-root");
  if (!root) {
    return;
  }
```

- If the page has no `bracket-root`, the code does nothing. This keeps other pages safe.

```javascript
  const info = document.createElement("p");
  info.id = "bracket-info";
  root.before(info);
```

- It makes the line of text and puts it just before the bracket box.

```javascript
  const params = new URLSearchParams(location.search);
  let challengeId = params.get("challenge");
  const demoSize = Number(params.get("size"));
```

- `location.search` is the part of the address that starts with `?`.
- `params.get("challenge")` gives the challenge id, or `null`.
- `Number(params.get("size"))` is the demo size, or 0.

```javascript
  if (!challengeId && demoSize) {
    info.textContent = `Demo bracket · ${demoSize} teams (empty)`;
    renderBracket(root, demoSize);
    return;
  }
```

- With no challenge but a `size`, it draws an empty bracket. This is for testing the layout.

```javascript
  if (!challengeId) {
    info.textContent = "Looking for the newest challenge...";

    try {
      challengeId = await findLatestChallengeId();
    } catch (error) {
      console.error("Error loading challenges:", error);
      info.textContent = `Could not load challenges (${error.code || "unknown error"}).`;
      return;
    }
  }
```

- With no address at all, it finds the newest challenge. The home page works this way.

```javascript
  if (!challengeId) {
    info.textContent = "No challenges yet. Start one on the Start Challenge page.";
    renderBracket(root, 8);
    return;
  }

  watchChallenge(root, info, challengeId);
}

start();
```

- No challenge anywhere: a message and an empty bracket, so the page is not blank.
- Otherwise, `watchChallenge` starts the live listeners.
- The last line, `start();`, runs everything.

---

# Part 3 — bracket.css

## Page spacing

```css
.bracket-section {
  padding: 24px 20px;
}

.bracket-heading {
  margin: 0 0 16px;
  font-size: 20px;
}
```

- `padding: 24px 20px` adds inside space: 24px on top and bottom, 20px on the left and right.
- `margin: 0 0 16px` adds outside space: 16px below the heading.

## The gray box and its variables

```css
.bracket {
  --match-w: 150px;
  --slot-h: 32px;
  --vote-h: 28px;
  --cell: 80px;
  --gap: 40px;
  --line: 2px solid #888;
```

- Names that start with `--` are CSS variables. You use them with `var(--name)`.

| Variable | Meaning |
|---|---|
| `--match-w` | Width of one box |
| `--slot-h` | Height of the item slot |
| `--vote-h` | Height of the Vote button |
| `--cell` | Height given to one round-1 box. It must be bigger than a box (about 62px) |
| `--gap` | Space between columns. The lines are drawn here |
| `--line` | Style of the connecting lines |
| `--rows` | Set by JavaScript: boxes in round 1 on one side |
| `--span` | Set by JavaScript: how many cells tall each box of that round is |

```css
  padding: 44px 20px 24px;
  background: #f1f1f1;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow-x: auto;
}
```

- `padding` is top, left and right, bottom. The big top space is for the round labels.
- `overflow-x: auto` adds a sideways scroll bar when the bracket is wider than the box.

```css
.bracket *,
.bracket *::before,
.bracket *::after {
  box-sizing: border-box;
}
```

- `*` means every element inside the bracket. `::before` and `::after` are the line pieces.
- `border-box` means a width includes the border and padding. It keeps the sizes easy to calculate.

## Layout

```css
.bracket-tree {
  display: flex;
  align-items: center;
  gap: var(--gap);
  width: max-content;
  margin: 0 auto;
}

.bracket-half {
  display: flex;
  gap: var(--gap);
}
```

- `display: flex` puts the children in one row.
- `align-items: center` centers them top to bottom.
- `width: max-content` makes the row as wide as all its columns.
- `margin: 0 auto` centers the row when there is extra room. When it is wider than the box, it starts at the left and the user scrolls.

```css
.round {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  height: calc(var(--cell) * var(--rows, 2));
}
```

- `flex-direction: column` stacks the boxes top to bottom.
- `justify-content: space-around` gives each box an equal slice of the column, with the box in the middle of its slice. This is why the lines meet exactly.
- `height` is the cell height times `--rows`. Every column has the same height, including the Winner column.
- `2` after the comma is a backup value if `--rows` is missing.

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

- `position: absolute` takes the label out of the normal flow, so it does not move the boxes.
- `top: -28px` puts it above the column. The padding of `.bracket` makes room for it.

## Boxes

```css
.matchup {
  position: relative;
  width: var(--match-w);
  background: #fff;
  border: 1px solid #999;
}

.slot {
  display: flex;
  align-items: center;
  height: var(--slot-h);
  padding: 0 10px;
  font-size: 13px;
  color: #000;
  border-bottom: 1px solid #ddd;
}

.slot:last-child {
  border-bottom: 0;
}
```

- `.matchup` is one box. `position: relative` makes it the reference point for its line pieces.
- `.slot` is the row with the item. `display: flex` puts the picture, the name, and the count in one row.
- `.slot:last-child` matches a slot that is the last thing in its box. Only the Winner box has no Vote button, so only it is affected. This removes the extra line at its bottom.

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

.vote-btn:disabled {
  cursor: not-allowed;
  opacity: 0.75;
}
```

- `font-family: inherit` copies the page font. Buttons do not do this by default.
- `:disabled` matches only buttons with the `disabled` attribute.
- `cursor: not-allowed` shows the "no" mouse pointer.

```css
.round:not(.round-first) .matchup {
  border-style: dashed;
}

.round:not(.round-first) .slot {
  color: #666;
}
```

- `:not(.round-first)` means every round except round 1. This includes the Winner.
- Later columns get a dashed border and gray text, so they look faded.

## Connecting lines

How to read a selector: `.bracket-left .round-in .matchup::before` means the `::before` piece of a `.matchup`, inside a `.round-in`, inside `.bracket-left`.

`::before` and `::after` are extra pieces drawn by CSS. They have no HTML. Each one needs `content: ""` to appear. We draw the lines with their borders.

```css
.round-in .matchup::before {
  content: "";
  position: absolute;
  top: calc(50% - 1px);
  width: calc(var(--gap) / 2);
  border-top: var(--line);
}
.bracket-left  .round-in .matchup::before { right: calc(100% + 1px); }
.bracket-right .round-in .matchup::before { left:  calc(100% + 1px); }
```

- A short line coming in from the previous round.
- `top: calc(50% - 1px)` puts it in the middle of the box. The `- 1px` is half the line width.
- `width` is half of the gap. The other half is drawn by the previous column.
- On the left side, the line is on the left of the box. On the right side, it is the opposite.
- `+ 1px` covers the box border, so there is no gap.

```css
.round-pairs .matchup::after {
  content: "";
  position: absolute;
  width: calc(var(--gap) / 2);
  height: calc(var(--cell) * var(--span, 1) / 2 + 1px);
}
.bracket-left  .round-pairs .matchup::after { left:  calc(100% + 1px); border-right: var(--line); }
.bracket-right .round-pairs .matchup::after { right: calc(100% + 1px); border-left:  var(--line); }
.round-pairs .matchup:nth-of-type(odd)::after  { top:    calc(50% - 1px); border-top:    var(--line); }
.round-pairs .matchup:nth-of-type(even)::after { bottom: calc(50% - 1px); border-bottom: var(--line); }
```

- A line out, then a vertical line toward the middle of the pair.
- `height` is half of this round's cell height. This is the distance from the box to the middle of its pair.
- `border-right` (left side) or `border-left` (right side) is the vertical line.
- `:nth-of-type(odd)` means the 1st, 3rd, 5th box. The label is not a `div`, so it is not counted.
- Odd boxes: the piece starts at the middle of the box and goes down.
- Even boxes: the piece ends at the middle of the box and goes up.
- Together, they form this shape:

```
[box 1] ---+
           |---- [box in the next round]
[box 2] ---+
```

```css
.round-last .matchup::after {
  content: "";
  position: absolute;
  top: calc(50% - 1px);
  width: var(--gap);
  border-top: var(--line);
}
.bracket-left  .round-last .matchup::after { left:  calc(100% + 1px); }
.bracket-right .round-last .matchup::after { right: calc(100% + 1px); }
```

- The last round has one box on each side. The line is the full gap, and it reaches the Winner box.

## Rules added for real data (they must be at the end of the file)

```css
#bracket-info {
  margin: 0 0 12px;
  font-size: 14px;
  color: #000;
}
```

- `#bracket-info` selects the element with this `id`. It is the line above the bracket.

```css
.slot-image {
  width: 20px;
  height: 20px;
  margin-right: 6px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
```

- The item picture: a small round circle.
- `object-fit: cover` stops the picture from stretching.
- `flex-shrink: 0` stops the circle from being squeezed into an oval.

```css
.slot-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slot-votes {
  margin-left: 6px;
  font-weight: 600;
}
```

- `flex: 1` makes the name take the free space. The vote count goes to the right.
- A long name is cut with `...`. `min-width: 0`, `overflow: hidden`, `text-overflow: ellipsis`, and `white-space: nowrap` work together to do this.

```css
.matchup.is-winner .slot-name {
  font-weight: 700;
}

.matchup.is-loser .slot {
  color: #767676;
  text-decoration: line-through;
}
```

- A winner's name is bold.
- A loser's row is gray with a line through it.
- These two rules must be last. The faded-text rule earlier has the same strength, and the later rule wins.

---

# What happens when the page opens

With `bracket.html?challenge=ABC`:

1. `start()` finds `bracket-root` and makes the line of text.
2. It reads `challenge=ABC` from the address.
3. `watchChallenge` starts two listeners: one for the challenge, one for its matchups.
4. The challenge arrives. If there is no saved category name, the page reads the category.
5. The matchups arrive. `redraw` builds the bracket and writes the line of text.
6. A timer updates the countdown every second.
7. When any matchup changes in Firestore, the listener runs again and the page is redrawn. No refresh is needed.

On the home page, step 2 is different: `findLatestChallengeId` finds the newest challenge first.

---

# Testing

1. Start the emulator: `firebase emulators:start --only hosting`
2. Start a challenge with 8 teams on the Start Challenge page. You land on the bracket page.
3. Check:
   - Round 1 shows real names, and every count is 0.
   - Later rounds and the Winner say TBD.
   - The line above shows the category, `8 teams`, and a countdown that ticks.
4. Open `http://localhost:5000`. The home page shows the newest challenge.
5. Open the bracket in two windows. In Firebase Console, change `votesA` of a matchup. Both windows update with no refresh.
6. In Firebase Console, set a round 1 `winnerId` to the `id` of one of its items. That name turns bold, and the other is crossed out.
7. Check `?size=16` and `?size=32` (empty demo), and a real 16-team challenge.
8. The Console tab shows no red errors.

Data you save goes to the real database. Use clear names like "TEST pizza", and ask a teammate to delete test data in Firebase Console.

---

# Common problems

| Problem | Cause | Fix |
|---|---|---|
| "This challenge was not found." | Wrong id in the address, or the challenge was deleted | Check the address |
| "Could not load the challenge (permission-denied)" | The rules block reading | Check `firestore.rules`. Test mode ends about 30 days after the database was created |
| Round 1 boxes say "(no name)" | The challenge was saved with ids only (an old Start Challenge version) | Start a new challenge. Items must be `{ id, name, imageUrl }` |
| The page is empty, with no message | `bracket-root` is missing from the HTML | Add `<div id="bracket-root"></div>` |
| "has ended" right away | `roundEndsAt` is in the past | Check the computer clock |
| `does not provide an export named 'db'` | An old `app.js` | Use the `app.js` from `main` |
| The home page shows an old challenge | It shows the newest by `createdAt` | Start a new challenge |
| Lines have gaps | A CSS value was changed | Keep `--cell` bigger than a box, and keep the `+ 1px` values |

---

# Known gaps and what changes later

- **Vote buttons are disabled.** Voting needs a Cloud Function. It will check the 3 votes per minute limit, save the vote, and update the counts.
- **Rounds do not advance.** The Cloud Function will pick winners, move them forward with the rule in this document, and set a new `roundEndsAt` for each round. Right now `roundEndsAt` is only for round 1.
- **The home page shows only the newest challenge.** Challenge cards come later.
- **Reads cost.** Each visitor reads about `size - 1` matchups when the page opens, and then one read for each change. The free limit is 50,000 reads a day.
- **The timer never stops.** `setInterval` runs while the page is open. This is fine for one page.
- **The bracket is drawn again on every change.** For 32 teams, that is 63 boxes. This is fine for now.
- **Anyone can read.** The rules allow public reading, because the site is public.

---
