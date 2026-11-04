// vote.js - shared voting helpers (frontend).
// The bracket on the home page and the Vote page both use this file.

import { auth, db, functions } from "./app.js";

import {
  httpsCallable
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-functions.js";

import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";


// Turn an error from the Cloud Function into a result the page can show.
function makeErrorResult(error) {
  let code = "unknown";

  if (error && error.code) {
    // Firebase gives codes like "functions/already-exists". Remove the prefix.
    code = String(error.code).replace("functions/", "");
  }

  let message = "Could not save your vote. Please try again.";

  if (code === "unauthenticated") {
    message = "Please log in before voting.";
  } else if (code === "already-exists") {
    message = "You already voted in this matchup.";
  } else if (code === "failed-precondition") {
    message = "Voting is not open for this matchup.";
  } else if (code === "not-found") {
    message = "This matchup was not found.";
  } else if (code === "invalid-argument") {
    message = "Invalid vote.";
  }

  console.error("castVote failed:", error);

  return { ok: false, code: code, message: message };
}


// Send a vote to the castVote Cloud Function.
// It never throws. It always returns { ok, code, message }.
export async function submitVote(matchupId, side) {
  if (!auth.currentUser) {
    return {
      ok: false,
      code: "unauthenticated",
      message: "Please log in before voting."
    };
  }

  if (!matchupId || (side !== "A" && side !== "B")) {
    return {
      ok: false,
      code: "invalid-argument",
      message: "Invalid matchup or voting side."
    };
  }

  try {
    const castVote = httpsCallable(functions, "castVote");
    const result = await castVote({ matchupId: matchupId, side: side });

    return { ok: true, code: "ok", message: "Vote saved.", data: result.data };
  } catch (error) {
    return makeErrorResult(error);
  }
}


// Can the user see the vote counts of a matchup?
// Yes if they voted in it, or if the matchup is already decided.
export function canSeeCounts(hasVoted, isDecided) {
  if (hasVoted === true) {
    return true;
  }

  if (isDecided === true) {
    return true;
  }

  return false;
}


// Work out the totals and the percentages of a matchup.
export function getVoteCounts(matchup) {
  let votesA = 0;
  if (matchup && typeof matchup.votesA === "number") {
    votesA = matchup.votesA;
  }

  let votesB = 0;
  if (matchup && typeof matchup.votesB === "number") {
    votesB = matchup.votesB;
  }

  const total = votesA + votesB;

  let percentA = 0;
  let percentB = 0;

  if (total > 0) {
    percentA = Math.round((votesA / total) * 100);
    percentB = 100 - percentA; // so the two always add up to 100
  }

  return {
    votesA: votesA,
    votesB: votesB,
    total: total,
    percentA: percentA,
    percentB: percentB
  };
}


// Text for a number of votes: "0 votes", "1 vote", "12 votes".
export function formatVotes(count) {
  let number = 0;
  if (typeof count === "number") {
    number = count;
  }

  if (number === 1) {
    return "1 vote";
  }

  return number + " votes";
}


// Can the current user vote in this matchup right now?
//   mySide is "A" or "B" if the user already voted, otherwise null.
export function getVoteState({
  isLoggedIn = false,
  hasVoted = false,
  mySide = null,
  isDecided = false,
  isOpen = false,
  isCurrentRound = false,
  hasTimeRemaining = false,
  hasBothItems = false
} = {}) {
  let reason = null;

  if (isDecided) {
    reason = "This matchup has already been decided.";
  } else if (!isLoggedIn) {
    reason = "Please log in to vote.";
  } else if (hasVoted) {
    reason = "You have already voted in this matchup.";
  } else if (!isOpen || !isCurrentRound || !hasTimeRemaining) {
    reason = "Voting is not currently open.";
  } else if (!hasBothItems) {
    reason = "This matchup is not ready for voting.";
  }

  return {
    canVote: reason === null,
    disabled: reason !== null,
    hasVoted: hasVoted,
    mySide: mySide,
    canSeeCounts: canSeeCounts(hasVoted, isDecided),
    reason: reason
  };
}


// Watch the votes of one user. The page gets an object like { matchupId: "A" }.
// It returns a function. Call it to stop watching (for example when the user logs out).
export function watchMyVotes(userId, callback) {
  if (!userId) {
    callback({});
    return function () {};
  }

  // The rules only let a user read their own votes, so we filter by userId.
  const votesQuery = query(
    collection(db, "votes"),
    where("userId", "==", userId)
  );

  return onSnapshot(
    votesQuery,
    (snapshot) => {
      const myVotes = {};

      for (const doc of snapshot.docs) {
        const vote = doc.data();

        if (vote.matchupId) {
          myVotes[vote.matchupId] = vote.side;
        }
      }

      callback(myVotes);
    },
    (error) => {
      console.error("Could not load your votes:", error);
      callback({});
    }
  );
}