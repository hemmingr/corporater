// public/js/file-structure.js


let currentStyle = "visual";
let apiKey = "";

// Fetch API key from /get-api-key endpoint
async function fetchApiKey() {
  try {
    const response = await fetch("/api/get-api-key");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    apiKey = data.apiKey;
    console.log("Fetched API key:", apiKey); // Log the fetched API key
  } catch (error) {
    console.error("Error fetching API key:", error);
  }
}

async function fetchFileStructure() {
  try {
    // Ensure API key is fetched before making the request
    await fetchApiKey();

    const response = await fetch("/api/file-structure", {
      headers: {
        'Authorization': `Bearer ${apiKey}` // Include the API key in the Authorization header
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Fetched data:", data); // Log the fetched data
    return data;
  } catch (error) {
    console.error("Error fetching file structure:", error);
  }
}

function createTree(data) {
  const ul = document.createElement("ul");
  data.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item.name;
    if (item.isDirectory) {
      li.classList.add("directory");
      li.appendChild(createTree(item.children));
    }
    ul.appendChild(li);
  });
  return ul;
}

function createAnalogTree(data, prefix = "") {
  let result = "";
  data.forEach((item, index) => {
    const isLast = index === data.length - 1;
    const newPrefix = prefix + (isLast ? "└── " : "├── ");
    result += newPrefix + item.name + "\n";
    if (item.isDirectory) {
      result += createAnalogTree(
        item.children,
        prefix + (isLast ? "    " : "│   ")
      );
    }
  });
  return result;
}

function toggleStyle() {
  console.log("Toggle button clicked");
  fetchFileStructure().then((data) => {
    const fileStructureElement = document.getElementById("file-structure");
    fileStructureElement.innerHTML = ""; // Clear current content
    if (currentStyle === "visual") {
      console.log("Switching to analog style"); // style switch
      const pre = document.createElement("pre");
      pre.classList.add("analog");
      pre.textContent = createAnalogTree(data);
      fileStructureElement.appendChild(pre);
      currentStyle = "analog";
    } else {
      console.log("Switching to visual style"); // style switch
      fileStructureElement.appendChild(createTree(data));
      currentStyle = "visual";
    }
  });
}

// Initialize with visual style
document.addEventListener("DOMContentLoaded", () => {
  console.log("Document loaded, initializing with visual style");
  toggleStyle();

  // Add event listener for the toggle button
  document
    .getElementById("toggle-button")
    .addEventListener("click", toggleStyle);
});
