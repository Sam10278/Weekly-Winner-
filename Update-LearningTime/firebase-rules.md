# Firestore Rules — How It Works

## What is `firestore.rules`?
It's a file that tells Firestore **who can read or write data** in your database.
Think of it like a **security guard** at the door of your database. It is in Common Expression Language (CEL).

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
  allow write: if request.auth != null;
}
```

- `match /categories/{categoryId}` — targets the **categories** collection in Firestore
- `allow read: if true` — **anyone** can read, even without logging in
- `allow write: if request.auth != null` — only **logged in users** can write
- `request.auth` — the currently logged in user. If it is `null` nobody is logged in

---

## The Pattern

```javascript
match /your-collection/{documentId} {
  allow read: if CONDITION;
  allow write: if CONDITION;
}
```
NOTE: {documentId} — a wildcard that means "any document inside that collection". The curly braces {} mean "match anything here".

---

## Common Conditions

| Condition | Meaning |
|---|---|
| `if true` | Anyone can do it |
| `if false` | Nobody can do it |
| `if request.auth != null` | Only logged in users |
| `if request.auth.uid == userId` | Only the owner of that document |

---

## Our Current Rules

| Collection | Read | Write |
|---|---|---|
| categories | Anyone | Logged in users only |
| items | Anyone | Logged in users only |
| votes | Anyone | Logged in users only |
| challenges | Anyone | Logged in users only |
| matchups | Anyone | Logged in users only |

---