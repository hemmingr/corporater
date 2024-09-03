console.log("compare.js script loaded");

document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM fully loaded and parsed");
  const logsArea = document.getElementById("logsArea");
  const remoteLogsArea = document.getElementById("remoteLogsArea");

  function logAction(message) {
    if (logsArea) {
      logsArea.value += message + "\n";
    } else {
      console.error("logsArea element not found");
    }
  }

  function logRemote(message) {
    if (remoteLogsArea) {
      remoteLogsArea.value += message + "\n";
    } else {
      console.error("remoteLogsArea element not found");
    }
  }

  function compareJson(json1, json2) {
    // Implement your JSON comparison logic here
    const diff = {};
    for (const key in json1) {
      if (json1[key] !== json2[key]) {
        diff[key] = { json1: json1[key], json2: json2[key] };
      }
    }
    return diff;
  }

  function transformJson(diff) {
    const transformed = {
      pushtype: "user",
      expressions: [],
    };

    for (const key in diff) {
      if (diff.hasOwnProperty(key)) {
        const item = diff[key].json1;
        transformed.expressions.push({
          id: item.id,
          exp: item.exp,
        });
      }
    }

    return transformed;
  }

  try {
    // Fetch the configuration from the /config endpoint
    const configResponse = await fetch("/github/config");
    logAction("Fetching configuration...");
    if (!configResponse.ok) {
      throw new Error("Failed to fetch configuration");
    }

    const config = await configResponse.json();
    logAction("Configuration fetched successfully.");

    // Populate the transfer selection box
    const transferSelect = document.getElementById("transferSelect");
    config.setup.transfer_rules.allowed_transfers.forEach((transfer) => {
      const option = document.createElement("option");
      option.value = `${transfer.source}-${transfer.destination}`;
      option.textContent = `${transfer.source} to ${transfer.destination}`;
      transferSelect.appendChild(option);
    });
    logAction("Transfer selection populated.");

    // Fetch credentials once and store them for reuse
    const credentialsResponse = await fetch("/credentials");
    logAction("Fetching credentials...");
    if (!credentialsResponse.ok) {
      throw new Error("Failed to fetch credentials");
    }

    const { username, password } = await credentialsResponse.json();
    logAction("Credentials fetched successfully.");

    // Define headers here so they are accessible in the entire scope
    const headers = new Headers();
    headers.set("Authorization", "Basic " + btoa(username + ":" + password));

    // Initialize CodeMirror
    const editor = CodeMirror.fromTextArea(
      document.getElementById("resultArea"),
      {
        mode: "application/json",
        lineNumbers: true,
        theme: "dracula", // Set Dracula as the default theme
      }
    );

    const transformedEditor = CodeMirror.fromTextArea(
      document.getElementById("transformedArea"),
      {
        mode: "application/json",
        lineNumbers: true,
        theme: "dracula", // Set Dracula as the default theme
      }
    );

    document
      .getElementById("compareButton")
      .addEventListener("click", async () => {
        logAction("Compare button clicked.");
        try {
          const selectedTransfer = transferSelect.value;
          if (!selectedTransfer) {
            throw new Error("Please select a transfer");
          }

          const [sourceStage, destinationStage] = selectedTransfer.split("-");
          logAction(`Selected transfer: ${sourceStage} to ${destinationStage}`);

          const sourceHost = config.setup.hosts.find(
            (host) => host.stage === sourceStage
          );
          const targetHost = config.setup.hosts.find(
            (host) => host.stage === destinationStage
          );

          if (!sourceHost || !targetHost) {
            throw new Error("Source or target host not found");
          }

          const endpoint1 = `https://${sourceHost.name}.${config.setup.common.domain}/CorpoWebserver/api/deploy/idspaces`;
          const endpoint2 = `https://${targetHost.name}.${config.setup.common.domain}/CorpoWebserver/api/deploy/idspaces`;

          logAction(`Fetching data from: ${endpoint1}`);
          logAction(`Fetching data from: ${endpoint2}`);

          const params1 = new URLSearchParams({
            keyidspace: "user",
            keymethod: "generate",
            keyfilter: "testfilter",
            keypage: "1",
            keylimit: "10",
            keyrelease: "1.0.0",
          });

          const [response1, response2] = await Promise.all([
            fetch(`${endpoint1}?${params1.toString()}`, { headers }),
            fetch(endpoint2, { headers }),
          ]);

          if (!response1.ok || !response2.ok) {
            throw new Error("Failed to fetch data from one or both endpoints");
          }

          const json1 = await response1.json();
          const json2 = await response2.json();

          const result = compareJson(json1, json2);
          editor.setValue(JSON.stringify(result, null, 2));
          logAction("JSON comparison completed.");

          // Transform the JSON differences to match the schema
          const transformedResult = transformJson(result);
          transformedEditor.setValue(
            JSON.stringify(transformedResult, null, 2)
          );
          logAction("JSON transformation completed.");
        } catch (error) {
          console.error("Error:", error); // Log the error
          editor.setValue(`Error: ${error.message}`);
          logAction(`Error: ${error.message}`);
        }
      });

    // Deploy differences button
    document
      .getElementById("deployButton")
      .addEventListener("click", async () => {
        logAction("Deploy button clicked.");
        try {
          const selectedTransfer = transferSelect.value;
          if (!selectedTransfer) {
            throw new Error("Please select a transfer");
          }

          const [sourceStage, destinationStage] = selectedTransfer.split("-");
          logAction(`Selected transfer: ${sourceStage} to ${destinationStage}`);

          const targetHost = config.setup.hosts.find(
            (host) => host.stage === destinationStage
          );
          if (!targetHost) {
            throw new Error("Target host not found");
          }

          const endpoint = `https://${targetHost.name}.${config.setup.common.domain}/CorpoWebserver/api/control/push`;
          logAction(`Deploying to endpoint: ${endpoint}`);

          const transformedDifferences = transformedEditor.getValue();
          logAction("Transformed differences payload prepared.");

          const deployResponse = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Basic " + btoa(username + ":" + password),
            },
            body: transformedDifferences,
          });

          logAction(`Deploy response status: ${deployResponse.status}`);
          const responseBody = await deployResponse.text();
          logAction(`Deploy response body: ${responseBody}`);

          if (!deployResponse.ok) {
            throw new Error(`Failed to deploy differences: ${responseBody}`);
          }

          logAction("Differences deployed successfully.");
          alert("Differences deployed successfully!");

          // Fetch remote logs with no-cors mode
          const logsEndpoint = `https://${targetHost.name}.${config.setup.common.domain}/CorpoWebserver/api/control/logs`;
          logAction(`Fetching remote logs from: ${logsEndpoint}`);
          const logsResponse = await fetch(logsEndpoint, {
            method: "GET",
            mode: "no-cors", // Use no-cors mode
            headers: {
              Authorization: "Basic " + btoa(username + ":" + password),
            },
          });

          logAction(`Remote logs response status: ${logsResponse.status}`);
          // Since no-cors mode doesn’t allow access to response body, you can only check if the request was successful
          if (logsResponse.ok) {
            logRemote(
              "Logs fetched but cannot access content in no-cors mode."
            );
          } else {
            logRemote(
              "Failed to fetch logs. No-cors mode doesn't allow content access."
            );
          }
          logAction("Remote logs fetching attempt completed.");
        } catch (error) {
          console.error("Error:", error); // Log the error
          alert(`Error: ${error.message}`);
          logAction(`Error: ${error.message}`);
        }
      });

    document
      .getElementById("toggleThemeButton")
      .addEventListener("click", () => {
        const body = document.body;
        const textareas = document.querySelectorAll("textarea");
        const editors = [editor, transformedEditor]; // Assuming you have these CodeMirror instances

        if (body.classList.contains("light-theme")) {
          body.classList.remove("light-theme");
          body.classList.add("dark-theme");
          textareas.forEach((textarea) => {
            textarea.classList.remove("light-theme");
            textarea.classList.add("dark-theme");
          });
          editors.forEach((editor) => {
            editor.setOption("theme", "dracula");
          });
        } else {
          body.classList.remove("dark-theme");
          body.classList.add("light-theme");
          textareas.forEach((textarea) => {
            textarea.classList.remove("dark-theme");
            textarea.classList.add("light-theme");
          });
          editors.forEach((editor) => {
            editor.setOption("theme", "default");
          });
        }
      });
  } catch (error) {
    console.error("Error:", error); // Log the error
    logAction(`Error: ${error.message}`);
  }
});
