<!--
## Update the Changelog

Update the `CHANGELOG.md` BEFORE MERGING INTO MAIN BRANCH.

Use the following format:

## [Date]

### Added
- Describe any new features or files.

### Changed
- Describe any changes or improvements.

### Fixed
- Describe any bugs or issues that were fixed.

Example:

## [2026-09-20]

### Added
- Added a new feature.

### Changed
- Updated existing functionality.

### Fixed
- Fixed a bug.

Keep entries short and specific.
-->


## [2026-10-8]
### Added
- Navbar html in index.html
- added auth.js to index.html 

## [2026-10-8]
### Added
- auth.js with Firebase Google sign-in, logout, and auth state listener
- Login button connected to firebase login fucntion 


## [2026-10-07]

### Added
- Cloud Functions initial setup in backend/functions/index.js
- Backend package.json with firebase-admin and firebase-functions dependencies
- Hello World test function to verify backend is running

## [2026-10-07]

### Added
- firestore-rules file
- lesson on firestore-rules file


## [2026-10-09] — Sujit Lopchan

### Added
- Created shared HTML template structure with Bootstrap dependencies.
- Configured Firebase SDK in `frontend/js/app.js`.
- Initialized Firebase Authentication and Cloud Firestore.
- Connected `frontend/pages/index.html` to the shared Firebase configuration.
- Installed and configured Firebase CLI for local development.
- Created developer documentation in `Update-LearningTime/`:
  - `base-html.md`
  - `firebase-sdk.md`
  - `firebase-cli-hosting.md`
  - `git-workflow.md`

### Tested
- Verified Firebase CLI installation and authentication.
- Started the Firebase Hosting Emulator locally.
- Confirmed successful Firebase initialization in the browser console.
- Verified Firebase SDK scripts load without initialization errors.

### Collaboration
- Created and pushed feature branch `week1/firebase-config`.
- Opened Pull Request #6 for Firebase SDK configuration.
- Resolved merge conflicts while preserving teammates' navbar changes.
- Documented the team's Git and GitHub collaboration workflow.
