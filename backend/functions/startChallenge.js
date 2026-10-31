// Helpers for the weekly auto-start.  no Firebase in here.

// Mix a list in a fair way (Fisher-Yates). Returns a new list.
function shuffle(list) {
  // ...  Spread operator. Takes all elements from list and puts them into the new array
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // shuffle teo items in the list ayt random
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Date of the challenge when it starts, like "2026-11-02". It will be the challenge id.
function chicagoDate(now = new Date()) {
    // en CA it is used becuase en US prints dates with / which is not allowed on firestore
  return now.toLocaleDateString("en-CA", {
    timeZone: "America/Chicago",
    // show data year and month all in numbers
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

// Make every matchup of one challenge as plain objects.
// items: the picked items, already shuffled: [{ id, name, imageUrl }, ...]
function buildMatchups(challengeId, size, items) {
  const matchups = [];
  // ex: 16 tems will give us 4 rounds (2^4=16)
  const totalRounds = Math.log2(size);

  // round loop
  for (let round = 1; round <= totalRounds; round++) {
    const matchCount = size / 2 ** round;
    // match up loop
    for (let position = 0; position < matchCount; position++) {
      let itemA = null;
      let itemB = null;

      // only round 1 has items; later rounds wait for winners
      if (round === 1) {
        itemA = items[position * 2];
        itemB = items[position * 2 + 1];
      }
      // add the match up to list of mathcups 
      matchups.push({
        challengeId: challengeId,
        round: round,
        position: position,
        itemA: itemA,
        itemB: itemB,
        votesA: 0,
        votesB: 0,
        lastVoteAtA: null,
        lastVoteAtB: null,
        winnerId: null
      });
    }
  }

  return matchups;
}

module.exports = { shuffle, chicagoDate, buildMatchups };