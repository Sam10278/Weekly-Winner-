# Start Challenge Page — Line by Line

This file explains how the Start Challenge page works.
Open the real files next to this document and read both together.

---

## What does this page do?

1. The user picks a category and a bracket size (8, 16 or 32).
2. The page checks that the category has enough items.
3. It picks the items at random.
4. It saves **one challenge** and all its **matchups** to Firestore, together.
5. It sends the user to the bracket page for that challenge.

## The files

| File | Job |
|---|---|
| `frontend/pages/start-challenge.html` | The form |
| `frontend/js/start-challenge.js` | Reads the categories, checks the data, and saves the challenge |
| `frontend/css/start-challenge.css` | The look of this page |
| `frontend/js/app.js` | Exports `db` and `auth` |
| `frontend/js/auth.js` | The navbar: Login, Logout, profile |
| `frontend/js/bracket.js` | Draws the challenge on the next page |

The flow:

```
choose category and size -> check items -> pick at random -> save challenge + matchups -> open bracket page
```

---

## What it saves

**One document in `challenges`**

| Field | Value |
|---|---|
| `categoryId` | The id of the chosen category |
| `bracketSize` | 8, 16 or 32 (a number) |
| `status` | `"open"` |
| `createdBy` | The user's `uid` |
| `createdAt` | `serverTimestamp()`, the time from the server |
| `roundEndsAt` | Now plus 24 hours (a Firestore timestamp) |

**Several documents in `matchups`**

| Field | Value |
|---|---|
| `challengeId` | The id of the challenge |
| `round` | 1 is the first round |
| `position` | 0 is the first matchup of the round |
| `itemA`, `itemB` | `{ id, name, imageUrl }` in round 1. `null` in later rounds |
| `votesA`, `votesB` | 0 |
| `winnerId` | `null` |

How many matchups:

| Size | Round 1 | Round 2 | Round 3 | Round 4 | Round 5 | Matchups | Writes (with the challenge) |
|---|---|---|---|---|---|---|---|
| 8 | 4 | 2 | 1 | | | 7 | 8 |
| 16 | 8 | 4 | 2 | 1 | | 15 | 16 |
| 32 | 16 | 8 | 4 | 2 | 1 | 31 | 32 |

- A challenge always has `size - 1` matchups.
- Later rounds are saved empty. The winners move in when each round ends.
- The item name and picture are saved inside the matchup. The bracket can show them without more reads, and removing an item later does not break a running bracket.

## What the rules check

The rules in `firestore.rules` check every write. If one fails, nothing is saved.

| Collection | The rules need |
|---|---|
| `challenges` | Logged in. All six fields. `bracketSize` is 8, 16 or 32. `status` is `"open"`. `createdBy` is your `uid`. `createdAt` is the server time. `roundEndsAt` is a timestamp. The category exists |
| `matchups` | Logged in. All eight fields. `challengeId` is text. `round` and `position` are whole numbers. `votesA` and `votesB` are 0. `winnerId` is `null` |

The rules do not check `itemA` and `itemB`, so an object and `null` both pass.

---

# Part 1 — start-challenge.html

## The head

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Start Challenge - Weekly Winner</title>

    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="/css/navbar.css">
    <link rel="stylesheet" href="/css/start-challenge.css">
</head>
```

- `lang="en"` says the page is English.
- `charset="UTF-8"` lets the page show all letters and symbols.
- The `viewport` line makes the page fit phone screens.
- `<title>` is the text on the browser tab.
- Three CSS files load in order. If two files style the same thing, the later one wins.
- Every path starts with `/`, so it always starts from the root of the site.

## The navbar

```html
<nav class="navbar">
    <a class="navbar-brand" href="/index.html">Weekly Winner</a>

    <div class="navbar-links">
        <a href="/index.html">Home</a>
        <a href="/pages/categories.html">Categories</a>
        <a href="/pages/start-challenge.html">Start Challenge</a>
        <a href="/pages/vote.html">Vote</a>
        <a href="/pages/past-winners.html">Past Winners</a>
    </div>

    <div class="navbar-user">
        <div id="user-profile" class="navbar-profile" hidden>
            <span id="user-avatar"></span>
            <span id="user-name"></span>
        </div>
        <a href="/pages/login.html" id="login-link" hidden>Login</a>
        <button id="logout-btn" hidden>Logout</button>
    </div>
</nav>
```

- The links start with `/` and use `/pages/...`. Without `/pages/`, a link gives a 404.
- The `navbar-user` part has five ids that `auth.js` looks for. They all start with `hidden`. `auth.js` removes `hidden` from the right ones.
- This page's own code does not use them.

## The top of the page

```html
<main class="start-challenge">

    <h1>Start a Bracket Challenge</h1>

    <p>Choose a category and bracket size to get started.</p>

    <form id="challenge-form">
```

- `<main>` is the main content. `start-challenge` is the class for the CSS.
- `<form id="challenge-form">` is the form. The JavaScript listens for its submit.

## The category dropdown

```html
<h3><label for="category-select">Choose a Category</label></h3>

<select id="category-select" required>
    <option value="">Select a category</option>
</select>
```

- `<label for="category-select">` is linked to the dropdown with the same `id`. Clicking the label selects the dropdown.
- `<select>` is a dropdown. The JavaScript adds one `<option>` for each category.
- The first option has an empty `value`. With `required`, the browser stops the form when it is still chosen.

## The size buttons

```html
<h3 id="size-heading">Bracket Size</h3>

<div class="bracket-sizes" role="radiogroup" aria-labelledby="size-heading">

    <label>
        <input type="radio" name="bracket-size" value="8" checked>
        8 Teams
    </label>

    <label>
        <input type="radio" name="bracket-size" value="16">
        16 Teams
    </label>

    <label>
        <input type="radio" name="bracket-size" value="32">
        32 Teams
    </label>

</div>
```

- `type="radio"` makes a round button. Only one in a group can be chosen.
- Radios with the same `name` form one group. The name here is `bracket-size`.
- `value` is what the code reads. It is text, so the JavaScript turns it into a number.
- `checked` makes 8 the default.
- `role="radiogroup"` and `aria-labelledby` tell screen readers the three buttons are one group, named by the heading.

## The messages and the button

```html
<p id="challenge-preview" aria-live="polite">
    Select a category to see available items.
</p>

<p id="challenge-message" role="status" aria-live="polite"></p>

<button type="submit" id="start-btn">Start Challenge</button>
```

- `challenge-preview` shows how many items the category has.
- `challenge-message` shows errors and progress. It also shows the "loading categories" message.
- `aria-live="polite"` makes screen readers read each new message.
- `type="submit"` makes the button send the form.

## The scripts

```html
<script type="module" src="/js/auth.js"></script>
<script type="module" src="/js/start-challenge.js"></script>
```

- They are at the bottom, so all the elements already exist when the code runs.
- `type="module"` is needed because both files use `import`.
- There is no separate tag for `app.js`. `start-challenge.js` imports it.
- Keep only one `</body>` at the end of the file.

## The ids that JavaScript uses

| id or name | Used for |
|---|---|
| `challenge-form` | The form |
| `category-select` | The dropdown |
| `bracket-size` (the radio name) | The three size buttons |
| `challenge-preview` | The item count line |
| `challenge-message` | Errors and progress |
| `start-btn` | The submit button |

If one `id` is spelled differently in the HTML and in the JavaScript, the page crashes with `Cannot read properties of null`.

---

# Part 2 — start-challenge.js

## Imports

```javascript
import { db, auth } from "./app.js";
```

- `db` is the database. `auth` knows who is logged in. `app.js` starts both.
- `./` means "the same folder as this file".

```javascript
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    writeBatch,
    serverTimestamp,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
```

| Name | What it does |
|---|---|
| `collection` | Points to a collection |
| `getDocs` | Reads many documents, one time |
| `query` | Builds a search |
| `where` | A filter inside a search |
| `doc` | Makes a reference to one document. Here it makes a new id without saving anything |
| `writeBatch` | Groups many writes into one. They all succeed, or none does |
| `serverTimestamp` | The time from the server, not from the user's computer |
| `Timestamp` | The Firestore time type |

```javascript
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
```

- It runs a function when the login state changes.
- Every Firebase URL uses version `10.0.0`.

## Finding the elements

```javascript
const categorySelect = document.getElementById("category-select");
const message = document.getElementById("challenge-message");
const challengePreview = document.getElementById("challenge-preview");
const challengeForm = document.getElementById("challenge-form");
const startBtn = document.getElementById("start-btn");

const sizeOptions = document.querySelectorAll(
    'input[name="bracket-size"]'
);
```

- `document.getElementById("...")` finds the element with that `id`. It gives the element, or `null`.
- `const` makes a name that is not changed later.
- `querySelectorAll` finds every element that matches. Here it finds all three radio buttons.

## State

```javascript
let loggedInUser = null;
let authReady = false;
let countRequest = 0;
```

- State is what the page remembers while it is open.
- `let` is used because the values change.
- `loggedInUser` is the logged-in user, or `null`.
- `authReady` is `false` until Firebase has finished checking the login. Right after the page loads, `loggedInUser` is `null` even for a logged-in user.
- `countRequest` counts the item-count checks. It is explained in `updateItemCount`.

```javascript
onAuthStateChanged(auth, (user) => {
    loggedInUser = user;
    authReady = true;
});
```

- Firebase runs this when the login check finishes, and again when someone logs in or out.

## loadCategories

```javascript
async function loadCategories() {
    message.textContent = "Loading categories...";
```

- `async` lets the function wait with `await`.
- `textContent` sets plain text.

```javascript
    try {
        const snapshot = await getDocs(collection(db, "categories"));

        if (snapshot.empty) {
            message.textContent =
                "No categories yet. Create one on the Categories page.";
            return;
        }
```

- `try` runs the code. If something fails, `catch` runs.
- `getDocs(collection(db, "categories"))` reads all categories. `await` waits for the answer.
- `snapshot.empty` is true when there are none. The function shows a message and stops.

```javascript
        const categories = snapshot.docs
            .map((category) => ({
                id: category.id,
                name: category.data().name || "(no name)"
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
```

- `.docs` is the list of documents.
- `map` makes a new list. Each document becomes an object with its `id` and `name`.
- `name || "(no name)"` means "the name, or `(no name)` if it is missing". A category made by hand can have no name.
- `sort` puts the list in order. `localeCompare` compares text the way people expect, so the list goes A to Z.

```javascript
        categories.forEach((category) => {
            const option = document.createElement("option");

            option.value = category.id;
            option.textContent = category.name;

            categorySelect.appendChild(option);
        });

        message.textContent = "";
```

- `forEach` runs the code for every category.
- `option.value` is the id (what the code reads). `option.textContent` is the name (what the user sees).
- `textContent` is used for the name, because a user typed it. HTML in a name is shown as plain text and never runs.
- `appendChild` puts the option in the dropdown.
- At the end, it clears the "Loading" message.

```javascript
    } catch (error) {
        console.error("Error loading categories:", error);

        message.textContent =
            `Failed to load categories (${error.code || "unknown error"}).`;
    }
}
```

- If the read fails, the real error goes to the Console, and the user sees a short message with the error code, such as `permission-denied`.

## updateItemCount

It shows how many items the chosen category has.

```javascript
async function updateItemCount() {
    const requestId = ++countRequest;
    const categoryId = categorySelect.value;
```

- `++countRequest` adds 1 first, then gives the new number. Every check gets its own number.
- `categorySelect.value` is the id of the chosen category.

```javascript
    const selectedSize = document.querySelector(
        'input[name="bracket-size"]:checked'
    );

    if (!categoryId || !selectedSize) {
        challengePreview.textContent =
            "Select a category to see available items.";
        return;
    }

    const size = Number(selectedSize.value);
```

- `:checked` finds the radio that is chosen.
- `||` means "or". With no category or no size, it shows the default text and stops.
- `Number(...)` turns the text `"8"` into the number 8.

```javascript
    challengePreview.textContent = "Checking available items...";

    try {
        const itemsQuery = query(
            collection(db, "items"),
            where("categoryId", "==", categoryId)
        );

        const snapshot = await getDocs(itemsQuery);
```

- The search: items where `categoryId` is exactly the chosen category.
- It reads only that category's items, not all items.
- Each document read counts toward the free limit of 50,000 reads a day.

```javascript
        if (requestId !== countRequest) {
            return;
        }
```

- This line is for old answers. If the user changes the choice quickly, an older check may finish after a newer one.
- If this check's number is not the latest number, it throws the answer away.

```javascript
        const count = snapshot.size;

        if (count < size) {
            challengePreview.textContent =
                `This category has only ${count} items. You need ${size}.`;
        } else {
            challengePreview.textContent =
                `${size} random items will be selected from ${count} available items.`;
        }
```

- `snapshot.size` is the number of documents found.
- Too few: it says how many are missing. Enough: it says how many will be picked.

```javascript
    } catch (error) {
        if (requestId !== countRequest) {
            return;
        }

        console.error("Error counting items:", error);

        challengePreview.textContent =
            "Unable to check available items.";
    }
}
```

- An old check that fails is also ignored.

## shuffleItems

```javascript
function shuffleItems(items) {
    const shuffled = [...items];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}
```

- `[...items]` makes a copy of the list. The original is not changed.
- This is the Fisher-Yates shuffle.
- The loop starts at the last item and goes down to 1.
- `Math.random()` gives a number from 0 up to (but not including) 1. `Math.floor(Math.random() * (i + 1))` gives a whole number from 0 to `i`.
- `[a, b] = [b, a]` swaps two items.
- This shuffle is fair. A common shortcut, `sort(() => Math.random() - 0.5)`, is not fair.

## itemInfo

```javascript
function itemInfo(item) {
    return {
        id: item.id,
        name: item.name || "",
        imageUrl: item.imageUrl || ""
    };
}
```

- It makes a small object for one item: its id, name, and picture link.
- `|| ""` is needed because Firestore does not accept `undefined`. An item with no picture has no `imageUrl`.

## saveChallenge

```javascript
async function saveChallenge(categoryId, size, selectedItems, userId) {

    const challengeRef = doc(collection(db, "challenges"));

    const batch = writeBatch(db);
```

- `doc(collection(db, "challenges"))` makes a reference with a **new id**. Nothing is saved yet.
- The id is known before the save, so the matchups can use it as `challengeId`.
- `writeBatch(db)` starts a batch. Writes are collected, and saved together at the end.

```javascript
    const roundEndsAt = Timestamp.fromDate(
        new Date(Date.now() + 24 * 60 * 60 * 1000)
    );
```

- `Date.now()` is the time now in milliseconds.
- `24 * 60 * 60 * 1000` is 24 hours in milliseconds.
- `Timestamp.fromDate(...)` makes the Firestore time type, which the rules require.
- This time comes from the user's computer clock.

```javascript
    batch.set(challengeRef, {
        categoryId: categoryId,
        bracketSize: size,
        status: "open",
        createdBy: userId,
        createdAt: serverTimestamp(),
        roundEndsAt: roundEndsAt
    });
```

- `batch.set(ref, data)` adds a "save this document" step to the batch.
- `bracketSize` is a number, because the rules require it.
- `createdBy` is the user's `uid`. `createdAt` is the server time. The rules check both.

```javascript
    const totalRounds = Math.log2(size);

    for (let round = 1; round <= totalRounds; round++) {

        const matchCount = size / Math.pow(2, round);

        for (let position = 0; position < matchCount; position++) {
```

- `Math.log2(size)` is the number of rounds: 8 gives 3, 16 gives 4, 32 gives 5.
- The outer loop goes through the rounds. The inner loop goes through the matchups of one round.
- `Math.pow(2, round)` is 2 to the power of `round`.
- `matchCount` is the number of matchups in that round.

```javascript
            const matchupRef = doc(collection(db, "matchups"));

            let itemA = null;
            let itemB = null;

            if (round === 1) {
                itemA = itemInfo(selectedItems[position * 2]);
                itemB = itemInfo(selectedItems[position * 2 + 1]);
            }
```

- Each matchup gets a new id.
- `itemA` and `itemB` start as `null`, which means TBD.
- Only round 1 has items. The shuffled list is used in pairs: matchup 0 gets items 0 and 1, matchup 1 gets items 2 and 3, and so on.
- So who faces whom is random.

```javascript
            batch.set(matchupRef, {
                challengeId: challengeRef.id,
                round: round,
                position: position,
                itemA: itemA,
                itemB: itemB,
                votesA: 0,
                votesB: 0,
                winnerId: null
            });
        }
    }
```

- Adds the matchup to the batch.
- `challengeRef.id` is the id of the new challenge.
- Counts start at 0, and there is no winner yet. The rules check both.

```javascript
    await batch.commit();

    return challengeRef.id;
}
```

- `batch.commit()` saves everything in one step. If one write fails, nothing is saved.
- A batch can hold up to 500 writes. The biggest challenge uses 32.
- The function gives back the new challenge id.

## The submit handler

```javascript
challengeForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (startBtn.disabled) {
        return;
    }

    message.textContent = "";
```

- It runs when the form is submitted.
- `event.preventDefault()` stops the browser from reloading the page.
- If the button is off, a save is already running. The function stops.

```javascript
    const categoryId = categorySelect.value;

    const selectedSize = document.querySelector(
        'input[name="bracket-size"]:checked'
    );

    if (!categoryId) {
        message.textContent = "Please select a category.";
        return;
    }

    if (!selectedSize) {
        message.textContent = "Please select a bracket size.";
        return;
    }

    const size = Number(selectedSize.value);

    if (![8, 16, 32].includes(size)) {
        message.textContent = "Invalid bracket size.";
        return;
    }
```

- It checks the data before saving. Each `return` stops the function.
- `![8, 16, 32].includes(size)` means "the size is not in the list". A user could change the page in the browser tools, so the code checks the size again.

```javascript
    if (!authReady) {
        message.textContent =
            "Checking login status. Please try again.";
        return;
    }

    if (!loggedInUser) {
        message.textContent =
            "Please log in to start a challenge.";
        return;
    }
```

- If Firebase has not answered yet, it asks the user to try again.
- If nobody is logged in, it asks for a login.

```javascript
    startBtn.disabled = true;
    startBtn.textContent = "Starting...";
    message.textContent = "Checking challenge requirements...";

    let created = false;
```

- It turns the button off, so a double click does not make two challenges.
- `created` starts as `false`. It becomes `true` after a successful save.

```javascript
    try {
        const itemsQuery = query(
            collection(db, "items"),
            where("categoryId", "==", categoryId)
        );

        const snapshot = await getDocs(itemsQuery);

        if (snapshot.size < size) {
            message.textContent =
                `This category has only ${snapshot.size} items. You need ${size}.`;
            return;
        }
```

- It reads the items again, because the count may have changed since the preview.
- If there are too few, it shows a message and stops. Nothing is saved. The `finally` block still runs.

```javascript
        const items = snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
        }));

        const selectedItems = shuffleItems(items).slice(0, size);
```

- Each document becomes an object. `id: item.id` adds the id, and `...item.data()` copies all its fields.
- `shuffleItems(items)` mixes the list. `.slice(0, size)` keeps the first `size` items.

```javascript
        message.textContent = "Saving challenge...";

        const challengeId = await saveChallenge(
            categoryId,
            size,
            selectedItems,
            loggedInUser.uid
        );

        created = true;
```

- It saves the challenge and the matchups.
- `loggedInUser.uid` is the user's own id. The rules check that `createdBy` matches it.
- After the save, `created` becomes `true`.

```javascript
        message.textContent = "Challenge created successfully!";

        window.location.href =
            `/pages/bracket.html?challenge=${encodeURIComponent(challengeId)}`;
```

- `window.location.href = ...` sends the browser to another page.
- `?challenge=ID` puts the challenge id in the address. The bracket page reads it.
- `encodeURIComponent` makes the id safe to use inside an address.

```javascript
    } catch (error) {
        console.error("Error starting challenge:", error);

        message.textContent =
            "Failed to start challenge. Please try again.";

    } finally {
        if (!created) {
            startBtn.disabled = false;
            startBtn.textContent = "Start Challenge";
        }
    }
});
```

- If something fails (for example, the rules reject it), the Console shows the real error, and the user sees a short message.
- `finally` always runs, whether it worked or not.
- The button is turned back on only when nothing was saved. After a successful save, the page is leaving, and a second click could make a second challenge.

## The last lines

```javascript
categorySelect.addEventListener("change", updateItemCount);

sizeOptions.forEach((option) => {
    option.addEventListener("change", updateItemCount);
});

loadCategories();
```

- The `change` event happens when the user picks a different option.
- When the category or the size changes, the item count check runs again.
- The last line fills the dropdown when the page opens.

---

# Walk-through: one 8-team challenge

1. The page opens. `loadCategories` fills the dropdown.
2. The user picks "Coffee" and 8 teams. The preview says `8 random items will be selected from 12 available items.`
3. The user clicks Start. The code checks the form and the login, and turns the button off.
4. It reads the 12 items and shuffles them. It keeps the first 8.
5. It makes one batch:
   - 1 challenge
   - 4 round 1 matchups, with 2 items each
   - 2 round 2 matchups, empty
   - 1 round 3 matchup (the final), empty
6. `commit` saves all 8 documents together.
7. The browser opens `/pages/bracket.html?challenge=ID`.
8. The bracket page listens to the challenge and its 7 matchups, and draws them.

---

# Testing

1. Make a "TEST" category with at least 8 items on the Categories page.
2. Start the emulator: `firebase emulators:start --only hosting`
3. Open `http://localhost:5000/pages/start-challenge.html` and press Ctrl + Shift + R.
4. Pick the category and 8 teams. Check the preview line.
5. Click Start. You land on the bracket page.
6. In Firebase Console, check Firestore:
   - 1 new document in `challenges`
   - 7 documents in `matchups` with that `challengeId`
   - Round 1 matchups have two items each. Later rounds have `null`.
7. Try a category with too few items. You see the "only X items" message, and nothing is saved.
8. Try logged out. You see "Please log in".
9. Double-click Start. Only one challenge is made.

Everything you save goes to the real database. Use "TEST" names, and ask a teammate to delete test challenges and matchups in Firebase Console. Use 8 teams for most tests.

---

# Common problems

| Problem | Cause | Fix |
|---|---|---|
| The dropdown is empty | The read failed, or there are no categories | Read the line under the form and the Console |
| `Failed to load categories (permission-denied)` | The rules block reading | Check `firestore.rules`. Test mode ends about 30 days after the database was created |
| Categories are missing only on this page | `app.js` was changed in this branch to use a local database | Restore `app.js` from `main` |
| `Failed to start challenge` and `Missing or insufficient permissions` in the Console | The data does not match the rules | Check the field names, `bracketSize` as a number, `roundEndsAt` as a timestamp, `createdAt` as `serverTimestamp()`, and `createdBy` as your `uid` |
| `Cannot read properties of null` | An id in the JS is different from the HTML | Compare the ids with the table in Part 1 |
| A Firestore error about `undefined` | A field is `undefined` | `itemInfo` uses `|| ""` for this |
| Two challenges after a double click | The button was not turned off | Keep the `disabled` line and the `created` flag |
| The bracket shows "(no name)" | The matchups were saved with ids only | Use `itemInfo` when saving |

---

# Known gaps and what changes later

- **The browser makes the challenge.** A user can change the code in the browser tools. For example, they could pick the items, or set `roundEndsAt` to any date. Later, a Cloud Function will do the picking and the saving. Then the rules for `challenges` and `matchups` can become `if false` for the browser.
- **The time comes from the user's computer.** If the clock is wrong, `roundEndsAt` is wrong. The Cloud Function will use the server time.
- **`categoryName` and `currentRound` are not saved.** The bracket page reads the category to get the name. We can add both fields later. Extra fields are allowed by the rules.
- **Reads cost.** The preview reads all items of a category each time the choice changes. A count query can replace this later.
- **A category's items can be removed in Firebase Console.** A running challenge still has the names, because they are saved in the matchups.
- **One user can start many challenges.** Nothing limits it yet.

---

