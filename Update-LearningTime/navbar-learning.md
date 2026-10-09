# Navbar Setup — How It Works

## What is the Navbar?
The navbar is the menu at the top of the website.

It lets users move between the main pages of Weekly Winner without typing a new URL.

---

## What we added

### index.html
We added the navbar HTML near the top of the `<body>` in:

`frontend/pages/index.html`

The navbar includes links for:

| Link | Page |
|---|---|
| Weekly Winner | `index.html` |
| Home | `index.html` |
| Add Category | `category.html` |
| Add Items | `add-items.html` |
| Start Challenge | `start-challenge.html` |
| Vote | `vote.html` |
| Past Winners | `past-winners.html` |
| Login | `login.html` |

Example:

```html
<nav class="navbar">
  <a class="navbar-brand" href="index.html">Weekly Winner</a>

  <div class="navbar-links">
    <a href="index.html">Home</a>
    <a href="category.html">Add Category</a>
    <a href="add-items.html">Add Items</a>
    <a href="start-challenge.html">Start Challenge</a>
    <a href="vote.html">Vote</a>
    <a href="past-winners.html">Past Winners</a>
  </div>

  <div class="navbar-user">
    <a href="login.html">Login</a>
  </div>
</nav>
```

---

## navbar.css
The navbar styling is stored in:

`frontend/css/navbar.css`

We linked this file inside `index.html` with:

```html
<link rel="stylesheet" href="../css/navbar.css">
```

The CSS controls:

- The navbar layout
- Spacing between links
- The Weekly Winner title
- The navigation buttons
- The Login button
- Hover effects
- The border under the navbar

Example:

```css
.navbar {
    display: flex;
    align-items: center;
    padding: 10px 24px;
    background-color: white;
    border-bottom: 1px solid #ddd;
}

.navbar-brand {
    font-weight: bold;
    color: green;
    text-decoration: none;
    margin-right: 40px;
}

.navbar-links {
    display: flex;
    gap: 12px;
    align-items: center;
}

.navbar-links a,
.navbar-user a {
    text-decoration: none;
    color: black;
    padding: 8px 14px;
    border: 1px solid #ccc;
    background-color: white;
    font-size: 14px;
}

.navbar-links a:hover,
.navbar-user a:hover {
    background-color: #f2f2f2;
}

.navbar-user {
    margin-left: auto;
}
```

---

## How the CSS works

- `display: flex` — puts the navbar items in one row
- `align-items: center` — keeps everything vertically centered
- `gap` — adds space between the navigation links
- `margin-right` — adds space between Weekly Winner and the Home button
- `margin-left: auto` — pushes the Login button to the far right
- `:hover` — changes the background when the mouse is over a link

---

## How we tested it

We used Firebase Hosting locally.

From the project root:

```bash
firebase serve
```

Firebase served the project from the `frontend` folder.

Because `index.html` is inside `frontend/pages/`, we opened:

```text
http://localhost:5002/pages/index.html
```

This let us check that:

- The navbar appeared
- The CSS loaded correctly
- The links were visible
- The Login link was on the right
- The page still loaded the existing Firebase content

---

## Git branch used

The navbar work was done on:

```text
week1/navbar
```

When the task is complete, the changes can be committed and pushed:

```bash
git add frontend/pages/index.html frontend/css/navbar.css
git commit -m "build navbar"
git push -u origin week1/navbar
```

Then a pull request can be opened into `main`.

---

## What we will add later

- Connect login state to the navbar
- Hide or show the Login button based on authentication
- Make the navbar work well on smaller screens
- Keep the same navbar style on all pages
