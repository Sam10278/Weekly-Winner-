// Helpers for the rounds function. 
const { FieldValue, Timestamp } = require("firebase-admin/firestore");

// Decide which side wins a matchup. Returns "A" or "B".
//   1. more votes wins
//   2. tied with votes: the side that reached the count first wins (earlier lastVoteAt)
//   3. 0 to 0: random
function decideWinner(matchup) {
  // safety net: if one slot is empty, the other side wins
  //if slot A is empty and slot B has an item, B wins
  if (!matchup.itemA && matchup.itemB) {
    return "B";
  }
  //if slot B is empty and slot A has an item, A wins
  if (matchup.itemA && !matchup.itemB) {
    return "A";
  }

  let VotesA = 0;
  if (matchup.votesA) {
    VotesA = matchup.votesA;
  }

  let VotesB = 0;
  if (matchup.votesB) {
    VotesB = matchup.votesB;
  }

  if (VotesA > VotesB) {
    return "A";
  }
  if (VotesB > VotesA) {
    return "B";
  }

  // from here, the votes are tied
  // tied with both 0 0 
  if (VotesA === 0) {
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

  // The first one’s winner goes into itemA. The second one’s winner goes into itemB.
  // Which one is “first” depends on its position number: even is first, odd is second.
  let slotField = "itemB";
  // even > go to the first position itemA in the next round
  if (matchup.position % 2 === 0) {
    slotField = "itemA";
  }

  return { round: nextRound, position: nextPosition, slotField: slotField };
}

// Close the active round of ONE challenge, if its time is over.
// One transaction: all reads first, then all writes.
// If anything fails, nothing is saved.
// If it runs twice, the second run does nothing, because currentRound moved
// forward and the new round is not over yet.
async function closeRound(db, challengeId) {
  const challengeRef = db.collection("challenges").doc(challengeId);

  await db.runTransaction(async (transaction) => {
    // READS from database
    
    // get the challenge fron database
    const challengeSnap = await transaction.get(challengeRef);
    // if it does not exists stop
    if (!challengeSnap.exists) {
      return;
    }

    const challenge = challengeSnap.data();
    // if it is not an actove challange then stop 
    if (challenge.status !== "open") {
      return;
    }

    // old challenges (made by the Start Challenge page) have no currentRound
    // so it is undefined.
    if (typeof challenge.currentRound !== "number") {
      return;
    }

    if (typeof challenge.bracketSize !== "number") {
      return;
    }

    if (!challenge.roundEndsAt) {
      return;
    }

    // the round is not over yet
    if (challenge.roundEndsAt.toMillis() > Date.now()) {
      return;
    }

    const round = challenge.currentRound;
    const totalRounds = Math.log2(challenge.bracketSize);
    // if the current round is the final round set isFinal to true
    const isFinal = (round === totalRounds);

    // Read all matchups of the current round for this challenge.
    // Read inside the transaction. If another run changes this data before we
    // write, Firestore retries with the new data, so we never use old data.
    const roundSnap = await transaction.get(
      db.collection("matchups")
        .where("challengeId", "==", challengeId)
        .where("round", "==", round)
    );

    if (roundSnap.empty) {
      throw new Error("No matchups found for round " + round + " of " + challengeId);
    }

    let nextSnap = null;
    // if this round is not the final round
    // Read the next round's matchups now. Winners will be copied into them later.
    // “Read” means “get the data out of the database so the code can look at it.”
    // All reads must happen before any write inside a transaction.
    if (!isFinal) {
      nextSnap = await transaction.get(
        db.collection("matchups")
          .where("challengeId", "==", challengeId)
          .where("round", "==", round + 1)
      );
    }

   
    // storing the result of the matchup winner
    const results = [];

    for (const doc of roundSnap.docs) {
      const matchup = doc.data();

      let winnerItem = null;
      let alreadyDecided = false;

      // a winner was already set
      if (matchup.winnerId) {
        if (matchup.itemA && matchup.itemA.id === matchup.winnerId) {
          winnerItem = matchup.itemA;
          alreadyDecided = true;
        } else if (matchup.itemB && matchup.itemB.id === matchup.winnerId) {
          winnerItem = matchup.itemB;
          alreadyDecided = true;
        }
      }

      // no usable winner yet: decide now
      if (winnerItem === null) {
        const side = decideWinner(matchup);

        if (side === "A") {
          winnerItem = matchup.itemA;
        } else {
          winnerItem = matchup.itemB;
        }
      }

      if (!winnerItem) {
        throw new Error("Matchup " + doc.id + " has no items");
      }

      results.push({
        ref: doc.ref,
        matchup: matchup,
        winnerItem: winnerItem,
        alreadyDecided: alreadyDecided
      });
    }

    // WRITES 
    // set winnerId on every matchup that does not have one
    for (const entry of results) {
      // Skip matchups that already had a winner. They are already correct.
      if (entry.alreadyDecided === false) {
        // winnerId is the id of the item that won
        transaction.update(entry.ref, { winnerId: entry.winnerItem.id });
      }
    }

    // the final: finish the challenge
    if (isFinal) {
      // The final has only one matchup, so its winner is the first result.
      const finalWinner = results[0].winnerItem;

      transaction.update(challengeRef, {
        status: "finished",
        winner: finalWinner,
        finishedAt: FieldValue.serverTimestamp()
      });
      // Stop here. There is no next round to fill.
      return;
    }

    // not the final, so move each winner into the next round.
    for (const entry of results) {
      // Where does this winner go? (next round, which position, itemA or itemB)
      const slot = nextSlot(entry.matchup);

      // Find the next-round matchup that has that position.
      let nextRef = null;

      for (const nextDoc of nextSnap.docs) {
        const nextData = nextDoc.data();

      if (nextData.position === slot.position) {
        nextRef = nextDoc.ref;
      }

      // Safety check: the matchup must exist. If not, stop and save nothing.
      if (nextRef === null) {
        throw new Error("Next-round matchup not found for position " + slot.position);
      }
      if (slot.slotField === "itemA") {
        transaction.update(nextRef, { itemA: entry.winnerItem });
      } else {
        transaction.update(nextRef, { itemB: entry.winnerItem });
      }
      }
    }

    // move the challenge to the next round and set its new end time.
    const oneDay = 24 * 60 * 60 * 1000;
    const oldEndTime = challenge.roundEndsAt.toMillis();
    // old end time + 24 hours
    const newEndTime = oldEndTime + oneDay;        

    transaction.update(challengeRef, {
      currentRound: round + 1,
      roundEndsAt: Timestamp.fromMillis(newEndTime)
    });
});
}


module.exports = { decideWinner, nextSlot, closeRound };