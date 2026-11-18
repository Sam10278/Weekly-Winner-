// Helpers for the weekly auto-start. 

const { FieldValue, Timestamp } = require("firebase-admin/firestore");

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
// Pick a category and a size.
//  1. keep categories that are not closed and have at least 8 items
//  2. count the votes of each one (from categoryVotes)
//  3. keep the ones with the most votes, then pick one at random
//  4. choose a size it can fill: 8, or 16 if it has 16+ items (random between the two)
// Returns { size, category, items } or null if nothing fits.
async function pickCategory(db) {
  const categorySnap = await db.collection("categories").get();

  // 1. open categories with at least 8 items
  const candidates = [];

  for (const doc of categorySnap.docs) {
    if (doc.data().closed === true) {
      continue;
    }

    const itemSnap = await db.collection("items").where("categoryId", "==", doc.id).get();

    if (itemSnap.size >= 8) {
      candidates.push({ doc: doc, itemDocs: itemSnap.docs });
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  // 2. count votes for each category
  const voteSnap = await db.collection("categoryVotes").get();
  const voteCounts = {};

  for (const voteDoc of voteSnap.docs) {
    const id = voteDoc.data().categoryId;

    if (!voteCounts[id]) {
      voteCounts[id] = 0;
    }
    voteCounts[id] = voteCounts[id] + 1;
  }

  // 3. find the highest vote count among the candidates
  let highest = 0;

  for (const candidate of candidates) {
    let votes = 0;
    if (voteCounts[candidate.doc.id]) {
      votes = voteCounts[candidate.doc.id];
    }
    candidate.votes = votes;

    if (votes > highest) {
      highest = votes;
    }
  }

  // keep only the ones with that count (a tie keeps several)
  const top = [];

  for (const candidate of candidates) {
    if (candidate.votes === highest) {
      top.push(candidate);
    }
  }

  // random pick among the top ones
  const chosen = shuffle(top)[0];

  // 4. choose a size this category can fill
  let size = 8;

  if (chosen.itemDocs.length >= 16) {
    const sizes = shuffle([8, 16]);
    size = sizes[0];
  }

  const items = [];

  for (const itemDoc of chosen.itemDocs) {
    const data = itemDoc.data();

    let name = "";
    if (data.name) {
      name = data.name;
    }

    let imageUrl = "";
    if (data.imageUrl) {
      imageUrl = data.imageUrl;
    }

    items.push({ id: itemDoc.id, name: name, imageUrl: imageUrl });
  }

  let categoryName = "";
  if (chosen.doc.data().name) {
    categoryName = chosen.doc.data().name;
  }

  return {
    size: size,
    category: { id: chosen.doc.id, name: categoryName },
    items: shuffle(items).slice(0, size)
  };
}


// Save one challenge, all its matchups, and mark the category as used.
// Everything goes in ONE batch: all of it is saved, or none of it.
//   db:          the Firestore database (we pass it in)
//   picked:      { size, category: { id, name }, items } from pickCategory
//   challengeId: the id for this challenge, (the id for it is the date created like "2026-11-02")
async function saveChallenge(db, picked, challengeId) {
  const size = picked.size;

  const challengeRef = db.collection("challenges").doc(challengeId);
  const categoryRef = db.collection("categories").doc(picked.category.id);

  // 24 hours from now, by the server clock
  const roundEndsAt = Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000);

  const batch = db.batch();
  // batch represents The challenge started as a whole
  batch.create(challengeRef, {
    categoryId: picked.category.id,
    categoryName: picked.category.name,
    bracketSize: size,
    status: "open",
    currentRound: 1,
    roundEndsAt: roundEndsAt,
    createdBy: "system",
    createdAt: FieldValue.serverTimestamp()
  });

  const matchups = buildMatchups(challengeId, size, picked.items);

  for (const matchup of matchups) {
    const matchupRef = db.collection("matchups").doc();
    // batch.create(...) fails if the document already exists. 
    // The challenge id is the date. If the function runs twice on the same day, 
    // the second run fails, and nothing is saved.
    // It stops a double run from making two challenges.
    batch.create(matchupRef, matchup);
  }

  batch.update(categoryRef, {
    closed: true,
    usedInChallengeId: challengeId
  });
  // db.batch() collects writes, and batch.commit() sends them together.
  await batch.commit();
}

// Delete every document in categoryVotes, in batches of up to 500.
async function clearCategoryVotes(db) {
  let deleted = 0;

  while (true) {
    const snap = await db.collection("categoryVotes").limit(500).get();

    if (snap.empty) {
      break;
    }

    const batch = db.batch();

    for (const doc of snap.docs) {
      batch.delete(doc.ref);
    }

    await batch.commit();
    deleted = deleted + snap.size;
  }

  return deleted;
}

module.exports = { shuffle, chicagoDate, buildMatchups, pickCategory, saveChallenge, clearCategoryVotes };