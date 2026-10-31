// Helpers for the rounds function. Pure functions: no Firebase in here yet.

// Decide which side wins a matchup. Returns "A" or "B".
//   1. more votes wins
//   2. tied with votes: the side that reached the count first wins (earlier lastVoteAt)
//   3. 0 to 0: random
function decideWinner(matchup) {
  // safety net: if one slot is empty, the other side wins
  if (!matchup.itemA && matchup.itemB) {
    return "B";
  }
  if (matchup.itemA && !matchup.itemB) {
    return "A";
  }

  let votesA = 0;
  if (matchup.votesA) {
    votesA = matchup.votesA;
  }

  let votesB = 0;
  if (matchup.votesB) {
    votesB = matchup.votesB;
  }

  if (votesA > votesB) {
    return "A";
  }
  if (votesB > votesA) {
    return "B";
  }

  // from here, the votes are tied
  if (votesA === 0) {
    // 0 to 0: nobody voted, so pick at random
    if (Math.random() < 0.5) {
      return "A";
    }
    return "B";
  }

  // tied with votes: the earlier last vote reached the count first
  const timeA = matchup.lastVoteAtA;
  const timeB = matchup.lastVoteAtB;

  if (timeA && timeB) {
    if (timeA.toMillis() < timeB.toMillis()) {
      return "A";
    }
    if (timeB.toMillis() < timeA.toMillis()) {
      return "B";
    }
  }

  // same time or a missing time (rare): pick at random
  if (Math.random() < 0.5) {
    return "A";
  }
  return "B";
}

// Where does the winner of this matchup go?
// round r, position p -> round r + 1, position floor(p / 2)
// slot A if p is even, slot B if p is odd
function nextSlot(matchup) {
  const nextRound = matchup.round + 1;
  const nextPosition = Math.floor(matchup.position / 2);

  let slotField = "itemB";
  if (matchup.position % 2 === 0) {
    slotField = "itemA";
  }

  return { round: nextRound, position: nextPosition, slotField: slotField };
}

module.exports = { decideWinner, nextSlot };