# Base HTML Template — How It Works

## What is the base template?

`frontend/pages/base.html` is a starting file for every new page in
Every Week a Winner. It already has the shared parts, so each page
only adds its own content.

## Section 1 — What is inside base.html

- **Head:** viewport tag (responsive layout), page title, and the
  CSS links `style.css` and `navbar.css`
- **Navbar:** the brand name, the six page links, and the user area
- **Main:** an empty section where each page puts its content
- **Script:** `auth.js` at the bottom of the body

```html
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Every Week a Winner</title>
  <link rel="stylesheet" href="/css/style.css">
  <link rel="stylesheet" href="/css/navbar.css">
</head>
<body>
  <nav class="navbar"> ... </nav>
  <main> <!-- PAGE CONTENT GOES HERE --> </main>
  <script type="module" src="/js/auth.js"></script>
</body>
```

## Section 2 — Shared navigation

The navbar links to: Home, Add Category, Add Items, Start Challenge,
Vote, and Past Winners.

The user area has three ids that `auth.js` looks for:

| id | What it is |
|---|---|
| `user-name` | Shows the logged-in user's name |
| `login-link` | The Login link (shown when logged out) |
| `logout-btn` | The Logout button (shown when logged in) |

If a page copies the navbar but loses these ids, the Login and
Logout buttons will not switch.

## Section 3 — Paths start with /

All paths start with `/`, for example `/css/style.css`.
Firebase Hosting uses the `frontend/` folder as the site root.
Pages inside `frontend/pages/` would break with `../` paths,
so `/` always starts from the root.

## Section 4 — Reusing the template

1. Copy `frontend/pages/base.html`.
2. Save the copy as a new file in `frontend/pages/`.
3. Change the page title.
4. Put the page content inside `<main>`.
5. Add any page-specific CSS or JS links.

Note: plain HTML cannot inherit another HTML file. The template
must be copied. If the navbar changes, update it in every page.

## Section 5 — Testing

- The page opens with no red errors in the Console tab.
- The navbar links go to real pages.
- CSS loads (the navbar is styled).
- Login and Logout show correctly after `auth.js` loads.


## Contribution

Developer: Sujit Lopchan (10/8/2026)