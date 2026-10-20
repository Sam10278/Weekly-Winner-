<!--
## Update the Changelog

Update the `CHANGELOG.md` BEFORE MERGING INTO MAIN BRANCH.

Use the following format:

## [PR: #NUMBER][Date]

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


## [PR: #11] [2026-10-19]
### Added
- Categories page: one page to browse and search categories, create a category, and add items to a category
- categories.js reads categories and items from Firestore and saves new ones

### Changed
- Navbar: "Add Category" and "Add Items" replaced by one "Add Category & Items" link


## [PR: #10] [2026-10-19]
### Added
- User profile in the navbar: a round photo and the name, shown when logged in

### Changed
- auth.js: now shows the profile and the Logout button when logged in, and the Login link when logged out
- navbar.css: some styles the profile photo, the name, and the Logout button


## [PR: #9] [2026-10-19]

### Added
- bracket.js builds the bracket for 8, 16 or 32 teams (size from ?size= for now)

### Changed
- Bracket boxes hold one item each, with a Vote button per item and a Winner box in the middle
- bracket.css, index.html and bracket.html use the generated bracket


## [PR: #7] [2026-10-12]

### Added 
- base-html learning doc
- Firebase SDK learning doc
- Firebase CLI and Hosting emulator lesson notes, including emulator ports


## [PR: #6] [2026-10-12]

### Added
- base.html shared page template with navbar, CSS links and auth.js


## [PR: #5] [2026-10-12]
### Added
- app.js exports app, auth, db and storage for other files to use
### Changged
- Firebase config and initialization moved to app.js
- auth.js now imports auth from app.js


## [PR: #4] [2026-10-8]
### Added
- Navbar html in index.html
- added auth.js to index.html 

## [PR: #3] [2026-10-8]
### Added
- auth.js with Firebase Google sign-in, logout, and auth state listener
- Login button connected to firebase login fucntion 


## [PR: #2] [2026-10-07]

### Added
- Cloud Functions initial setup in backend/functions/index.js
- Backend package.json with firebase-admin and firebase-functions dependencies
- Hello World test function to verify backend is running

## [PR: #1] [2026-10-07]

### Added
- firestore-rules file
- lesson on firestore-rules file

