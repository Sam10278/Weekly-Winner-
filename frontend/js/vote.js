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


// Submit a vote through the secure Cloud Function
export async function submitVote(matchupId, side) {
  if (!auth.currentUser) {
    throw new Error("Please log in before voting.");
  }

  if (!matchupId || !["A", "B"].includes(side)) {
    throw new Error("Invalid matchup or voting side.");
  }

  const castVote = httpsCallable(functions, "castVote");

  const result = await castVote({
    matchupId,
    side
  });

  return result.data;
}

// Determine whether vote counts should be visible
export function canSeeCounts(hasVoted, isDecided) {
  return Boolean(hasVoted || isDecided);
}

// Calculate vote totals and percentages
export function getVoteCounts(matchup) {
  const votesA = matchup.votesA ?? 0;
  const votesB = matchup.votesB ?? 0;

  const total = votesA + votesB;

  return {
    votesA,
    votesB,
    total,
    percentA: total > 0
      ? Math.round((votesA / total) * 100)
      : 0,
    percentB: total > 0
      ? Math.round((votesB / total) * 100)
      : 0
  };
}

// Format vote counts for display
export function formatVotes(votesA, votesB) {
  const counts = getVoteCounts({ votesA, votesB });

  return {
    votesA: counts.votesA,
    votesB: counts.votesB,
    total: counts.total,
    percentA: `${counts.percentA}%`,
    percentB: `${counts.percentB}%`
  };
}


// Determine whether the current user can vote in a matchup
export function getVoteState({
  isLoggedIn = false,
  hasVoted = false,
  isDecided = false,
  isOpen = false,
  isCurrentRound = false,
  hasTimeRemaining = false,
  hasBothItems = false
} = {}) {
  let reason = null;

  if (!isLoggedIn) {
    reason = "Please log in to vote.";
  } else if (isDecided) {
    reason = "This matchup has already been decided.";
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
    hasVoted,
    canSeeCounts: canSeeCounts(hasVoted, isDecided),
    reason
  };
}


export function watchMyVotes(userId, callback) {
  if (!userId) {
    callback({});
    return () => {};
  }

  const votesQuery = query(
    collection(db, "votes"),
    where("userId", "==", userId)
  );

  return onSnapshot(votesQuery, (snapshot) => {
    const myVotes = {};

    snapshot.forEach((doc) => {
      const vote = doc.data();
      myVotes[vote.matchupId] = vote.side;
    });

    callback(myVotes);
  });
}
