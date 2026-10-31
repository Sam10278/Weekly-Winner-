# Weekly-Winner-

Every Week a Winner

## What is Weekly Winner?

Weekly Winner is a web app where users vote for their favorite items in tournament bracket challenges. Each challenge is single elimination: users vote between two items in each matchup, and the winner moves to the next round. Vote counts update live for everyone.

OUR WEB APP IS LIVE AT: https://project-cf1e9443-caf0-460e-9ef.web.app/

### Goal

Build a public website where a community can create bracket challenges and decide a winner together, with everyone seeing the same live results on any device.

### Objective

- Let users sign in with Google
- Let users add categories and add items to a category
- Let users start a bracket challenge and choose its size (32, 16, 8, ...)
- Pick the bracket items randomly from the category's pool
- Show an error if the category does not have enough items
- Let each logged-in user vote up to 3 times per minute in matchups.
- Show live vote counts and a countdown timer for each round
- Close each round after 1 day and move the winner forward automatically
- Show past winners and completed challenges
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






## Important Notes:

Your three best friends among Git commands are:

```bash
git add .
```

```bash
git commit -m "your message"
```

```bash
git push
```
## 🔀 Work on Your Branch: PULL REQUEST

After pulling all the updates from the repo to your local repo,
create a new branch from the the `main` branch (locally):

```bash
git checkout main
git pull
git checkout -b name-of-my-new-branch
```
Then push the new branch created to the remore(github) repo:
```bash
git push -u origin name-of-my-new-branch
```
Then: Go to GitHub → select your branch → Open/Compare & pull request → create the Pull Request.

## Rebase and Merge Conflicts
Rebase your branch if you see it is behind main (it says whether it is behind main or not - somewhere in the PR, or just heck if there is new commits to main that when you branch out you did not have it as part of your branch), rebase is basically updating your branch with the latest changes to main
after rebase when conflicts occur (after the rebase this is common) : keep changes for both your changes and main changes and juts delete the extra stuff like:
```bash
<<<<<<< HEAD
changes from main
=======
your changes
>>>>>>> your commit message
```
Keep both sets of changes: the ones from main and your own. Then delete the extra marker lines ``` ```bash

(<<<<<<<, =======, >>>>>>>).
```

Then run:
```bash
git add .
git rebase --continue
```

## ⚠️ Things to Remember

1. Always make sure you are on the correct branch before committing
2. Never push directly to main; always work on a branch and open a Pull Request
3. Update the CHANGELOG with what you have changed, added and fixed 
4. Rebase your branch!


    
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