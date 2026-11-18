// categoryVote.js - vote for a category, or take the vote back.
// This file never calls initializeApp(). index.js does it one time.

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

exports.toggleCategoryVote = onCall(async (request) => {
  // 1. The user must be logged in
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Please log in before voting.");
  }

  const uid = request.auth.uid;

  let data = request.data;
  if (!data) {
    data = {};
  }

  const categoryId = data.categoryId;

  // 2. Check the input
  if (typeof categoryId !== "string" || categoryId.trim() === "") {
    throw new HttpsError("invalid-argument", "A category id is required.");
  }

  if (categoryId.includes("/") || categoryId.length > 100) {
    throw new HttpsError("invalid-argument", "Invalid category id.");
  }

  const db = getFirestore();
  const categoryRef = db.collection("categories").doc(categoryId);
  const voteRef = db.collection("categoryVotes").doc(categoryId + "_" + uid);

  // Count the items outside the transaction (a count is enough)
  const countSnap = await db
    .collection("items")
    .where("categoryId", "==", categoryId)
    .count()
    .get();
  const itemCount = countSnap.data().count;

  return db.runTransaction(async (transaction) => {
    // ---------- READS ----------
    const categorySnap = await transaction.get(categoryRef);
    const voteSnap = await transaction.get(voteRef);

    if (!categorySnap.exists) {
      throw new HttpsError("not-found", "Category not found.");
    }

    const category = categorySnap.data();

    // ---------- CHECKS ----------
    if (category.closed === true) {
      throw new HttpsError("failed-precondition", "This category is closed.");
    }

    // taking a vote back is always allowed, adding needs 8 or more items
    if (!voteSnap.exists && itemCount < 8) {
      throw new HttpsError("failed-precondition", "This category needs at least 8 items.");
    }

    // ---------- WRITES ----------
    if (voteSnap.exists) {
      transaction.delete(voteRef);
      return { voted: false };
    }

    transaction.create(voteRef, {
      categoryId: categoryId,
      userId: uid,
      createdAt: FieldValue.serverTimestamp()
    });

    return { voted: true };
  });
});