# Weekly-Winner-

Every Week a Winner

## What is Weekly Winner?

Weekly Winner is a web app where users vote for their favorite items in tournament bracket challenges. Each challenge is single elimination: users vote between two items in each matchup, and the winner moves to the next round. Vote counts update live for everyone.

OUR WEB APP IS LIVE AT: https://project-cf1e9443-caf0-460e-9ef.web.app/

### Goal

Build a public website where a community can create bracket challenges and decide a winner together, with everyone seeing the same live results on any device.

### Objective

- Let users sign in with Google
- Let logged-in users add categories, and add items to a category
- Start a new bracket challenge automatically every Monday at 9:00 AM (8 or 16 items, picked at random)
- Pick a category that has not been used and has enough items, then hide it so nobody adds items while its challenge runs
- Pick the bracket items randomly from the category's pool
- Let each logged-in user vote once in each matchup of the active round
- Show vote counts only after the user has voted in that matchup, with live updates and a countdown timer for each round
- Close each round after 24 hours, pick the winner by votes, and move the winner forward automatically
- Show the winner and past winners of completed challenges
- Work on phones, tablets, and computers
- Run on Google Cloud within the free tier

### Tools used

| Part | Tool |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Firebase Cloud Functions |
| Database | Cloud Firestore (NoSQL) |
| Live updates | Firestore `onSnapshot` |
| Login | Firebase Authentication (Google sign-in) |
| Image storage | Cloud Storage |
| Round timer | Cloud Scheduler |
| Hosting | Firebase Hosting |
| Code and teamwork | Git, GitHub |
| Development |  Firebase CLI, Node.js |



## Important Notes

Your three most important Git commands are:

```bash
git add .
git commit -m "your message"
git push
```

Always check your current branch:

```bash
git branch
```

## 🔀 Work on Your Branch: Pull Request


- `main` → Stable, production-ready code.
- `develop` → Team development branch where completed features are merged.

### Step 1: Update Your Local Develop Branch

Before starting new work, get the latest changes from `develop`:

```bash
git checkout develop
git pull origin develop
```

### Step 2: Create Your Feature Branch

Always create your new branch from `develop`, NOT `main`:

```bash
git checkout develop
git checkout -b name-of-my-new-branch
```

### Step 3: Make Changes and Commit

After finishing your changes:

```bash
git add .
git commit -m "Describe your changes"
```

### Step 4: Push Your Branch to GitHub

```bash
git push -u origin name-of-my-new-branch
```

### Step 5: Create a Pull Request

Go to GitHub → Select your branch → Compare & pull request.

Make sure:

- Base branch: `develop`
- Compare branch: `name-of-my-new-branch`

Create the Pull Request.

After review and approval, merge your feature branch into `develop`.

**Do NOT merge feature branches directly into `main`.**

---

## 🔄 Rebase and Merge Conflicts

If your feature branch is behind `develop`, rebase it to get the latest changes.

### Step 1: Fetch Latest Updates

```bash
git fetch origin
```

### Step 2: Switch to Your Feature Branch

```bash
git checkout name-of-my-new-branch
```

### Step 3: Rebase Onto Develop

```bash
git rebase origin/develop
```

Rebase updates your feature branch with the latest changes from `develop`.

### Resolving Merge Conflicts

If conflicts occur, Git may show something like:

```text
<<<<<<< HEAD
changes from develop
=======
your changes
>>>>>>> commit-id
```

Review both versions carefully.

- Keep both changes if they work together.
- Otherwise, decide which code to keep or modify.
- Delete the conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).

**Important:** Do not automatically keep both versions. Make sure the final code works correctly.

After resolving the conflicts:

```bash
git add .
git rebase --continue
```

Repeat until the rebase is complete.

Then test your code and update your remote feature branch:

```bash
git push --force-with-lease
```

**Note:** Only use `--force-with-lease` on your own feature branch after rebasing. Never force-push to `develop` or `main`.


## ⚠️ Things to Remember

1. Always check that you are on the correct branch before committing.
2. Never push directly to `main` or `develop`.
3. Always create feature branches from the latest `develop`.
4. Update the `CHANGELOG` with what you changed, added, or fixed.
5. Rebase your feature branch onto `develop` when it falls behind.
6. Resolve merge conflicts carefully and test your code.
7. Always create Pull Requests targeting `develop`.

---

## 🌿 Branch Workflow

```text
main
  ↑
develop
  ↑
  ├── feature
  ├── feature
  └── feature
```




    
## How Weekly Winner Works

### Starting a Challenge

A new challenge is planned to start automatically every Monday at 9:00 AM (Central Time).

The system selects a category that has enough items and has not been used in another challenge. It then randomly selects the items and creates a tournament bracket.

Each challenge can have 8 or 16 items, depending on what is available.

### Voting

Users must log in before voting.

Each logged-in user can vote up to 3 times per minute. They choose their favorite item in a matchup, and the vote counts update live.

When a round ends, the item with the most votes moves to the next round.

The challenge continues until one item becomes the winner.

### Past Winners

Finished challenges appear on the Past Winners page. Users can see the category, winner, bracket size, finish date, and the completed bracket.