document.addEventListener("DOMContentLoaded", function () {
  let apiKey = ""; // Placeholder for API key
  const apiBaseUrl = "/github"; // Base URL for API requests

  async function fetchApiKey() {
    try {
      const response = await fetch("/api/get-api-key");
      const data = await response.json();
      apiKey = data.apiKey;
      loadDraft(); // Initial data load after fetching the API key
    } catch (error) {
      console.error("Error fetching API key:", error);
    }
  }

  function validateJSON() {
    const jsonValue = editor.getValue();
    try {
      JSON.parse(jsonValue);
      document.getElementById("saveMenuItem").disabled = false;
      const errorDisplay = document.getElementById("errorDisplay");
      if (errorDisplay) {
        errorDisplay.textContent = "";
      }
      return true;
    } catch (e) {
      document.getElementById("saveMenuItem").disabled = true;
      const errorDisplay = document.getElementById("errorDisplay");
      if (errorDisplay) {
        errorDisplay.textContent =
          "Invalid JSON data. Please correct it before saving.";
      }
      showModal("Invalid JSON data. Please correct it."); // Show modal with validation error
      console.error("JSON validation error:", e);
      return false;
    }
  }

  function fetchData() {
    document.getElementById("loading").style.display = "block";
    fetch(`${apiBaseUrl}/config?api_key=${apiKey}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        editor.setValue(JSON.stringify(data, null, 2));
        validateJSON(); // Initial validation on load
      })
      .catch((error) => {
        console.error("Error fetching JSON:", error);
        editor.setValue("Error loading JSON data.");
      })
      .finally(() => {
        document.getElementById("loading").style.display = "none";
      });
  }

  function loadDraft() {
    const draft = localStorage.getItem("draftConfig");
    if (draft) {
      const useDraft = confirm(
        "You have a saved draft. Would you like to load it?"
      );
      if (useDraft) {
        try {
          JSON.parse(draft); // Validate draft JSON before loading
          editor.setValue(draft);
        } catch (e) {
          alert("The saved draft is invalid JSON. Please save a valid draft.");
          localStorage.removeItem("draftConfig"); // Remove invalid draft
        }
      } else {
        fetchData(); // If user chooses not to load draft, fetch data
      }
    } else {
      fetchData(); // If no draft is found, fetch data
    }
  }

  function showModal(message) {
    const modal = document.getElementById("modal");
    const modalContent = document.getElementById("modalContent");
    modalContent.innerHTML = message; // Use innerHTML to include clickable links
    modal.classList.add("show");

    // Add click event listener to handle commit link clicks
    modalContent.addEventListener("click", handleCommitClick);
  }

  function hideModal() {
    const modal = document.getElementById("modal");
    modal.classList.remove("show");
  }

  function displayCommits(commits) {
    const commitList = commits
      .map((commit) => {
        // Create a link element for each commit
        const commitLink = `<a href="#" data-commit-id="${commit.sha}">${commit.message} - ${commit.date}</a>`;
        return `<li>${commitLink}</li>`;
      })
      .join("");
    showModal(`<ul>${commitList}</ul>`);
  }

  async function handleCommitClick(event) {
    // Check if the clicked element is a link
    if (event.target.tagName === "A") {
      event.preventDefault(); // Prevent default link behavior
      const commitId = event.target.getAttribute("data-commit-id");

      try {
        // Send a request to revert to the selected commit
        const response = await fetch(
          `${apiBaseUrl}/revert/${commitId}?api_key=${apiKey}`,
          {
            method: "POST",
          }
        );
        const result = await response.json();
        alert(result.message || "Reverted to commit successfully");
        fetchData(); // Reload the editor with the reverted data
      } catch (error) {
        console.error("Error reverting commit:", error);
        alert("Failed to revert commit");
      }
    }
  }

  const editor = CodeMirror.fromTextArea(
    document.getElementById("jsonEditor"),
    {
      mode: "application/json",
      lineNumbers: true,
      theme: "dracula",
    }
  );

  editor.on("change", validateJSON);

  editor.getWrapperElement().addEventListener("contextmenu", function (e) {
    e.preventDefault();
    const menu = document.getElementById("contextMenu");
    menu.style.display = "block";
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;
  });

  document.addEventListener("click", function (e) {
    const menu = document.getElementById("contextMenu");
    if (!menu.contains(e.target)) {
      menu.style.display = "none";
    }
  });

  document
    .getElementById("saveMenuItem")
    .addEventListener("click", async function () {
      const jsonData = editor.getValue();
      try {
        const response = await fetch(
          `${apiBaseUrl}/save-config?api_key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: jsonData,
          }
        );
        const result = await response.json();
        alert(result.message || "Config saved successfully");
      } catch (error) {
        console.error("Error saving JSON data:", error);
        alert("Failed to save JSON data");
      }
    });

  document
    .getElementById("saveDraftMenuItem")
    .addEventListener("click", function () {
      const jsonData = editor.getValue();
      try {
        JSON.parse(jsonData); // Validate JSON before saving draft
        localStorage.setItem("draftConfig", jsonData);
        alert("Draft saved successfully.");
      } catch (e) {
        alert("Failed to save draft. Invalid JSON data.");
      }
    });

  document
    .getElementById("refreshMenuItem")
    .addEventListener("click", loadDraft);

  document
    .getElementById("toggleThemeMenuItem")
    .addEventListener("click", function () {
      const currentTheme = editor.getOption("theme");
      const newTheme = currentTheme === "dracula" ? "default" : "dracula";
      editor.setOption("theme", newTheme);
      const themeStylesheet = document.getElementById("theme-stylesheet");
      themeStylesheet.href = `https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.0/theme/${newTheme}.min.css`;
      document.getElementById("toggleThemeMenuItem").textContent =
        newTheme === "dracula"
          ? "Switch to Light Theme"
          : "Switch to Dark Theme";
    });

  document
    .getElementById("viewCommitsMenuItem")
    .addEventListener("click", async function () {
      try {
        const response = await fetch(`${apiBaseUrl}/commits?api_key=${apiKey}`);
        const commits = await response.json();
        displayCommits(commits);
      } catch (error) {
        console.error("Error fetching commits:", error);
        showModal("Failed to fetch commit history");
      }
    });

  document.getElementById("modalClose").addEventListener("click", hideModal);
  document.getElementById("closeGuide").addEventListener("click", function () {
    document.getElementById("overlayGuide").style.display = "none";
  });

  fetchApiKey(); // Fetch API key on page load

  // Show overlay guide on first visit
  if (!localStorage.getItem("guideSeen")) {
    document.getElementById("overlayGuide").style.display = "flex";
    localStorage.setItem("guideSeen", "true");
  }
});
