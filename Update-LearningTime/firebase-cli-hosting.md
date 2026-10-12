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