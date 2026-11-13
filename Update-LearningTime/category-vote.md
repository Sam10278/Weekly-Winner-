# Category Voting: Every Code Change Explained

People vote for the **next category** on their own page. On Monday at 9:00 AM, auto-start picks the category with the most votes. Category voting is separate from bracket voting.

---

## The idea

1. Open categories with **8 or more items** appear on the Category Vote page.
2. A user can vote for **many** categories, **once for each**, and can take a vote back.
3. Monday 9:00 AM: auto-start picks the category with the **most votes**. A tie is broken at random.
4. Zero votes everywhere: it picks at random, as before.
5. The picked category is `closed`, so it leaves the vote. **All category votes are deleted**, so the new week starts at zero.

## What is separate from bracket voting

| | Bracket voting | Category voting |
|---|---|---|
| Page | Vote page, home bracket | `category-vote.html` |
| Function | `castVote` | `toggleCategoryVote` |
| Data | `votes`, `matchups` | `categoryVotes` |
| Browser file | `vote.js`, `vote-page.js` | `category-vote.js` |

The only link: auto-start reads `categoryVotes` to choose the category.

## Files changed

| File | Change |
|---|---|
| `backend/functions/categoryVote.js` | **New.** The `toggleCategoryVote` function |
| `backend/functions/startChallenge.js` | **Changed.** `pickCategory` uses votes. **New** `clearCategoryVotes` |
| `backend/functions/index.js` | **Changed.** New export, and clears votes after a challenge starts |
| `firestore.rules` | **Changed.** New `categoryVotes` block |
| `frontend/pages/category-vote.html` | **New.** The page |
| `frontend/js/category-vote.js` | **New.** Loads, draws, sends votes |
| `frontend/css/category-vote.css` | **New.** Styles |
| Every navbar | **Changed.** New "Category Vote" link |

## The data

Collection `categoryVotes`, document id `{categoryId}_{userId}`.

| Field | Meaning |
|---|---|
| `categoryId` | The category voted for |
| `userId` | Who voted |
| `createdAt` | Server time |

- One document for each user and category, so a double vote is impossible.
- No count is stored on the category. Totals come from counting documents, so they cannot drift, and the reset is just deleting them.

---

# Part 1: categoryVote.js (new, backend)

```javascript
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
```

- `onCall` makes a function the website can call by name. `HttpsError` sends a clear error back to the page.
- `getFirestore` is the Admin SDK database. `FieldValue` gives the server time.
- No `initializeApp()` here. `index.js` calls it once.

```javascript
exports.toggleCategoryVote = onCall(async (request) => {
```

- The name `toggleCategoryVote` is the name the page calls.
- `request` holds who is calling (`request.auth`) and what they sent (`request.data`).

```javascript
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Please log in before voting.");
  }
  const uid = request.auth.uid;
```

- No login means no vote. The page shows the message.
- `uid` is the user's own id. It comes from Google, so the user cannot fake it.

```javascript
  let data = request.data;
  if (!data) {
    data = {};
  }
  const categoryId = data.categoryId;
```

- `request.data` can be missing. An empty object stops a crash.

```javascript
  if (typeof categoryId !== "string" || categoryId.trim() === "") {
    throw new HttpsError("invalid-argument", "A category id is required.");
  }
  if (categoryId.includes("/") || categoryId.length > 100) {
    throw new HttpsError("invalid-argument", "Invalid category id.");
  }
```

- The id must be text and not empty.
- A `/` would break the document path. A huge id is not real.

```javascript
  const db = getFirestore();
  const categoryRef = db.collection("categories").doc(categoryId);
  const voteRef = db.collection("categoryVotes").doc(categoryId + "_" + uid);
```

- `getFirestore()` runs inside the function, not at the top of the file.
- `voteRef` is this user's vote for this category. The id joins both, so each pair has exactly one possible document.

```javascript
  const countSnap = await db
    .collection("items")
    .where("categoryId", "==", categoryId)
    .count()
    .get();
  const itemCount = countSnap.data().count;
```

- `.count()` asks Firestore for the number of items. It costs 1 read, however many items exist.
- It runs outside the transaction. A count is enough for the rule "8 or more".

```javascript
  return db.runTransaction(async (transaction) => {
    const categorySnap = await transaction.get(categoryRef);
    const voteSnap = await transaction.get(voteRef);
```

- A transaction reads first, writes last. If anything fails, nothing is saved.
- Both reads come before any write.

```javascript
    if (!categorySnap.exists) {
      throw new HttpsError("not-found", "Category not found.");
    }
    const category = categorySnap.data();

    if (category.closed === true) {
      throw new HttpsError("failed-precondition", "This category is closed.");
    }

    if (!voteSnap.exists && itemCount < 8) {
      throw new HttpsError("failed-precondition", "This category needs at least 8 items.");
    }
```

- Missing category: `not-found`.
- Closed category: nobody can vote.
- `!voteSnap.exists && itemCount < 8`: **adding** a vote needs 8 items. **Taking a vote back** always works, even if items were removed.

```javascript
    if (voteSnap.exists) {
      transaction.delete(voteRef);
      return { voted: false };
    }

    transaction.create(voteRef, {
      categoryId: categoryId,
      userId: uid,
      createdAt: FieldValue.serverTimestamp()
    });
    return { voted: true };
```

- Vote exists: delete it, answer `{ voted: false }`.
- No vote: create it, answer `{ voted: true }`. `create` fails if it already exists, so two fast clicks cannot make two votes.
- The page reads `voted` to say "Vote saved" or "Vote removed".

**Why a function and not the browser:** the rules cannot count items or check the toggle safely. The Admin SDK skips the rules, so only this function can write votes.

---

# Part 2: firestore.rules (changed)

```
match /categoryVotes/{voteId} {
  allow read: if signedIn();
  allow write: if false;
}
```

- `signedIn()` is the helper we already have. Any logged-in user can read votes (the page needs totals).
- `write: if false` blocks every browser write. Only the function writes.
- Known limit: a logged-in user could read who voted for what.

---

# Part 3: startChallenge.js (changed)

## pickCategory (replaced)

The old version picked a **size first**, then a category. The new one picks the **category first**.

```javascript
async function pickCategory(db) {
  const categorySnap = await db.collection("categories").get();
  const candidates = [];
```

- Read all categories. `candidates` will hold the ones that can be picked.

```javascript
  for (const doc of categorySnap.docs) {
    if (doc.data().closed === true) {
      continue;
    }
    const itemSnap = await db.collection("items").where("categoryId", "==", doc.id).get();
    if (itemSnap.size >= 8) {
      candidates.push({ doc: doc, itemDocs: itemSnap.docs });
    }
  }
  if (candidates.length === 0) {
    return null;
  }
```

- `continue` skips closed categories.
- It reads each open category's items and keeps those with 8 or more.
- We keep `itemDocs` so we do not read them again later.
- `null` means nothing can start this week. `index.js` logs a warning.

```javascript
  const voteSnap = await db.collection("categoryVotes").get();
  const voteCounts = {};
  for (const voteDoc of voteSnap.docs) {
    const id = voteDoc.data().categoryId;
    if (!voteCounts[id]) {
      voteCounts[id] = 0;
    }
    voteCounts[id] = voteCounts[id] + 1;
  }
```

- Read all category votes once.
- `voteCounts` becomes an object like `{ "catA": 5, "catB": 3 }`.

```javascript
  let highest = 0;
  for (const candidate of candidates) {
    let votes = 0;
    if (voteCounts[candidate.doc.id]) {
      votes = voteCounts[candidate.doc.id];
    }
    candidate.votes = votes;
    if (votes > highest) {
      highest = votes;
    }
  }
```

- Give each candidate its vote count (0 if none).
- Remember the highest count.

```javascript
  const top = [];
  for (const candidate of candidates) {
    if (candidate.votes === highest) {
      top.push(candidate);
    }
  }
  const chosen = shuffle(top)[0];
```

- Keep only the candidates that have the highest count.
- A tie leaves several. `shuffle(top)[0]` picks one at random. This is the tie-break.
- Zero votes everywhere: `highest` is 0, every candidate ties, and one is picked at random.

```javascript
  let size = 8;
  if (chosen.itemDocs.length >= 16) {
    const sizes = shuffle([8, 16]);
    size = sizes[0];
  }
```

- The size comes **second**, and it must fit the category.
- Under 16 items: always 8. 16 or more: random 8 or 16.
- Why: a popular category with 10 items runs as an 8. Before, it could be skipped if the random size was 16.

```javascript
  const items = [];
  for (const itemDoc of chosen.itemDocs) {
    const data = itemDoc.data();
    let name = "";
    if (data.name) { name = data.name; }
    let imageUrl = "";
    if (data.imageUrl) { imageUrl = data.imageUrl; }
    items.push({ id: itemDoc.id, name: name, imageUrl: imageUrl });
  }
```

- Each item becomes `{ id, name, imageUrl }`, the shape matchups use.
- Missing values become `""`, because Firestore does not accept `undefined`.

```javascript
  let categoryName = "";
  if (chosen.doc.data().name) {
    categoryName = chosen.doc.data().name;
  }
  return {
    size: size,
    category: { id: chosen.doc.id, name: categoryName },
    items: shuffle(items).slice(0, size)
  };
```

- Return the size, the category, and `size` random items.
- `saveChallenge` uses this unchanged.

## clearCategoryVotes (new)

```javascript
async function clearCategoryVotes(db) {
  let deleted = 0;
  while (true) {
    const snap = await db.collection("categoryVotes").limit(500).get();
    if (snap.empty) {
      break;
    }
    const batch = db.batch();
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    deleted = deleted + snap.size;
  }
  return deleted;
}
```

- A batch holds at most 500 operations, so it works in rounds.
- Each round: read up to 500 votes, delete them in one batch.
- `while (true)` repeats until `snap.empty` is true, then `break` leaves the loop.
- It returns how many were deleted, for the log.

The export line now lists it:

```javascript
module.exports = { shuffle, chicagoDate, buildMatchups, pickCategory, saveChallenge, clearCategoryVotes };
```

---

# Part 4: index.js (changed)

Two changes.

**1. Import and export**

```javascript
const { pickCategory, saveChallenge, chicagoDate, clearCategoryVotes } = require("./startChallenge");
...
exports.toggleCategoryVote = require("./categoryVote").toggleCategoryVote;
```

- The first line brings in the new helper.
- The second makes Firebase deploy the new function.

**2. Clear the votes inside `startChallenge`**, after the save and before the final log:

```javascript
try {
  const deleted = await clearCategoryVotes(db);
  logger.info("Category votes cleared", { deleted: deleted });
} catch (error) {
  logger.error("Could not clear category votes", { reason: error.message });
}
```

- It runs **after** `saveChallenge` worked, so a cleanup problem cannot undo the challenge.
- If the cleanup fails, it only logs. Old votes then carry over to next week, so check the logs each Monday.
- The field is named `reason`, not `message`, because the logger replaces a field named `message`.

---

# Part 5: category-vote.html (new)

- The navbar is the dropdown version, with the new **Category Vote** link.
- `<p id="category-vote-message">` shows "Vote saved" or errors. It is **outside** the cards, so a redraw never wipes it.
- `<div id="category-vote-list">` is the empty box the JavaScript fills.
- Scripts: `auth.js` (navbar) and `category-vote.js` (the page), both `type="module"`.

---

# Part 6: category-vote.js (new, frontend)

## Imports

```javascript
import { auth, db, functions } from "./app.js";
import { onAuthStateChanged } from ".../firebase-auth.js";
import { httpsCallable } from ".../firebase-functions.js";
import { collection, getDocs, query, where, onSnapshot } from ".../firebase-firestore.js";
```

- `auth`, `db`, `functions` come from `app.js`.
- `httpsCallable` makes a call to a Cloud Function.
- `onSnapshot` listens live. `getDocs` reads once.

## What the page remembers

```javascript
let currentUser = null;
let candidates = [];
let voteTotals = {};
let myVotes = {};
let stopWatchingMine = null;
let savingCategories = {};
```

| Variable | Meaning |
|---|---|
| `currentUser` | The logged-in user, or `null` |
| `candidates` | Open categories with 8+ items: `{ id, name, itemCount }` |
| `voteTotals` | Votes for each category: `{ categoryId: number }` |
| `myVotes` | Categories I voted for: `{ categoryId: true }` |
| `stopWatchingMine` | A function that stops my vote listener |
| `savingCategories` | Categories being saved right now |

## loadCandidates()

- Reads all categories. Skips `closed` ones.
- For each, reads its items and keeps it only if it has 8 or more. The same rule as the function.
- Sorts by name and returns the list.

## showMessage and addText

- `showMessage(text, isError)` writes into the message line. Red for errors, green for success.
- `addText(parent, tag, text, className)` makes one element with `textContent`. Never `innerHTML`, so a name with HTML in it shows as plain text.

## makeCard(category)

- Makes an `<article>` with the category name, the item count, and the vote total ("1 vote" or "N votes").
- If I voted for it, the card gets the class `my-vote` (green in CSS), and the button says "Voted (click to undo)". Otherwise it says "Vote".
- The button is **off** when logged out (hover says "Please log in to vote.") and while that category is saving.
- `button.dataset.categoryId` stores the id, so the click handler knows which category.

## render()

- Clears the list with `replaceChildren()`, so a redraw never doubles cards.
- No candidates: shows "No categories can be voted on right now. A category needs at least 8 items."
- Sorts a **copy** of the list: most votes first, then by name. The leader is on top.
- Draws one card for each.

## Login watcher

```javascript
onAuthStateChanged(auth, (user) => { ... });
```

- Runs at load and whenever the login changes.
- Stops the old "my votes" listener so it never reads for the previous user.
- If someone is logged in, it listens to `categoryVotes` filtered by `where("userId", "==", user.uid)`. The filter matches the rules.
- Each change rebuilds `myVotes` and redraws.

## Click handler

- One listener on the whole list. It still works after each redraw, because it is attached to the list and not to each button.
- `event.target.closest(".category-vote-button")` finds the clicked button. A click elsewhere does nothing.
- Marks the category as saving, shows "Saving...", and redraws so the button turns off. This stops a double click.
- Calls `toggleCategoryVote`. On success: "Vote saved." or "Vote removed.".
- On error: a `failed-precondition` shows the function's own message (for example "needs at least 8 items"). Other errors show a general message.
- Always unmarks saving and redraws at the end.

## start()

- Loads the candidates once. On failure it shows "Could not load categories."
- Starts one live listener on **all** `categoryVotes`, counts them by category into `voteTotals`, and redraws on each change.

---

# Part 7: category-vote.css (new)

- `#category-vote-list` is a grid of cards. One column on phones.
- `.category-card` is a white box with a gray border.
- `.category-vote-button` is red. Disabled buttons are gray.
- `.category-card.my-vote` has a green border and name. The button turns white with green text.
- Green text uses `#15803d` because it is easier to read than `#22c55e`.

---

# Part 8: The navbar link (every page)

```html
<a href="/pages/category-vote.html">Category Vote</a>
```

Added after "Categories" in `index.html`, `base.html`, `categories.html`, `vote.html`, `past-winners.html`, and `category-vote.html`.

---

# What happens, start to finish

1. A user opens Category Vote. The page lists open categories with 8+ items.
2. The user clicks **Vote**. The page calls `toggleCategoryVote`.
3. The function checks everything and writes a vote document.
4. `onSnapshot` sends the new totals to every open page.
5. Monday 9:00 AM: `startChallenge` runs `pickCategory`, which counts votes and chooses.
6. `saveChallenge` creates the challenge and closes the category.
7. `clearCategoryVotes` deletes all votes. The new week starts at zero.

# Costs

| Part | Cost |
|---|---|
| Each vote click | 1 count read, a few reads, 1 write |
| Page load | Reads every category and its items |
| Live totals | 1 read for each change, for each viewer |
| Monday pick | Reads all categories, items, and votes once |

All small, but watch Firestore usage.

# Test checklist

- [ ] Two accounts vote for several categories. Totals add up.
- [ ] Taking a vote back works.
- [ ] A category with fewer than 8 items is not shown.
- [ ] Force run picks the most-voted category.
- [ ] A tie picks either one.
- [ ] Zero votes picks at random.
- [ ] `categoryVotes` is empty after a challenge starts.
- [ ] The picked category is `closed` and leaves the page.

# Known limits

- Anyone logged in can see who voted for which category.
- Many Google accounts can vote many times. Nothing stops that.
- The page reads all categories and items when it opens.
- If the cleanup fails, votes carry over to the next week.

## Words to know

| Word | Meaning |
|---|---|
| Callable function | A function the website calls by name |
| Transaction | Reads first, writes last. All saved, or nothing |
| Tie-break | Picking at random among equal winners |
| Admin SDK | The server tool. It skips the security rules |
| `onSnapshot` | A live listener. It runs again on every change |