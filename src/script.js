const selectedIngredients = [];
const ingredientButtons = document.querySelectorAll(".ingredient-btn");
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
      // Remove ingredient using filter for better performance
      selectedIngredients.splice(ingredientIndex, 1);
      button.classList.remove("selected");
      button.setAttribute("aria-pressed", "false");
    } else {
      selectedIngredients.push(ingredient);
      button.classList.add("selected");
      button.setAttribute("aria-pressed", "true");
    }

    // Update submit button state
    updateSubmitButtonState();
  });
});

// 🎹 Add keyboard navigation support for ingredient buttons
ingredientButtons.forEach((button) => {
  // Make buttons focusable and add keyboard support
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

  // Clear any previous error states
  ingredientInput.classList.remove("error");
});

// 📜 Handle form submission and recipe generation
form.addEventListener("submit", function (event) {
  event.preventDefault();

  // 📝 Gather all selected and typed ingredients with validation
  const typedInput = ingredientInput.value.trim();
  const allIngredients = [...selectedIngredients];

  // Input validation
  if (typedInput) {
    // Basic validation: no empty strings, reasonable length
    if (typedInput.length > 100) {
      showError("Please keep ingredient names under 100 characters.");
      return;
    }

    // Split by commas and clean up
    const typedIngredients = typedInput
      .split(",")
      .map((ingredient) => ingredient.trim())
      .filter((ingredient) => ingredient);
    allIngredients.push(...typedIngredients);
  }

  // Check if we have any ingredients at all
  if (allIngredients.length === 0) {
    showError("Please select or type at least one ingredient.");
    return;
  }

  // 🧑‍🍳 Prepare prompt and context for the API
  const prompt = `I have the following ingredients: ${allIngredients.join(
    ", "
  )}. What can I cook with them? Give me one complete recipe with measurements.`;

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
  `;

  // 🔑 API setup
  const apiKey = "0bc42td8e0fe17b0ed58c2f95745oca3";
  const apiUrl = `https://api.shecodes.io/ai/v1/generate?prompt=${encodeURIComponent(
    prompt
  )}&context=${encodeURIComponent(context)}&key=${apiKey}`;

  // ⏳ Show loading state with better UX
  showLoadingState();

  // 🌐 Fetch recipe from API with improved error handling
  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // Check if API returned valid data
      if (!data || !data.answer) {
        throw new Error("Invalid response from recipe service");
      }

      // 📦 Format the API response for display
      const rawText = data.answer;
      const formatted = formatRecipeText(rawText);

      // 🖊️ Animate the recipe output with Typewriter effect
      showRecipeResults(formatted);
    })
    // ⚠️ Handle different types of errors with specific messages
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
      // Always re-enable the button
      submitButton.disabled = false;
    });
});

// 🎨 Helper function to show loading state
function showLoadingState() {
  recipeResults.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Finding the perfect recipe for you...</p>
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
  return (
    rawText
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
      // 🍽️ Convert ingredients to a list
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
      })
  );
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
  // Set initial button state
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
