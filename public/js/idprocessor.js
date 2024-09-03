document.addEventListener("DOMContentLoaded", function () {
  const inputTextArea = document.getElementById("inputText");
  const outputTextArea = document.getElementById("output");
  const themeToggle = document.getElementById("themeToggle");
  const summaryContainer = document.getElementById("summaryContainer");
  const typeMappingsPrefixInput = document.getElementById("typeMappingsPrefix");

  if (
    !inputTextArea ||
    !outputTextArea ||
    !themeToggle ||
    !summaryContainer ||
    !typeMappingsPrefixInput
  ) {
    console.error("Required elements not found");
    return;
  }

  const inputEditor = CodeMirror.fromTextArea(inputTextArea, {
    lineNumbers: true,
    mode: "javascript",
    theme: "default",
  });

  const outputEditor = CodeMirror.fromTextArea(outputTextArea, {
    lineNumbers: true,
    mode: "javascript",
    theme: "default",
    readOnly: true,
  });

  themeToggle.addEventListener("click", function () {
    const body = document.body;
    const currentTheme = body.classList.contains("light-theme")
      ? "light-theme"
      : "dark-theme";
    const newTheme =
      currentTheme === "light-theme" ? "dark-theme" : "light-theme";

    body.classList.remove(currentTheme);
    body.classList.add(newTheme);

    const editorTheme = newTheme === "dark-theme" ? "dracula" : "default";
    inputEditor.setOption("theme", editorTheme);
    outputEditor.setOption("theme", editorTheme);
  });

  document
    .getElementById("processButton")
    .addEventListener("click", async function () {
      const inputText = inputEditor.getValue();
      const typeMappingsPrefix = typeMappingsPrefixInput.value.trim();
      const loadingIndicator = document.getElementById("loading");

      loadingIndicator.style.display = "block";
      outputEditor.setValue("");
      summaryContainer.textContent = "";

      try {
        const response = await fetch("/api/process-ids", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputText, typeMappingsPrefix }),
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const result = await response.json();
        const expValues = result.rows.map((row) => row.exp).join("\n");
        outputEditor.setValue(expValues);

        if (result.summary) {
          const { totalLines, changesMade, unchangedLines } = result.summary;
          summaryContainer.textContent = `Summary: Total Lines: ${totalLines}, Changes Made: ${changesMade}, Unchanged Lines: ${unchangedLines}`;
        }
      } catch (error) {
        outputEditor.setValue(`Error: ${error.message}`);
      } finally {
        loadingIndicator.style.display = "none";
      }
    });
});
