# Categories Page — categories.html and categories.js, Line by Line

## What does this page do?

One page handles both categories and items.

- The sidebar lists all categories. The user can search them.
- Clicking a category shows its items on the right.
- A logged-in user can add an item to the selected category.
- A logged-in user can create a new category with the "+ New" button.
- Users cannot edit or remove anything. Only the team can, in Firebase Console.
- The page is public. Anyone can read. Saving needs a login.

---

## The files

| File | Job |
|---|---|
| `frontend/pages/categories.html` | The structure of the page |
| `frontend/js/categories.js` | Reads and saves data, and updates the page |
| `frontend/css/categories.css` | The look of this page |
| `frontend/js/app.js` | Starts Firebase. Exports `auth` and `db` |
| `frontend/js/auth.js` | Login, logout, and the navbar profile |
| `firestore.rules` | Decides who can read and write |

The flow:

```
categories.html loads auth.js (navbar) and categories.js (this page)
categories.js imports app.js -> app.js starts Firebase
categories.js reads Firestore -> builds the page
```

---

## The data

| Collection | Fields we save |
|---|---|
| `categories` | `name`, `description` (optional), `createdBy`, `createdAt` |
| `items` | `name`, `categoryId`, `addedBy`, `createdAt`, `imageUrl` (only if there is one) |

- `createdBy` and `addedBy` are the user's own `uid`.
- `createdAt` is `serverTimestamp()`. The server sets the time, not the browser.
- Every item has a `categoryId`. This is how an item belongs to a category.
- The rules check the sizes: category name up to 50 characters, description up to 200, item name up to 60, image link up to 500 and it must start with `https://`.

---

# Part 1 — categories.html

## The head

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Categories | Weekly Winner</title>
    <link rel="stylesheet" href="/css/style.css" />
    <link rel="stylesheet" href="/css/navbar.css" />
    <link rel="stylesheet" href="/css/categories.css" />
  </head>
```

- `<!doctype html>` tells the browser this is HTML5.
- `lang="en"` says the page is English.
- `charset="UTF-8"` lets the page show all letters and symbols.
- The `viewport` line makes the page fit phone screens.
- `<title>` is the text on the browser tab.
- Three CSS files load in order. If two files style the same thing, the later file wins.
  - `style.css` is for the whole site.
  - `navbar.css` is for the menu.
  - `categories.css` is for this page.
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

- The links start with `/` and use `/pages/...`. Without the `/pages/` part, the link gives a 404.
- The `navbar-user` part has five elements that `auth.js` looks for by `id`:

| id | What `auth.js` does with it |
|---|---|
| `user-profile` | Shows it when someone is logged in |
| `user-avatar` | Puts the photo, or the first letter of the name |
| `user-name` | Puts the name |
| `login-link` | Shows it when nobody is logged in |
| `logout-btn` | Shows it when someone is logged in |

- They all start with `hidden`. `auth.js` removes `hidden` from the right ones.
- `categories.js` does not use these. Only `auth.js` does.

## The layout

```html
<main class="categories-layout">
  <aside class="categories-sidebar"> ... </aside>
  <section class="category-details"> ... </section>
</main>
```

- `<main>` is the main content of the page.
- `categories-layout` is a class for the CSS. The sidebar and the details are meant to sit side by side.
- `<aside>` is the left part, the sidebar.
- `<section class="category-details">` is the right part.

## The sidebar

```html
<aside class="categories-sidebar">
  <div class="sidebar-header">
    <h2>Categories</h2>
    <button id="new-category-btn" type="button">+ New</button>
  </div>

  <input
    type="search"
    id="category-search"
    class="category-search"
    placeholder="Search categories..."
    aria-label="Search existing categories"
  />

  <div class="category-list-scroll">
    <div id="category-list" class="category-list">Loading categories...</div>
  </div>

  <p class="sidebar-help">Search existing categories before creating a new one.</p>
</aside>
```

- `new-category-btn` opens the "Create Category" view. `type="button"` means it does not submit a form.
- `type="search"` is a text box for searching.
- `aria-label` gives the box a name for screen readers, because it has no visible label.
- `placeholder` is the gray hint text.
- `category-list-scroll` is a box the CSS can scroll when the list is long.
- `category-list` starts with "Loading categories...". JavaScript replaces this text.
- The help text reminds people to search first, so they do not make duplicates.

## The selected category view

```html
<div id="category-view">
  <div class="category-header">
    <div>
      <h2 id="selected-category-name">Select a category</h2>
      <p id="selected-category-description">Choose a category from the sidebar.</p>
    </div>
    <span id="selected-category-count">0 items</span>
  </div>

  <hr />
```

- `category-view` is the default view. It is the one that is visible.
- The `h2`, the `p`, and the `span` start with default text. JavaScript changes them when a category is selected.
- `<hr />` draws a line.

## The Add Item form

```html
<section class="add-item-section">
  <h3>Add Item</h3>

  <form id="add-item-form">
    <label for="item-name">Item name</label>
    <input type="text" id="item-name" placeholder="Enter item name" maxlength="60" required />

    <label for="item-image">Image URL (optional)</label>
    <input type="url" id="item-image" placeholder="https://example.com/image.jpg"
           pattern="https://.*" maxlength="500" />

    <button type="submit" id="add-item-btn">+ Add Item</button>
  </form>

  <p id="form-message" role="status" aria-live="polite"></p>
</section>
```

- `<label for="item-name">` is linked to the input with the same `id`. Clicking the label puts the cursor in the box.
- `required` stops the form from submitting an empty name.
- `maxlength="60"` stops typing after 60 characters. It matches the rule in `firestore.rules`.
- `type="url"` checks that the text looks like a web address.
- `pattern="https://.*"` accepts only links that start with `https://`.
- `type="submit"` makes the button send the form. The JavaScript listens for this.
- The Add Item button must **not** have `disabled`. The code does not turn it on again. When no category is chosen, the code shows "Select a category first." instead.
- `<p id="form-message">` shows success and error messages.
  - `role="status"` and `aria-live="polite"` make screen readers read each new message.

## The existing items

```html
<hr />

<section class="existing-items-section">
  <div class="items-header">
    <h3>Existing Items</h3>
    <span id="items-total">0 total</span>
  </div>

  <div id="items-list" class="items-list">
    <p>Select a category to view its items.</p>
  </div>
</section>
</div>
```

- `items-total` shows a count like "3 total".
- `items-list` is the box where the items are added. JavaScript fills it.
- The last `</div>` closes `category-view`.

## The Create Category view

```html
<div id="new-category-view" hidden>
  <h2>Create Category</h2>
  <p>Create a new category for weekly competitions.</p>

  <form id="category-form">
    <label for="category-name">Category name</label>
    <input type="text" id="category-name" placeholder="Enter category name" maxlength="50" required />

    <label for="category-description">Description (optional)</label>
    <textarea id="category-description" placeholder="Enter a short description" maxlength="200"></textarea>

    <div class="category-form-actions">
      <button type="submit">+ Create Category</button>
      <button type="button" id="cancel-category-btn">Cancel</button>
    </div>
  </form>

  <p id="category-message" role="status" aria-live="polite"></p>
</div>
```

- The `hidden` attribute hides this view until the user clicks "+ New".
- Only one of the two views is visible at a time. The code switches them.
- The submit button sends the form. Cancel is `type="button"`, so it does not.
- `<textarea>` is a text box with many lines.
- The limits match the rules: 50 for the name, 200 for the description.

## The scripts

```html
<script type="module" src="/js/auth.js"></script>
<script type="module" src="/js/categories.js"></script>
```

- They are at the bottom, so all the elements already exist when the code runs.
- `type="module"` is needed because both files use `import`.
- `auth.js` makes Login, Logout, and the profile work. Without it, the navbar stays empty.
- `categories.js` imports `app.js` itself, so there is no separate tag for `app.js`.

## The ids that JavaScript uses

| id | Used for |
|---|---|
| `category-list` | The sidebar list |
| `category-search` | The search box |
| `category-view`, `new-category-view` | The two views |
| `new-category-btn`, `cancel-category-btn` | Switching views |
| `category-form`, `category-name`, `category-description`, `category-message` | Create a category |
| `selected-category-name`, `selected-category-description`, `selected-category-count` | The selected category header |
| `add-item-form`, `item-name`, `item-image`, `form-message` | Add an item |
| `items-list`, `items-total` | The items list |

If one `id` is spelled differently in the HTML and in the JavaScript, the page crashes with `Cannot read properties of null`.

---

# Part 2 — categories.js

## Imports

```javascript
import { auth, db } from "./app.js";

import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
```

- `auth` and `db` come from `app.js`. `auth` knows who is logged in. `db` is the database.
- `./` means "the same folder as this file".
- From Firestore:
  - `collection` points to a collection, like `categories`.
  - `getDocs` reads all documents in a collection.
  - `addDoc` saves a new document with a new id.
  - `serverTimestamp` gives the time from the server.
- `onAuthStateChanged` runs when the login state changes.
- Every Firebase URL uses version `10.0.0`, the same as `app.js`.
- `deleteDoc` and `doc` are not imported, because users cannot remove items.

## HTML elements

```javascript
const categoryList = document.getElementById("category-list");
```

- `document.getElementById("...")` finds the element with that `id`. It gives the element, or `null` if the page does not have it.
- `const` makes a name that is not changed later.

Every `const` in this section works the same way:

| Variable | id | Used for |
|---|---|---|
| `categoryList` | `category-list` | The sidebar list |
| `categorySearch` | `category-search` | The search box |
| `categoryView` | `category-view` | The selected category view |
| `newCategoryView` | `new-category-view` | The create category view |
| `newCategoryBtn` | `new-category-btn` | Opens the create view |
| `cancelCategoryBtn` | `cancel-category-btn` | Closes the create view |
| `categoryForm` | `category-form` | The create category form |
| `categoryName` | `category-name` | The category name box |
| `categoryDescription` | `category-description` | The description box |
| `categoryMessage` | `category-message` | Messages for the create view |
| `selectedCategoryName` | `selected-category-name` | The heading of the selected category |
| `selectedCategoryDescription` | `selected-category-description` | Its description |
| `selectedCategoryCount` | `selected-category-count` | "3 items" |
| `itemForm` | `add-item-form` | The add item form |
| `itemName` | `item-name` | The item name box |
| `itemImage` | `item-image` | The image link box |
| `itemMessage` | `form-message` | Messages for items |
| `itemsList` | `items-list` | The list of items |
| `itemsTotal` | `items-total` | "3 total" |

## Application state

```javascript
let currentUser = null;
let authReady = false;

let selectedCategoryId = null;

let categories = [];
let items = [];
```

- State is the information the page remembers while it is open.
- `let` is used because these values change.
- `currentUser` is the logged-in user, or `null`.
- `authReady` is `false` until Firebase has finished checking the login.
- `selectedCategoryId` is the id of the category the user clicked, or `null`.
- `categories` and `items` are lists (arrays) of everything read from Firestore. The page draws itself from these lists.

## Authentication

```javascript
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  authReady = true;
});
```

- Firebase runs this when the page loads and finishes checking the login, and again every time someone logs in or out.
- `user` is the logged-in person, or `null`.
- `authReady = true` says: Firebase has answered.
- Why `authReady` is needed: right after the page loads, `currentUser` is `null` even for a logged-in user, until Firebase answers. The forms check `authReady` first, so a logged-in user does not get "Please log in".

## Helper functions

```javascript
function showMessage(element, text, isError = false) {
  element.textContent = text;
  element.style.color = isError ? "red" : "green";
}
```

- Shows a message in the element it receives.
- `isError = false` means: if no third value is given, it is a success message.
- `condition ? "red" : "green"` means: if `isError` is true, use red, otherwise green.
- `textContent` sets plain text. It is safe because the browser does not run it as HTML.

```javascript
function formatItemCount(count) {
  return `${count} ${count === 1 ? "item" : "items"}`;
}
```

- Backticks make a template string. `${...}` puts a value inside the text.
- It gives "1 item", "0 items", or "3 items".

```javascript
function normalizeCategoryName(name) {
  return (name || "").trim().replace(/\s+/g, " ").toLowerCase();
}
```

- `(name || "")` means "the name, or empty text if it is missing". This stops a crash for a category with no name.
- `.trim()` removes spaces at the start and the end.
- `.replace(/\s+/g, " ")` turns every group of spaces into one space. In `/\s+/g`, `\s` is any white space, `+` is "one or more", and `g` is "all of them".
- `.toLowerCase()` makes all letters small.
- It makes `"  Best   PIZZA "` equal to `"best pizza"`. It is used for the search and for finding duplicates.

```javascript
function showCategoryView() {
  categoryView.hidden = false;
  newCategoryView.hidden = true;
}

function showNewCategoryView() {
  categoryView.hidden = true;
  newCategoryView.hidden = false;
  categoryMessage.textContent = "";
}
```

- They switch between the two views by changing the `hidden` attribute.
- The second one also clears the old message in the create view.

```javascript
function getCategoryItems(categoryId) {
  return items.filter((item) => item.categoryId === categoryId);
}
```

- `filter` keeps only the items that pass the test.
- The test: the item's `categoryId` is exactly the one we ask for.
- It gives a new list. The original `items` list is not changed.

## Category search

```javascript
if (categorySearch) {
  categorySearch.addEventListener("input", () => {
    renderCategories();
  });
}
```

- `if (categorySearch)` makes sure the box exists.
- The `input` event happens every time the text in the box changes.
- Every key press draws the sidebar again. `renderCategories` reads the box to filter the list.

## renderCategories — draw the sidebar

```javascript
function renderCategories() {
  categoryList.innerHTML = "";
```

- Clears the list before drawing it again. `innerHTML = ""` is safe here because there is no user text in it.

```javascript
  const searchText = categorySearch
    ? normalizeCategoryName(categorySearch.value)
    : "";
```

- If the search box exists, take its text and clean it. If not, use empty text.

```javascript
  if (categories.length === 0) {
    categoryList.textContent = "No categories yet.";
    return;
  }
```

- With no categories at all, show a message. `return` stops the function.

```javascript
  const filteredCategories = categories.filter((category) =>
    normalizeCategoryName(category.name).includes(searchText)
  );
```

- Keeps the categories whose cleaned name contains the search text.
- With empty search text, `includes("")` is always true, so every category stays.

```javascript
  if (filteredCategories.length === 0) {
    categoryList.textContent = "No matching categories found.";
    return;
  }
```

- If the search matches nothing, show a message.

```javascript
  filteredCategories.forEach((category) => {
    const categoryItems = getCategoryItems(category.id);
```

- `forEach` runs the code for every category in the list.
- `categoryItems` is this category's items. We only need how many.

```javascript
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-card";

    if (category.id === selectedCategoryId) {
      button.classList.add("active");
    }
```

- Each category is a button. `type = "button"` stops it from submitting anything.
- `className = "category-card"` is the class the CSS styles.
- The selected category also gets the class `active`, so the CSS can highlight it.

```javascript
    const name = document.createElement("strong");
    name.className = "category-name";
    name.textContent = category.name;

    const count = document.createElement("small");
    count.textContent = formatItemCount(categoryItems.length);

    button.append(name, count);
```

- Makes a bold name and a small item count.
- `textContent` is used for the name, because a user typed it. If someone writes HTML in a name, it shows as plain text and does not run.
- `button.append(name, count)` puts both inside the button.

```javascript
    button.addEventListener("click", () => {
      selectCategory(category.id);
    });

    categoryList.appendChild(button);
  });
}
```

- Clicking the button selects this category.
- `appendChild` puts the button in the sidebar.

## renderItems — draw the items

```javascript
function renderItems() {
  itemsList.innerHTML = "";

  const categoryItems = getCategoryItems(selectedCategoryId);

  selectedCategoryCount.textContent = formatItemCount(categoryItems.length);
  itemsTotal.textContent = `${categoryItems.length} total`;

  if (categoryItems.length === 0) {
    itemsList.textContent = "No items in this category yet.";
    return;
  }
```

- Clears the list and gets the selected category's items.
- Updates the two counters ("3 items" and "3 total").
- If there are no items, shows a message and stops.

```javascript
  categoryItems.forEach((item) => {
    const row = document.createElement("div");
    row.className = "item-card";

    const content = document.createElement("div");
    content.className = "item-card-content";
```

- For each item, makes a row and a content box.

```javascript
    if (item.imageUrl) {
      const image = document.createElement("img");

      image.className = "item-thumbnail";
      image.src = item.imageUrl;
      image.alt = item.name;
      image.referrerPolicy = "no-referrer";

      content.appendChild(image);
    }
```

- Only draws an image if the item has an `imageUrl`.
- `src` is the picture address. `alt` is the text for screen readers and for broken images.
- `referrerPolicy = "no-referrer"` means the browser does not tell the image site which page asked for it. Some image sites block pictures when they see our address.
- The rule allows only `https://` links, so images are not loaded over an insecure link.

```javascript
    const name = document.createElement("span");
    name.textContent = item.name;
    content.appendChild(name);

    row.append(content);
    itemsList.appendChild(row);
  });
}
```

- Adds the item name as plain text, then puts the row in the list.
- There is no Remove button. The rules block deleting from the browser.

## selectCategory

```javascript
function selectCategory(categoryId) {
  const category = categories.find((c) => c.id === categoryId);

  if (!category) return;
```

- `find` gives the first category with this id, or `undefined`.
- `if (!category) return;` means: if it is not found, stop.

```javascript
  selectedCategoryId = categoryId;
  selectedCategoryName.textContent = category.name;
  selectedCategoryDescription.textContent = category.description || "";
  itemMessage.textContent = "";
```

- Remembers the choice and fills the header.
- `category.description || ""` uses empty text when the category has no description.
- Clears the old message.

```javascript
  showCategoryView();
  renderCategories();
  renderItems();
}
```

- Makes sure the category view is visible.
- Draws the sidebar again, so the new selection is highlighted.
- Draws the items.

## loadData — read from Firestore

```javascript
async function loadData() {
  try {
```

- `async` lets the function wait with `await`.
- `try` runs the code. If something fails, `catch` runs.

```javascript
    const [categorySnapshot, itemSnapshot] = await Promise.all([
      getDocs(collection(db, "categories")),
      getDocs(collection(db, "items"))
    ]);
```

- `collection(db, "categories")` points to the collection.
- `getDocs` reads all its documents.
- `Promise.all` starts both reads at the same time and waits for both. This is faster than one after the other.
- `[a, b] = ...` takes the two answers out of the list.

```javascript
    categories = categorySnapshot.docs.map((snapshot) => ({
      id: snapshot.id,
      ...snapshot.data()
    }));
```

- `.docs` is the list of documents.
- `map` makes a new list. Each document becomes an object.
- `id: snapshot.id` adds the document id.
- `...snapshot.data()` copies all the saved fields (name, description, and so on) into the object.
- The same is done for `items`.

```javascript
    categories.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
```

- Sorts the categories A to Z. `localeCompare` compares text the way people expect.
- `(a.name || "")` stops a crash when a name is missing.

```javascript
    renderCategories();

    if (categories.length > 0) {
      const stillExists = categories.some(
        (category) => category.id === selectedCategoryId
      );

      selectCategory(stillExists ? selectedCategoryId : categories[0].id);
    } else {
      selectedCategoryId = null;
      selectedCategoryName.textContent = "No categories yet";
      selectedCategoryDescription.textContent = "Create a category to get started.";
      selectedCategoryCount.textContent = "0 items";
      itemsTotal.textContent = "0 total";
      itemsList.textContent = "No items available.";
    }
```

- Draws the sidebar.
- If there are categories, `some` checks whether the previously selected one still exists.
- It selects the old one, or the first one. So a category is always selected.
- If there are none, it shows the empty messages.

```javascript
  } catch (error) {
    console.error("Failed to load Firestore data:", error);
    categoryList.textContent = "Unable to load categories.";
    showMessage(itemMessage, "Unable to load data. Please refresh the page.", true);
  }
}
```

- If a read fails, it writes the error in the Console and shows a message.
- `loadData` reads **every** category and **every** item. That is fine for now, but it counts toward the free limit of 50,000 reads a day. This is why it runs only once when the page loads.

## Switching views

```javascript
newCategoryBtn.addEventListener("click", () => {
  showNewCategoryView();
});

cancelCategoryBtn.addEventListener("click", () => {
  categoryForm.reset();
  showCategoryView();
});
```

- "+ New" shows the create view.
- Cancel clears the form with `reset()` and goes back to the category view.

## Create a category

```javascript
categoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
```

- Runs when the form is submitted.
- `event.preventDefault()` stops the browser from reloading the page, which is the default for a form.

```javascript
  const name = categoryName.value.trim();
  const description = categoryDescription.value.trim();
```

- Takes the text from the boxes and removes spaces from the ends. Spaces only would pass `required`, so we trim.

```javascript
  if (!name) {
    showMessage(categoryMessage, "Enter a category name.", true);
    return;
  }

  if (name.length > 50) { ... }
  if (description.length > 200) { ... }
```

- Checks the data before saving. Each `return` stops the function.
- The limits are the same as in the rules. If the code lets a longer name through, the rules reject it with a confusing "permission" error.

```javascript
  if (!authReady) {
    showMessage(categoryMessage, "Checking login status. Please try again.", true);
    return;
  }

  if (!currentUser) {
    showMessage(categoryMessage, "Please log in first.", true);
    return;
  }
```

- If Firebase has not answered yet, ask the user to try again.
- If nobody is logged in, ask for a login.

```javascript
  const submitBtn = categoryForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
```

- Finds the submit button and turns it off, so a double click does not save two categories.

```javascript
  try {
    const snapshot = await getDocs(collection(db, "categories"));

    const latestCategories = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data()
    }));
```

- Reads the categories again, so a category someone made a moment ago is included.

```javascript
    const normalizedName = normalizeCategoryName(name);

    const duplicate = latestCategories.find(
      (category) => normalizeCategoryName(category.name) === normalizedName
    );

    if (duplicate) {
      showMessage(categoryMessage, `The category "${duplicate.name}" already exists. Please choose another name.`, true);
      return;
    }
```

- Compares the cleaned names. "Pizza" and " pizza " are the same.
- If a duplicate exists, it shows a message and stops. The `finally` below still turns the button back on.

```javascript
    const result = await addDoc(collection(db, "categories"), {
      name,
      description,
      createdBy: currentUser.uid,
      createdAt: serverTimestamp()
    });
```

- Saves the new category. `await` waits for the save to finish.
- `name,` is short for `name: name`.
- `createdBy` is the user's own `uid`. `createdAt` is the server time. The rules check both.
- `result.id` is the id of the new document.

```javascript
    categoryForm.reset();

    if (categorySearch) {
      categorySearch.value = "";
    }
```

- Clears the form. Clears the search box, so the new category is not hidden by an old search.

```javascript
    categories.push({
      id: result.id,
      name,
      description,
      createdBy: currentUser.uid
    });
    categories.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    selectCategory(result.id);

    showMessage(itemMessage, "Category created successfully!");
```

- Adds the new category to the list in memory, so we do not read everything again.
- Sorts the list again, then selects the new category. `selectCategory` also switches back to the category view.
- The success message goes in `itemMessage`, because the create view is hidden now.

```javascript
  } catch (error) {
    console.error(error);
    showMessage(categoryMessage, "Failed to create category. Please try again.", true);
  } finally {
    submitBtn.disabled = false;
  }
});
```

- If the save fails (for example, the rules reject it), the Console shows the real error and the user sees a short message.
- `finally` always runs, whether it worked or not. It turns the button back on.

## Add an item

```javascript
itemForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = itemName.value.trim();
  const imageUrl = itemImage.value.trim();
```

- Same start as the category form.

```javascript
  if (!selectedCategoryId) { ... "Select a category first." }
  if (!name) { ... "Enter an item name." }
  if (name.length > 60) { ... }

  if (imageUrl && !imageUrl.startsWith("https://")) {
    showMessage(itemMessage, "The image link must start with https://", true);
    return;
  }

  if (imageUrl.length > 500) { ... }
```

- Checks:
  - a category is selected
  - the name is not empty and is at most 60 characters
  - the image link, if there is one, starts with `https://` and is at most 500 characters
- `imageUrl && ...` means: only check the link when something was typed.
- Then the same login checks as before (`authReady` and `currentUser`), and the submit button is turned off.

```javascript
    const newItem = {
      name,
      categoryId: selectedCategoryId,
      addedBy: currentUser.uid,
      createdAt: serverTimestamp()
    };

    if (imageUrl) newItem.imageUrl = imageUrl;
```

- Builds the item object. `categoryId` links the item to the selected category.
- `imageUrl` is added only if the user typed one. An empty `imageUrl` would be rejected by the rules.

```javascript
    const ref = await addDoc(collection(db, "items"), newItem);

    items.push({
      id: ref.id,
      name,
      categoryId: selectedCategoryId,
      addedBy: currentUser.uid,
      imageUrl
    });

    itemForm.reset();
    renderCategories();
    renderItems();

    showMessage(itemMessage, "Item added successfully!");
```

- Saves the item.
- Adds it to the `items` list in memory, so we do not read everything again.
- Clears the form. Draws the sidebar again, so its item count goes up. Draws the items.
- `catch` and `finally` work the same as in the category form.

## Initial load

```javascript
loadData();
```

- The last line. It starts everything when the page opens.

---

# How it works together

## When the page opens

1. The browser loads the HTML, the CSS, `auth.js`, and `categories.js`.
2. `auth.js` shows Login, or the profile and Logout.
3. `categories.js` finds its elements and starts listening for Firebase's login answer.
4. `loadData()` reads all categories and all items.
5. The sidebar is drawn, and the first category is selected.

## When a user creates a category

1. Click "+ New". The create view shows.
2. Submit. The code checks the data and the login.
3. It reads the categories again and looks for a duplicate.
4. `addDoc` saves the category.
5. The list in memory is updated, and the new category is selected.

## When a user adds an item

1. Choose a category. Type a name, and maybe an `https://` image link.
2. Submit. The code checks the data and the login.
3. `addDoc` saves the item with the category id.
4. The list in memory is updated, and the items and the counts are drawn again.

## What the rules check

| Action | The rules need |
|---|---|
| Read | Nothing. Anyone can read |
| Create a category | Logged in, valid `name`, `createdBy` is your `uid`, `createdAt` is the server time |
| Create an item | Logged in, valid `name`, the category exists, `addedBy` is your `uid`, `createdAt` is the server time, `imageUrl` only if it starts with `https://` |
| Update or delete | Nobody, from the browser |

---

# Security notes

- Every user-typed text uses `textContent`. `innerHTML` is used only to clear a list, with an empty string.
- Hiding a button does not protect anything. The rules do.
- Anyone who is logged in can create many categories and items. The rules do not stop that yet.

---




---

# Limits and later

- The page reads all categories and all items at once. If reads grow, load only the selected category's items with `where("categoryId", "==", id)`.
- Users cannot edit or remove. The team removes items in Firebase Console. Check first that the item is not in a running challenge.
- The image is a link, not an upload. Links can stop working.

---

