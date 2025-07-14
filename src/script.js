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
    if (selectedIngredients.includes(ingredient)) {
      selectedIngredients.splice(selectedIngredients.indexOf(ingredient), 1);
      button.classList.remove("selected");
    } else {
      selectedIngredients.push(ingredient);
      button.classList.add("selected");
    }
  });
});

// 📜 Handle form submission and recipe generation
form.addEventListener("submit", function (event) {
  event.preventDefault();

  // 📝 Gather all selected and typed ingredients
  const typedInput = ingredientInput.value.trim();
  const allIngredients = [...selectedIngredients];
  if (typedInput) {
    allIngredients.push(typedInput);
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

  // ⏳ Show loading state
  recipeResults.innerHTML = "Loading recipe...";
  recipeResults.classList.remove("hidden");
  submitButton.disabled = true;

  // 🌐 Fetch recipe from API
  fetch(apiUrl)
    .then((res) => res.json())
    .then((data) => {
      // 📦 Format the API response for display
      const rawText = data.answer;
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
        });

      // 🖊️ Animate the recipe output with Typewriter effect
      recipeResults.innerHTML = "";
      recipeResults.classList.remove("hidden");
      new Typewriter(recipeResults, {
        strings: formatted,
        autoStart: true,
        delay: 15,
      });
      submitButton.disabled = false; // Re-enable button
    })
    // ⚠️ Handle errors
    .catch((error) => {
      recipeResults.innerHTML = "Sorry, something went wrong.";
      recipeResults.classList.remove("hidden");
      console.error("Error fetching recipe:", error);
      submitButton.disabled = false;
    });
});

// I am still learning and I feel I need to put a comment in every line of code to understand it better.
// I hope excessive comments are not a problem. ✨
