
import { auth, db } from "./app.js";

import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

// ========================================
// HTML ELEMENTS
// ========================================

const categoryList = document.getElementById("category-list");
const categorySearch = document.getElementById("category-search");

const categoryView = document.getElementById("category-view");
const newCategoryView = document.getElementById("new-category-view");

const newCategoryBtn = document.getElementById("new-category-btn");
const cancelCategoryBtn = document.getElementById("cancel-category-btn");

const categoryForm = document.getElementById("category-form");
const categoryName = document.getElementById("category-name");
const categoryDescription = document.getElementById("category-description");
const categoryMessage = document.getElementById("category-message");

const selectedCategoryName =
  document.getElementById("selected-category-name");

const selectedCategoryDescription =
  document.getElementById("selected-category-description");

const selectedCategoryCount =
  document.getElementById("selected-category-count");

const itemForm = document.getElementById("add-item-form");
const itemName = document.getElementById("item-name");
const itemImage = document.getElementById("item-image");
const itemMessage = document.getElementById("form-message");

const itemsList = document.getElementById("items-list");
const itemsTotal = document.getElementById("items-total");

// ========================================
// APPLICATION STATE
// ========================================

let currentUser = null;
let authReady = false;

let selectedCategoryId = null;

let categories = [];
let items = [];

// ========================================
// AUTHENTICATION
// ========================================

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  authReady = true;
});

// ========================================
// HELPER FUNCTIONS
// ========================================

// Display success or error messages
function showMessage(element, text, isError = false) {
  element.textContent = text;
  element.style.color = isError ? "red" : "green";
}

// Format singular/plural item counts
function formatItemCount(count) {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

// Normalize category names for duplicate checking
function normalizeCategoryName(name) {
  return (name || "").trim().replace(/\s+/g, " ").toLowerCase();
}

// Show selected category
function showCategoryView() {
  categoryView.hidden = false;
  newCategoryView.hidden = true;
}

// Show new category form
function showNewCategoryView() {
  categoryView.hidden = true;
  newCategoryView.hidden = false;
  categoryMessage.textContent = "";
}

// Get items belonging to a category
function getCategoryItems(categoryId) {
  return items.filter(
    (item) => item.categoryId === categoryId
  );
}

// ========================================
// CATEGORY SEARCH
// ========================================

// Filter sidebar categories as the user types
if (categorySearch) {
  categorySearch.addEventListener("input", () => {
    renderCategories();
  });
}

// ========================================
// RENDER SIDEBAR CATEGORIES
// ========================================

function renderCategories() {
  categoryList.innerHTML = "";

  const searchText = categorySearch
    ? normalizeCategoryName(categorySearch.value)
    : "";

  if (categories.length === 0) {
    categoryList.textContent = "No categories yet.";
    return;
  }

  // Filter categories by name
  const filteredCategories = categories.filter((category) =>
    normalizeCategoryName(category.name).includes(searchText)
  );

  if (filteredCategories.length === 0) {
    categoryList.textContent = "No matching categories found.";
    return;
  }

  filteredCategories.forEach((category) => {
    const categoryItems = getCategoryItems(category.id);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-card";

    if (category.id === selectedCategoryId) {
      button.classList.add("active");
    }

    const name = document.createElement("strong");
    name.className = "category-name";
    name.textContent = category.name;

    const count = document.createElement("small");
    count.textContent = formatItemCount(categoryItems.length);

    button.append(name, count);

    button.addEventListener("click", () => {
      selectCategory(category.id);
    });

    categoryList.appendChild(button);
  });
}

// ========================================
// RENDER ITEMS
// ========================================

function renderItems() {
  itemsList.innerHTML = "";

  const categoryItems = getCategoryItems(selectedCategoryId);

  selectedCategoryCount.textContent = formatItemCount(categoryItems.length);
  itemsTotal.textContent = `${categoryItems.length} total`;

  if (categoryItems.length === 0) {
    itemsList.textContent = "No items in this category yet.";
    return;
  }

  categoryItems.forEach((item) => {
    const row = document.createElement("div");
    row.className = "item-card";

    const content = document.createElement("div");
    content.className = "item-card-content";

    // Display item image if provided
    if (item.imageUrl) {
      const image = document.createElement("img");

      image.className = "item-thumbnail";
      image.src = item.imageUrl;
      image.alt = item.name;
      image.referrerPolicy = "no-referrer";

      content.appendChild(image);
    }

    const name = document.createElement("span");
    name.textContent = item.name;
    content.appendChild(name);

    row.append(content);
    itemsList.appendChild(row);
  });
}

// ========================================
// SELECT CATEGORY
// ========================================

function selectCategory(categoryId) {
  const category = categories.find(
    (c) => c.id === categoryId
  );

  if (!category) return;

  selectedCategoryId = categoryId;

  selectedCategoryName.textContent = category.name;

  selectedCategoryDescription.textContent =
    category.description || "";

  itemMessage.textContent = "";

  showCategoryView();

  renderCategories();
  renderItems();
}

// ========================================
// LOAD DATA FROM FIRESTORE
// ========================================

async function loadData() {
  try {
    const [categorySnapshot, itemSnapshot] = await Promise.all([
      getDocs(collection(db, "categories")),
      getDocs(collection(db, "items"))
    ]);

    categories = categorySnapshot.docs.map((snapshot) => ({
      id: snapshot.id,
      ...snapshot.data()
    }));

    items = itemSnapshot.docs.map((snapshot) => ({
      id: snapshot.id,
      ...snapshot.data()
    }));

    // Sort categories alphabetically
    categories.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    renderCategories();

    if (categories.length > 0) {
      const stillExists = categories.some(
        (category) => category.id === selectedCategoryId
      );

      selectCategory(
        stillExists ? selectedCategoryId : categories[0].id
      );
    } else {
      selectedCategoryId = null;

      selectedCategoryName.textContent =
        "No categories yet";

      selectedCategoryDescription.textContent =
        "Create a category to get started.";

      selectedCategoryCount.textContent = "0 items";
      itemsTotal.textContent = "0 total";

      itemsList.textContent = "No items available.";
    }
  } catch (error) {
    console.error("Failed to load Firestore data:", error);

    categoryList.textContent = "Unable to load categories.";

    showMessage(
      itemMessage,
      "Unable to load data. Please refresh the page.",
      true
    );
  }
}

// ========================================
// CREATE CATEGORY VIEW
// ========================================

newCategoryBtn.addEventListener("click", () => {
  showNewCategoryView();
});

cancelCategoryBtn.addEventListener("click", () => {
  categoryForm.reset();
  showCategoryView();
});

// ========================================
// CREATE CATEGORY
// ========================================

// ========================================
// CREATE CATEGORY
// ========================================

categoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = categoryName.value.trim();
  const description = categoryDescription.value.trim();

  if (!name) {
    showMessage(categoryMessage, "Enter a category name.", true);
    return;
  }

  if (name.length > 50) {
    showMessage(categoryMessage, "The name can have at most 50 characters.", true);
    return;
  }

  if (description.length > 200) {
    showMessage(categoryMessage, "The description can have at most 200 characters.", true);
    return;
  }

  if (!authReady) {
    showMessage(categoryMessage, "Checking login status. Please try again.", true);
    return;
  }

  if (!currentUser) {
    showMessage(categoryMessage, "Please log in first.", true);
    return;
  }

  const submitBtn = categoryForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    // Refresh categories before checking duplicates
    const snapshot = await getDocs(collection(db, "categories"));

    const latestCategories = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data()
    }));

    const normalizedName = normalizeCategoryName(name);

    // Check for existing category name
    const duplicate = latestCategories.find(
      (category) => normalizeCategoryName(category.name) === normalizedName
    );

    if (duplicate) {
      showMessage(
        categoryMessage,
        `The category "${duplicate.name}" already exists. Please choose another name.`,
        true
      );
      return;
    }

    // Save category to Firestore
    const result = await addDoc(collection(db, "categories"), {
      name,
      description,
      createdBy: currentUser.uid,
      createdAt: serverTimestamp()
    });

    categoryForm.reset();

    // Clear search so the new category is visible
    if (categorySearch) {
      categorySearch.value = "";
    }

    // Update the page from memory, no need to read everything again
    categories.push({
      id: result.id,
      name,
      description,
      createdBy: currentUser.uid
    });
    categories.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    selectCategory(result.id);

    showMessage(itemMessage, "Category created successfully!");
  } catch (error) {
    console.error(error);
    showMessage(categoryMessage, "Failed to create category. Please try again.", true);
  } finally {
    submitBtn.disabled = false;
  }
});

// ========================================
// ADD ITEM
// ========================================

itemForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = itemName.value.trim();
  const imageUrl = itemImage.value.trim();

  if (!selectedCategoryId) {
    showMessage(itemMessage, "Select a category first.", true);
    return;
  }

  if (!name) {
    showMessage(itemMessage, "Enter an item name.", true);
    return;
  }

  if (name.length > 60) {
    showMessage(itemMessage, "The name can have at most 60 characters.", true);
    return;
  }

  if (imageUrl && !imageUrl.startsWith("https://")) {
    showMessage(itemMessage, "The image link must start with https://", true);
    return;
  }

  if (imageUrl.length > 500) {
    showMessage(itemMessage, "The image link is too long.", true);
    return;
  }

  if (!authReady) {
    showMessage(itemMessage, "Checking login status. Please try again.", true);
    return;
  }

  if (!currentUser) {
    showMessage(itemMessage, "Please log in first.", true);
    return;
  }

  const submitBtn = itemForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const newItem = {
      name,
      categoryId: selectedCategoryId,
      addedBy: currentUser.uid,
      createdAt: serverTimestamp()
    };

    // never save an empty imageUrl
    if (imageUrl) newItem.imageUrl = imageUrl;

    const ref = await addDoc(collection(db, "items"), newItem);

    // Update the page from memory, no need to read everything again
    items.push({
      id: ref.id,
      name,
      categoryId: selectedCategoryId,
      addedBy: currentUser.uid,
      imageUrl
    });

    itemForm.reset();
    renderCategories();
    renderItems();

    showMessage(itemMessage, "Item added successfully!");
  } catch (error) {
    console.error(error);
    showMessage(itemMessage, "Failed to add item. Please try again.", true);
  } finally {
    submitBtn.disabled = false;
  }
});

// ========================================
// INITIAL LOAD
// ========================================

loadData();
