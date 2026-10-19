# Firestore Rules — How It Works

## What is `firestore.rules`?

It's a file that tells Firestore **who can read or write data** in our database.
Think of it like a **security guard** at the door of the database.

The rules language is based on Common Expression Language (CEL).
The rules run on Google's servers. Users cannot change them from the browser.

---

## Basic Structure

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // your rules go here
  }
}
```

The opening lines are always the same.

---

## How a rule works

```javascript
match /categories/{categoryId} {
  allow read: if true;
  allow create: if request.auth != null;
}
```

- `match /categories/{categoryId}` — targets the **categories** collection in Firestore
- `allow read: if true` — **anyone** can read, even without logging in
- `allow create: if request.auth != null` — only **logged in users** can save a new document
- `request.auth` — the currently logged in user. If it is `null` nobody is logged in

### Read and write are groups

| Word | Covers |
|---|---|
| `read` | `get` and `list` |
| `write` | `create`, `update` and `delete` |

We use `create`, `update` and `delete` separately, so we can allow one and block the others.
`allow update, delete: if false;` means nobody can change or delete a document from the browser.

---

## The Pattern

```javascript
match /your-collection/{documentId} {
  allow read: if CONDITION;
  allow create: if CONDITION;
  allow update, delete: if CONDITION;
}
```

NOTE: `{documentId}` — a wildcard that means "any document inside that collection". The curly braces `{}` mean "match anything here".

Anything we do not list is blocked.

---

## Common Conditions

| Condition | Meaning |
|---|---|
| `if true` | Anyone can do it |
| `if false` | Nobody can do it |
| `if request.auth != null` | Only logged in users |
| `if request.auth.uid == userId` | Only the owner of that document |
| `a && b` | Both must be true ("and") |
| `a \|\| b` | One of them must be true ("or") |
| `x is string` | The value is text |
| `x in [8, 16, 32]` | The value is in the list |
| `exists(path)` | That document exists |

---

## Checking the data

Rules can check what is being saved, not only who saves it.

| Name | Meaning |
|---|---|
| `request.resource.data` | The data the user wants to save |
| `resource.data` | The data that is already in the database |
| `request.time` | The server time of the request |
| `request.auth.uid` | The id of the logged in user |

---

## Helper functions

Functions keep the rules short. We write them once, at the top.

```javascript
function signedIn() {
  return request.auth != null;
}

// text with 1 to max characters
function validText(text, max) {
  return text is string && text.size() > 0 && text.size() <= max;
}
```

---

## One rule line by line

```javascript
match /categories/{categoryId} {
  allow read: if true;
  allow create: if signedIn()
    && request.resource.data.keys().hasAll(['name', 'createdBy', 'createdAt'])
    && validText(request.resource.data.name, 50)
    && request.resource.data.createdBy == request.auth.uid
    && request.resource.data.createdAt == request.time;
  allow update, delete: if false;
}
```

- `allow read: if true` — anyone can read categories. The home page is public.
- `allow create: if ...` — saving a new category. **Every** line joined by `&&` must be true.
  - `signedIn()` — the user is logged in.
  - `keys().hasAll([...])` — the three fields exist.
  - `validText(name, 50)` — the name is text with 1 to 50 characters.
  - `createdBy == request.auth.uid` — nobody can pretend to be someone else.
  - `createdAt == request.time` — the time must come from `serverTimestamp()`. The browser clock cannot be used.
- `allow update, delete: if false` — nobody can edit or delete from the browser.

---

## Our Current Rules

| Collection | Read | Create | Update / Delete |
|---|---|---|---|
| categories | Anyone | Logged in, valid name, own `uid` | Nobody |
| items | Anyone | Logged in, valid name, category exists, own `uid` | Nobody |
| challenges | Anyone | Logged in, size 8, 16 or 32, status "open", category exists | Nobody |
| matchups | Anyone | Logged in, counts start at 0, no winner yet | Nobody |
| votes | Only your own votes | Nobody | Nobody |

"Nobody" means nobody from the browser.

### Fields each collection needs

| Collection | Fields |
|---|---|
| `categories` | `name`, `createdBy`, `createdAt` |
| `items` | `name`, `categoryId`, `addedBy`, `createdAt`, optional `imageUrl` |
| `challenges` | `categoryId`, `bracketSize`, `status` ("open"), `createdBy`, `createdAt`, `roundEndsAt` |
| `matchups` | `challengeId`, `round`, `position`, `itemA`, `itemB`, `votesA` (0), `votesB` (0), `winnerId` (null) |

If a save fails with `Missing or insufficient permissions`, check:

- the field names
- `createdBy` or `addedBy` is `user.uid`
- `createdAt` is `serverTimestamp()`, not `new Date()`
- the user is logged in
- the category exists (for items and challenges)

---

## Votes and Cloud Functions

- Rules cannot count. They cannot enforce "3 votes per minute".
- So `votes` is closed from the browser. A Cloud Function will check the limit, save the vote, and update the counts.
- Cloud Functions use the Admin SDK, so the rules do not block them.
- Later the function will also create the challenge and its matchups. Then the browser `create` rules for those can become `if false`.

---

## Known gaps

- A logged in user can create a matchup alone from the browser. This closes when the Cloud Function takes over.
- The rules check that the required fields exist, but they do not block extra fields.
- Nothing stops a user from making many categories.
- Nothing blocks duplicate names.

---

## Before deploy

 `firebase.json` must point to the file:
```json
   "firestore": { "rules": "firestore.rules" }
```


## Testing

- The Hosting emulator does **not** run the rules. Test them on the real project.
- Firebase Console → Firestore → Rules → **Rules Playground** lets you try a read or a write without running the app.
- Then test in the app: add a category, add an item, start a challenge.
- Test logged out too. A save should fail.

---

## Deadline

Firestore starts in test mode. It ends about 30 days after the database was created.
After that date, every read and write is blocked unless rules are deployed.
Check the date in Firebase Console → Firestore → Rules.

Cloud Storage has its own rules and its own date.