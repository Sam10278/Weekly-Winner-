# Learning Time — Client-Side Voting

**Branch:** `week3/vote-client-develop`  
**Date:** November 1, 2026  
**Feature:** Frontend voting integration

## What I Worked On

Worked on connecting the Weekly Winner frontend voting functionality to the secure Firebase `castVote` Cloud Function.

## What I Learned

### Firebase Callable Functions
- Learned how the Firebase client SDK communicates with backend callable functions.
- Used `httpsCallable()` to invoke the `castVote` function.
- Learned how to pass structured data containing the matchup ID and selected voting side.

### Firebase Authentication
- Learned how authenticated user information is passed to callable Cloud Functions.
- Understood why voting permissions must be verified on the backend.

### Error Handling
- Learned how to handle errors returned by Firebase callable functions.
- Reviewed different voting failure scenarios, including unauthenticated requests, duplicate votes, and closed challenges.

### Local Testing
- Used the Firebase Emulator Suite to test frontend-to-backend communication.
- Used Chrome DevTools to inspect errors and successful function responses.

## Challenges and Solutions

**Challenge:** Voting requests could fail because of authentication, invalid input, or challenge restrictions.

**Solution:** Used backend error responses to identify the cause and verify expected behavior.

## Key Takeaway

I learned how to connect a JavaScript frontend to secure Firebase Cloud Functions and why backend validation is essential for maintaining voting integrity.