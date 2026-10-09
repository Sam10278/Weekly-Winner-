# Git & GitHub Workflow — How It Works

## What is Git?

Git is a version control system that tracks changes to our project.

It allows multiple developers to work on different features without overwriting each other's code.

GitHub is where we store our shared repository and collaborate through pull requests.


## Section 1 — Creating a Feature Branch

### Command

```bash
git switch -c week1/firebase-config
```

### Explanation

- `git switch` changes the current branch.
- `-c` creates a new branch.
- `week1/firebase-config` is the feature branch name.

We use feature branches to keep our work separate from the main branch.


## Section 2 — Checking Git Status

### Command

```bash
git status
```

### Explanation

This command shows:

- The current branch
- Modified files
- Untracked files
- Files staged for commit

We use this command before committing changes.


## Section 3 — Staging Changes

### Command

```bash
git add frontend/js/app.js frontend/pages/index.html
```

### Explanation

`git add` stages selected files for the next commit.



## Section 4 — Committing Changes

### Command

```bash
git commit -m "Week 1: Configure Firebase SDK and initialize services"
```

### Explanation

A commit saves a snapshot of the staged changes.

A descriptive commit message helps teammates understand what was implemented.


## Section 5 — Pushing Changes to GitHub

### Command

```bash
git push -u origin week1/firebase-config
```

### Explanation

- `git push` uploads commits to GitHub.
- `origin` refers to the remote repository.
- `-u` establishes the upstream tracking branch.

This makes our work available to other developers.


## Section 6 — Creating a Pull Request

After pushing changes:

1. Open the GitHub repository.
2. Navigate to Pull Requests.
3. Select New Pull Request.
4. Choose `main` as the base branch.
5. Choose the feature branch as the compare branch.
6. Add a descriptive title and summary.
7. Create the pull request.

### Our Team Workflow

For the Every Week a Winner project:

- Developers work on separate branches.
- Each developer creates a pull request.
- Maygoal reviews pull requests.
- Maygoal merges approved changes into `main`.

This process helps maintain code quality and avoid conflicting changes.


## Section 7 — Resolving Merge Conflicts

### What is a merge conflict?

A merge conflict occurs when Git cannot automatically combine changes from different branches.

During Firebase configuration, we encountered a conflict in:

`frontend/pages/index.html`

The main branch contained navbar stylesheet references, while our feature branch contained Firebase SDK scripts.

### How We Resolved It

1. Opened the conflict in VS Code Merge Editor.
2. Reviewed incoming and current changes.
3. Preserved the navbar stylesheet references.
4. Preserved the Firebase SDK initialization scripts.
5. Verified the combined result.
6. Completed the merge.
7. Committed the merge resolution.

### What We Learned

Merge conflicts do not necessarily mean something is broken.

They indicate that Git needs help deciding how to combine changes.

We must review both versions carefully to avoid losing teammates' work.


## Section 8 — Synchronizing With Main

### Commands

```bash
git fetch origin
git switch main
git pull origin main
```

### Explanation

- `git fetch` downloads remote updates.
- `git switch main` switches to the main branch.
- `git pull origin main` updates the local main branch.

Keeping our local repository synchronized helps reduce future conflicts.


## Section 9 — Viewing Commit History

### Command

```bash
git log --all --oneline
```

### Explanation

This displays the repository's commit history.

We can use it to:

- Identify previous changes
- Find commit IDs
- Review teammates' contributions
- Understand project development history

## Key Takeaways

Through this project, I learned how to:

1. Create and manage Git branches.
2. Track changes using Git status.
3. Stage and commit project files.
4. Push changes to GitHub.
5. Create pull requests for code review.
6. Resolve merge conflicts in VS Code.
7. Collaborate with teammates using a shared repository.

These practices are important for collaborative software development.