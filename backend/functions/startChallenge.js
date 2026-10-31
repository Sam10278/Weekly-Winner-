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
// Pick a size and a category.
//  - try a random size first (8 or 16)
//  - a category is "unused" if closed is not true
//  - it needs at least `size` items to start a challenge for it
//  - if no category fits(does not have enough items for the size picked), try the other size
// Returns { size, category, items } or null if nothing fits.
async function pickCategory(db) {
  const sizes = shuffle([8, 16]);

  // get the current state of categories and their otems
  const categorySnap = await db.collection("categories").get();
  // find the categories that are not closed/used before
  const unused = categorySnap.docs.filter((doc) => doc.data().closed !== true);
  // if all categories have been siued before return null 
  if (unused.length === 0) {
    return null;
  }

  // Read each unused category's items one time.
  const itemsByCategory = new Map();
  for (const doc of unused) {
    const itemSnap = await db.collection("items").where("categoryId", "==", doc.id).get();
    itemsByCategory.set(doc.id, itemSnap.docs);
  }

  for (const size of sizes) {
    const fits = [];

    for (const doc of unused) {
        // get number of items in this unsed catgory
      const itemCount = itemsByCategory.get(doc.id).length;
      // check if ot has enough items for the challenge sized picked
      if (itemCount >= size) {
        fits.push(doc);
      }
    }

    if (fits.length > 0) {
        // pick category at random
        const shuffledFits = shuffle(fits);
        const chosen = shuffledFits[0];
        // get its items
        const chosenItems = [];
        const itemDocs = itemsByCategory.get(chosen.id);
        // get each items info like name imageurl 
        for (const itemDoc of itemDocs) {
          const data = itemDoc.data();
        
          let name = "";
          if (data.name) {
            name = data.name;
          }
      
          let imageUrl = "";
          if (data.imageUrl) {
            imageUrl = data.imageUrl;
          }
      
          chosenItems.push({
            id: itemDoc.id,
            name: name,
            imageUrl: imageUrl
        });
        }

      let categoryName = "";
      if (chosen.data().name) {
        categoryName = chosen.data().name;
      }
      // now shuffl items 
      const shuffledItems = shuffle(chosenItems);
      // then pick the first size (8 or 16) for the challenge
      const pickedItems = shuffledItems.slice(0, size);
      
      return {
        size: size,
        category: { id: chosen.id, name: categoryName },
        items: pickedItems
      };
    }
  }

  return null;
}
module.exports = { shuffle, chicagoDate, buildMatchups, pickCategory };