# Firebase CLI and Hosting — How It Works

## What is the Firebase CLI?

The Firebase CLI (Command-Line Interface) is a terminal tool for managing
our Firebase project. We use it to log in, deploy the site, and test the
site on our own computer.

## Section 1 — Install and check

```powershell
npm install -g firebase-tools
firebase --version
```

- `-g` installs it for the whole computer, not one project.
- If you see `ENOSPC: no space left on device`, free some disk space
  and run the install again.

## Section 2 — Log in

```powershell
firebase login
```

A browser window opens. Pick the Google account that was added to the
project. Check your access with:

```powershell
firebase projects:list
```

## Section 3 — Project files

- `.firebaserc` — says which Firebase project this folder belongs to.
- `firebase.json` — says which folder is the website.

Our `firebase.json` uses `"public": "frontend"`. Firebase serves that
folder as the root of the site. This is why paths such as `/css/style.css`
start with `/`.

## Section 4 — Test locally with the Hosting Emulator

```powershell
firebase emulators:start --only hosting
```

- It serves our `frontend` folder on your computer.
- Open `http://localhost:5000/` for the home page.
- Other pages are at `/pages/login.html`, `/pages/vote.html`, and so on.
- Stop it with **Ctrl + C**.

Notes:
- Use `localhost`, not `127.0.0.1`. Google login may fail on
  `127.0.0.1` because it is not in Firebase's authorized domains.
- Only Hosting is emulated. Login and the database still use our real
  Firebase project.
- A favicon 404 in the Console is harmless.

## Section 4.1 — Emulator ports

### What the address means

```text
http://localhost:5000
```

- `localhost` means "this computer". The site is not on the internet.
- `5000` is a port number. A computer runs many programs at once, and each
  one listens on its own port. Think of a port as a door number.

### Where does port 5000 come from?

We did not set it. The port is built into the Firebase CLI program on each
computer.

When you run `firebase emulators:start`, the CLI looks in `firebase.json`
for a port. If it finds none, it uses its own default.

| Emulator | Default port |
|---|---|
| Hosting | 5000 |
| Cloud Functions | 5001 |
| Firestore | 8080 |
| Authentication | 9099 |
| Emulator UI | 4000 |

Everyone on the team gets the same port without any setup, because
everyone has the same CLI default.

### How to see the real port

Read the table the terminal prints when the emulator starts:

```text
┌───────────┬────────────────┐
│ Emulator  │ Host:Port      │
├───────────┼────────────────┤
│ Hosting   │ 127.0.0.1:5000 │
└───────────┴────────────────┘
```

If the table shows a different port, use that one.


### If the default port is busy

Recent CLI versions may pick another free port when no port is set in
`firebase.json`, and they print it in the table. If a port is set in
`firebase.json` and it is busy, the emulator stops with an error.

## Section 5 — Deploy

```powershell
firebase deploy
```

This replaces the live site with the files in your folder.

**PLEASE PAY ATTENTION:** only deploy from the `main` branch after a merge. Deploying
from your own branch can replace the live site with unfinished work.
If you want to see how your changes look like before committing to your branch use the emulator to test your branch.

## Section 6 — Common problems

| Problem | Fix |
|---|---|
| 404 on a page | Check the path starts with `/` and the file is inside `frontend/` |
| Old version shows after a deploy | Press Ctrl + Shift + R |
| CSS or JS gives 404 | Check `firebase.json` uses `"public": "frontend"` |
| `ENOSPC` error | Free disk space and run the install again |

## Section 7 — Team workflow

1. Work on your own branch.
2. Test with the emulator.
3. Open a pull request into `main`.
4. After the merge,  we have to run `git pull` and `firebase deploy` on MAIN BRANCH.



## Contribution

Developer: Sujit Lopchan (10/8/2026)