# Product Backlog

## User requirements: 
  - ### Sign in with Google
  - ### Check menu to:
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
  - ### See the list of previous winner and completed challenges
  - ### Works on any device
  - ### Every user sees the same updated state



## Technical requirements:

  - ### Live updates appear fast
  - ### No page refresh needed for live updates
  - ### Must use google cloud
  - ### Tools 
    - **Login**: Firebase Auth
    - **Database**: Firestore
    - **Bracket logic**: Cloud Fucntions 
    - **Live updates**: Firestore onSnapshot
    - **Auto-advance after round's expirition**:	Cloud Scheduler triggers a Cloud Function
    - **Host the website**: Firebase Hosting or Cloud Run
    - **Store images**: Cloud Storage
  
- ### Codebase and Languages
  - **Frontend**: HTML, CSS, JavaScript	
  - **Backend**: JavaScript, Node.js
  - **Database rules**:	Firestore Rules language (NoSQL)
  - **Cloud Scheduler**: Config file to set a timer and point to the fucntion