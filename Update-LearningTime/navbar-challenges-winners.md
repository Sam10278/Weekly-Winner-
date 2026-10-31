
# Navbar, Challenges, and Past Winners

## 1. Navbar

I updated the navbar so users can move between the different pages of Weekly Winner.

The navbar has Home, Categories, Start Challenge, Vote, and Past Winners.

I also updated the Google login profile. Before logging in, users see a Login button. After logging in, they see their Google profile picture.

When users click the profile picture, a dropdown opens showing their name and a Logout button.

The login information comes from Firebase Authentication. I used `onAuthStateChanged()` in `auth.js` to check whether someone is logged in.

## 2. Hide Closed Categories

I updated `categories.js` so closed categories do not appear on the Categories page.

The code checks the `closed` field in Firestore.

```javascript
.filter((category) => category.closed !== true);
```

If a category has `closed: true`, it is removed from the displayed list. Open categories can still be selected, searched, and used to add items.

## 3. Recent Challenges

I added a Recent Challenges section below the bracket on the homepage.

I created two files:

- `challenge-list.js`
- `challenge-list.css`

The JavaScript gets the latest 20 challenges from Firestore, starting with the newest.

Each card shows the category name, bracket size, challenge status, and time remaining when available.

Clicking a card opens that challenge's bracket.

If there are no challenges, the page shows "Next challenge starts Monday 9:00 AM".

I did not include vote counts on the cards.

## 4. Past Winners

I created the Past Winners page using:

- `past-winners.html`
- `past-winners.js`
- `past-winners.css`

The page reads challenges where `status` is `finished` and sorts them by `finishedAt`, with the newest first.

It uses the final matchup to find the winning item.

Each winner card is designed to show the category, winner name, picture, bracket size, finishing date, and a link to the bracket.

The Firestore query needed a composite index for `status` and `finishedAt`, so I created that index in Firebase Console.

The page now loads correctly and shows an empty message when there are no finished challenges.

## 5. Mobile Layout

I updated `navbar.css` to make the navigation work on desktop and phones.

On smaller screens, the navbar links stay in one horizontal row and can scroll sideways if there is not enough space.

I also made the Recent Challenges and Past Winners cards use fewer columns on smaller screens.

The Google profile picture and dropdown use the same design on desktop and mobile.

## 6. Documentation

I updated the README and Product Backlog.

I fixed the voting rule wording to say that each logged-in user can vote up to 3 times per minute.

I also added an explanation of how weekly challenges are planned to start automatically, how voting works, and where finished challenges appear.

## 7. Testing

I checked the homepage, Categories, Past Winners, Login, and Start Challenge layouts using Chrome's mobile device view.

I also checked that the profile dropdown opens on the homepage.

The Past Winners Firestore query works after creating the index, but the winner cards still need testing with a finished challenge.

The automatic challenge scheduling and voting functions depend on the backend work being completed.

All my changes are on the `Mehedi-complete` branch. The final Pull Request will go into `develop`.
