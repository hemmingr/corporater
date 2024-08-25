async function fetchFileStructure() {
  try {
    const response = await fetch("/api/file-structure");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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

fetchFileStructure().then((data) => {
  if (data) {
    console.log("Creating tree with data:", data); // Log the data before creating the tree
    const fileStructureElement = document.getElementById("file-structure");
    fileStructureElement.appendChild(createTree(data));
  } else {
    console.error("No data received");
  }
});
