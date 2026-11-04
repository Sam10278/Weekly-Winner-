# Learning Time — Secure Cast Vote Cloud Function

**Branch:** `week3/cast-vote`  
**Date:** November 1, 2026  
**Feature:** Secure voting backend

## What I Worked On

Implemented a secure Firebase Cloud Function called `castVote` for the Weekly Winner application.

The function validates voting requests, verifies that users are authenticated, checks whether a challenge is open for voting, and prevents duplicate votes.

## What I Learned

### Firebase Callable Functions
- Learned how to create a callable Cloud Function using Firebase Functions v2.
- Used `request.auth` to verify authenticated users.
- Used `HttpsError` to return meaningful error messages to clients.

### Firestore Transactions
- Learned how Firestore transactions provide atomic updates.
- Used transactions to create vote records and increment vote counts together.
- Learned why all transaction reads should happen before writes.

### Secure Voting
- Used a unique vote document for each user and matchup.
- Prevented duplicate votes by checking whether the vote document already exists.
- Validated matchup information, challenge status, active round, and voting deadline.

### Firebase Emulator Suite
- Configured local emulators for Authentication, Firestore, Functions, and Hosting.
- Learned how to connect the frontend Firebase SDK to local emulators.
- Tested Cloud Functions without modifying production data.

## Testing Performed

- Valid vote — successfully recorded.
- Duplicate vote — rejected.
- Unauthenticated vote — rejected.
- Invalid voting input — rejected.
- Closed challenge — rejected.

## Challenges and Solutions

**Challenge:** Initial voting attempts returned errors because the challenge deadline had passed.

**Solution:** Inspected Firestore timestamps and updated the test challenge deadline.

**Challenge:** Testing the backend required several Firebase services to work together.

**Solution:** Configured the Firebase Emulator Suite and verified that the frontend connected to local services.

## Key Takeaway

I learned how to implement secure server-side voting logic using Firebase Cloud Functions and Firestore transactions, instead of trusting the frontend to enforce voting rules.