# Product Backlog

## User requirements: 
  - Sign in with Google
  - Check menu to:
    - Add Category
    - Add items on a Category
    - Login/Sign Up 
    - Start a bracket challenge for the category
      - Get to choose the number of items competing (ex: 32, 16, 8, ...)
      - Items randomly picked from the category's pool for the bracket challenge
      - Show an error message if number of items in the pool is not enough for picked bracket challenge
    - Vote for a Challenge
      - See a countdown timer for each active match (layer 1/32, 1/16, ...)
      - See the overall movement of items to the top
      - Watch vote counts update live
      - Votting for each layer expires after 1 day
      - Each user can vote 3 times per minute 
  - See the list of previous winner and completed challenges



## Technical requirements:
  # Tools 
    **Login**: Firebase Auth
    **Database*: Firestore (categories, items pool, challenges, matchups, votes)
    **Bracket logic*: Cloud Fucntions 
    **Live updates*: Firestore onSnapshot
    **Auto-advance after round's expirition**:	Cloud Scheduler triggers a Cloud Function
    **Host the website**: Firebase Hosting or Cloud Run
    **Store images**: Cloud Storage
   