const selectedIngredients = [];
const ingredientButtons = document.querySelectorAll(".ingredient-btn");
const ingredientInput = document.querySelector("#ingredient-input");
const recipeResults = document.querySelector("#recipe-results");
const form = document.querySelector("#ingredient-form");
const submitButton = document.querySelector("#submit-button"); // Assuming the submit button has this ID

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

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const typedInput = ingredientInput.value.trim();
  const allIngredients = [...selectedIngredients];
  if (typedInput) {
    allIngredients.push(typedInput);
  }

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

  const apiKey = "0bc42td8e0fe17b0ed58c2f95745oca3";
  const apiUrl = `https://api.shecodes.io/ai/v1/generate?prompt=${encodeURIComponent(
    prompt
  )}&context=${encodeURIComponent(context)}&key=${apiKey}`;

  recipeResults.innerHTML = "Loading recipe...";
  recipeResults.classList.remove("hidden"); // Show results
  submitButton.disabled = true;

  fetch(apiUrl)
    .then((res) => res.json())
    .then((data) => {
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

      recipeResults.innerHTML = "";
      recipeResults.classList.remove("hidden"); // Ensure visible
      new Typewriter(recipeResults, {
        strings: formatted,
        autoStart: true,
        delay: 15,
      });
      submitButton.disabled = false; // Re-enable button
    })
    .catch((error) => {
      recipeResults.innerHTML = "Sorry, something went wrong.";
      recipeResults.classList.remove("hidden"); // Show error
      console.error("Error fetching recipe:", error);
      submitButton.disabled = false;
    });
});
