const selectedIngredients = [];
const selectedDietaryRestrictions = [];
const ingredientButtons = document.querySelectorAll(".ingredient-btn");
const dietaryButtons = document.querySelectorAll(".dietary-btn");
const ingredientInput = document.querySelector("#ingredient-input");
const recipeResults = document.querySelector("#recipe-results");
const form = document.querySelector("#ingredient-form");
const submitButton = document.querySelector("#submit-button");

// 🥕 Handle ingredient button clicks (select/deselect)
ingredientButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const ingredient = button.textContent;
    const ingredientIndex = selectedIngredients.findIndex(
      (item) => item === ingredient
    );

    if (ingredientIndex !== -1) {
      selectedIngredients.splice(ingredientIndex, 1);
      button.classList.remove("selected");
      button.setAttribute("aria-pressed", "false");
    } else {
      selectedIngredients.push(ingredient);
      button.classList.add("selected");
      button.setAttribute("aria-pressed", "true");
    }

    updateSubmitButtonState();
  });
});

// 🍽️ Handle dietary restriction button clicks - NEW
dietaryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const restriction = button.dataset.restriction;
    const restrictionIndex = selectedDietaryRestrictions.findIndex(
      (item) => item === restriction
    );

    if (restrictionIndex !== -1) {
      selectedDietaryRestrictions.splice(restrictionIndex, 1);
      button.classList.remove("selected");
      button.setAttribute("aria-pressed", "false");
    } else {
      selectedDietaryRestrictions.push(restriction);
      button.classList.add("selected");
      button.setAttribute("aria-pressed", "true");
    }

    updateSelectedRestrictionsDisplay();
  });
});

// 🏷️ Update visual display of selected restrictions
function updateSelectedRestrictionsDisplay() {
  if (selectedDietaryRestrictions.length > 0) {
    console.log("Selected dietary restrictions:", selectedDietaryRestrictions);
  }
}

// 🎹 Add keyboard navigation support for all buttons
[...ingredientButtons, ...dietaryButtons].forEach((button) => {
  button.setAttribute("tabindex", "0");
  button.setAttribute("role", "button");
  button.setAttribute("aria-pressed", "false");

  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      button.click();
    }
  });
});

// 🔄 Update submit button state based on selected ingredients
function updateSubmitButtonState() {
  const hasIngredients =
    selectedIngredients.length > 0 || ingredientInput.value.trim();
  submitButton.disabled = !hasIngredients;
}

// 📝 Add input validation and real-time feedback
ingredientInput.addEventListener("input", () => {
  updateSubmitButtonState();
  ingredientInput.classList.remove("error");
});

// 🍽️ Generate dietary restrictions context for AI
function generateDietaryContext() {
  if (selectedDietaryRestrictions.length === 0) {
    return "";
  }

  const restrictionGuidelines = {
    vegetarian: "no meat, poultry, or fish",
    vegan: "no animal products including meat, dairy, eggs, or honey",
    "gluten-free": "no wheat, barley, rye, or gluten-containing ingredients",
    "dairy-free": "no milk, cheese, butter, cream, or dairy products",
    keto: "very low carbs (under 20g), high fat, moderate protein",
    paleo: "no grains, legumes, dairy, or processed foods",
    "low-carb": "minimal carbohydrates, focus on protein and healthy fats",
    "high-protein":
      "emphasize protein-rich ingredients and preparation methods",
  };

  const selectedGuidelines = selectedDietaryRestrictions
    .map((restriction) => restrictionGuidelines[restriction])
    .join(", ");

  return `\n\nIMPORTANT DIETARY REQUIREMENTS: This recipe must be ${selectedDietaryRestrictions.join(
    " and "
  )} (${selectedGuidelines}). Please ensure all ingredients and preparation methods comply with these restrictions.`;
}

// 📜 Handle form submission and recipe generation
form.addEventListener("submit", function (event) {
  event.preventDefault();

  // 📝 Gather all selected and typed ingredients with validation
  const typedInput = ingredientInput.value.trim();
  const allIngredients = [...selectedIngredients];

  // Input validation
  if (typedInput) {
    if (typedInput.length > 100) {
      showError("Please keep ingredient names under 100 characters.");
      return;
    }

    const typedIngredients = typedInput
      .split(",")
      .map((ingredient) => ingredient.trim())
      .filter((ingredient) => ingredient);
    allIngredients.push(...typedIngredients);
  }

  if (allIngredients.length === 0) {
    showError("Please select or type at least one ingredient.");
    return;
  }

  // 🧑‍🍳 Prepare prompt with dietary restrictions
  const dietaryContext = generateDietaryContext();
  const dietaryLabel =
    selectedDietaryRestrictions.length > 0
      ? ` (${selectedDietaryRestrictions.join(", ")})`
      : "";

  const prompt = `I have the following ingredients: ${allIngredients.join(
    ", "
  )}. What can I cook with them? Give me one complete${dietaryLabel} recipe with measurements.`;

  const context = `
    You are a helpful chef. When given ingredients, suggest one complete, simple recipe using only the listed items.
    Respond in the following format:

    Title: Recipe Name

    Ingredients:
    - ingredient 1 (amount)
    - ingredient 2 (amount)

    How to make it:
    Step-by-step instructions in short, clear sentences.

    Do not use any other ingredients. Do not include any HTML. Use plain text with clear line breaks.
    ${dietaryContext}
  `;

  // 🔑 API setup
  const apiKey = "0bc42td8e0fe17b0ed58c2f95745oca3";
  const apiUrl = `https://api.shecodes.io/ai/v1/generate?prompt=${encodeURIComponent(
    prompt
  )}&context=${encodeURIComponent(context)}&key=${apiKey}`;

  // ⏳ Show loading state
  showLoadingState();

  // 🌐 Fetch recipe from API
  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (!data || !data.answer) {
        throw new Error("Invalid response from recipe service");
      }

      const rawText = data.answer;
      const formatted = formatRecipeText(rawText);
      showRecipeResults(formatted);
    })
    .catch((error) => {
      console.error("Error fetching recipe:", error);

      let errorMessage = "Sorry, something went wrong. Please try again.";

      if (error.message.includes("HTTP error")) {
        errorMessage =
          "Unable to connect to the recipe service. Please check your internet connection and try again.";
      } else if (error.message.includes("Invalid response")) {
        errorMessage =
          "The recipe service returned an unexpected response. Please try again.";
      } else if (error.name === "TypeError") {
        errorMessage = "Network error. Please check your internet connection.";
      }

      showError(errorMessage);
    })
    .finally(() => {
      submitButton.disabled = false;
    });
});

// 🎨 Helper function to show loading state
function showLoadingState() {
  const dietaryText =
    selectedDietaryRestrictions.length > 0
      ? ` ${selectedDietaryRestrictions.join(" & ")}`
      : "";

  recipeResults.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Finding the perfect${dietaryText} recipe for you...</p>
    </div>
  `;
  recipeResults.classList.remove("hidden");
  submitButton.disabled = true;
}

// 🎨 Helper function to show error messages
function showError(message) {
  recipeResults.innerHTML = `
    <div class="error-container">
      <p class="error-message">${message}</p>
      <button type="button" class="retry-button" onclick="location.reload()">Try Again</button>
    </div>
  `;
  recipeResults.classList.remove("hidden");
  submitButton.disabled = false;
}

// 🎨 Helper function to format recipe text
function formatRecipeText(rawText) {
  // Add dietary restriction badge if any are selected
  const dietaryBadge =
    selectedDietaryRestrictions.length > 0
      ? `<div class="dietary-badge">${selectedDietaryRestrictions
          .map((restriction) => `<span class="badge">${restriction}</span>`)
          .join("")}</div>`
      : "";

  const formatted = rawText
    .replace(/^Title:\s*(.+)$/m, '<h2 class="recipe-title">$1</h2>')
    .replace(
      /(Ingredients:)/gi,
      '<strong class="recipe-section">$1</strong><br>'
    )
    .replace(
      /(How to make it:|Instructions:)/gi,
      '<br><strong class="recipe-section">$1</strong><br><br>'
    )
    .replace(/^- /gm, "• ")
    .replace(/\n/g, "<br>")
    .replace(/Ingredients:<br>((?:• .+<br>)+)/, function (match, items) {
      const listItems = items
        .split("<br>")
        .filter((line) => line.startsWith("• "))
        .map((line) => `<li>${line.replace("• ", "")}</li>`)
        .join("");
      return (
        '<strong class="recipe-section">Ingredients:</strong><ul>' +
        listItems +
        "</ul>"
      );
    });

  return dietaryBadge + formatted;
}

// 🎨 Helper function to show recipe results
function showRecipeResults(formattedText) {
  recipeResults.innerHTML = "";
  recipeResults.classList.remove("hidden");

  new Typewriter(recipeResults, {
    strings: formattedText,
    autoStart: true,
    delay: 15,
  });
}

// 🚀 Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  updateSubmitButtonState();

  // Add aria labels for better accessibility
  ingredientInput.setAttribute("aria-label", "Type additional ingredients");
  submitButton.setAttribute(
    "aria-label",
    "Search for recipes with selected ingredients"
  );

  // Add focus management
  ingredientInput.addEventListener("focus", () => {
    ingredientInput.classList.add("focused");
  });

  ingredientInput.addEventListener("blur", () => {
    ingredientInput.classList.remove("focused");
  });
});

// I am still learning and I feel I need to put a comment in every line of code to understand it better.
// I hope excessive comments are not a problem. ✨
