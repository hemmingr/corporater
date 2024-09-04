console.log("compare.js script loaded");

document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM fully loaded and parsed");

  const logsArea = document.getElementById("logsArea");
  const remoteLogsArea = document.getElementById("remoteLogsArea");
  const transferSelect = document.getElementById("transferSelect");
  const transferOptionsSelect = document.getElementById(
    "transferOptionsSelect"
  );
  const deployButton = document.getElementById("deployButton");
  const transformedArea = document.getElementById("transformedArea");

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
    const diff = {};
    for (const key in json1) {
      if (json1[key] !== json2[key]) {
        diff[key] = { json1: json1[key], json2: json2[key] };
      }
    }
    return diff;
  }

  function transformJson(diff, pushtype) {
    const transformed = {
      pushtype: pushtype,
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

  let transformedEditor;
  let editor;

  function toggleDeployButton() {
    if (transformedEditor) {
      if (transformedEditor.getValue().trim().length > 0) {
        deployButton.style.display = "inline-block";
      } else {
        deployButton.style.display = "none";
      }
    } else {
      console.error("transformedEditor is not defined");
    }
  }

  try {
    const configResponse = await fetch("/github/config");
    logAction("Fetching configuration...");
    if (!configResponse.ok) {
      throw new Error("Failed to fetch configuration");
    }

    const config = await configResponse.json();
    logAction("Configuration fetched successfully.");

    config.setup.transfer_rules.allowed_transfers.forEach((transfer) => {
      const option = document.createElement("option");
      option.value = `${transfer.source}-${transfer.destination}`;
      option.textContent = `${transfer.source} to ${transfer.destination}`;
      transferSelect.appendChild(option);
    });
    logAction("Transfer selection populated.");

    const credentialsResponse = await fetch("/credentials");
    logAction("Fetching credentials...");
    if (!credentialsResponse.ok) {
      throw new Error("Failed to fetch credentials");
    }

    const { username, password } = await credentialsResponse.json();

    const headers = new Headers();
    headers.set("Authorization", "Basic " + btoa(username + ":" + password));

    // Initialize editors
    editor = CodeMirror.fromTextArea(document.getElementById("resultArea"), {
      mode: "application/json",
      lineNumbers: true,
      theme: "dracula", // Default theme
    });

    transformedEditor = CodeMirror.fromTextArea(
      document.getElementById("transformedArea"),
      {
        mode: "application/json",
        lineNumbers: true,
        theme: "dracula", // Default theme
      }
    );

    const keyidspaceMap = {
      users: "user",
      plugin: "plugin",
      "Enterprise Templates": "enterprisetemplate",
      "Enterprise Tasks": "enterprisetask", // Added
      Properties: "property", // Added
    };

    transferSelect.addEventListener("change", () => {
      const selectedTransfer = transferSelect.value;
      transferOptionsSelect.innerHTML =
        '<option value="">Select an option</option>';

      if (selectedTransfer) {
        const [sourceStage, destinationStage] = selectedTransfer.split("-");
        const selectedTransferObj =
          config.setup.transfer_rules.allowed_transfers.find(
            (transfer) =>
              transfer.source === sourceStage &&
              transfer.destination === destinationStage
          );

        if (selectedTransferObj) {
          selectedTransferObj.options.forEach((option) => {
            if (option.enabled) {
              const opt = document.createElement("option");
              opt.value = option.type;
              opt.textContent = option.type;
              transferOptionsSelect.appendChild(opt);
            }
          });
        }
      }
    });

    document
      .getElementById("compareButton")
      .addEventListener("click", async () => {
        logAction("Compare button clicked.");
        try {
          const selectedTransfer = transferSelect.value;
          if (!selectedTransfer) {
            throw new Error("Please select a transfer");
          }

          const selectedOption = transferOptionsSelect.value;
          if (!selectedOption) {
            throw new Error("Please select an option");
          }

          const keyidspace = keyidspaceMap[selectedOption] || "user";

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

          const params = new URLSearchParams({
            keyidspace: keyidspace,
            keymethod: "generate",
            keyfilter: "testfilter",
            keypage: "1",
            keylimit: "10",
            keyrelease: "1.0.0",
          });

          const [response1, response2] = await Promise.all([
            fetch(`${endpoint1}?${params.toString()}`, { headers }),
            fetch(`${endpoint2}?${params.toString()}`, { headers }),
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
          const pushtypeMap = {
            user: "user",
            plugin: "plugin",
            enterprisetemplate: "enterprisetemplate",
            enterprisetask: "enterprisetask", // Added
            property: "property", // Added
          };

          const transformedResult = transformJson(
            result,
            pushtypeMap[keyidspace]
          );
          transformedEditor.setValue(
            JSON.stringify(transformedResult, null, 2)
          );
          logAction("JSON transformation completed.");

          // Update the deploy button visibility
          toggleDeployButton();
        } catch (error) {
          console.error("Error:", error); // Log the full error object to the console
          editor.setValue(
            `Error: ${error.message}\nStack trace: ${error.stack}`
          );
          logAction(`Error: ${error.message}`);
        }
      });

    document
      .getElementById("deployButton")
      .addEventListener("click", async () => {
        logAction("Deploy button clicked.");
        try {
          const selectedTransfer = transferSelect.value;
          if (!selectedTransfer) {
            throw new Error("Please select a transfer");
          }

          const selectedOption = transferOptionsSelect.value;
          if (!selectedOption) {
            throw new Error("Please select an option");
          }

          const keyidspace = keyidspaceMap[selectedOption] || "user";

          const [sourceStage, destinationStage] = selectedTransfer.split("-");
          logAction(`Selected transfer: ${sourceStage} to ${destinationStage}`);

          const targetHost = config.setup.hosts.find(
            (host) => host.stage === destinationStage
          );

          if (!targetHost) {
            throw new Error("Target host not found");
          }

          const pushtypeMap = {
            user: "user",
            plugin: "plugin",
            enterprisetemplate: "enterprisetemplate",
            enterprisetask: "enterprisetask", // Added
            property: "property", // Added
          };

          const pushtype = pushtypeMap[keyidspace];

          const deployRequestBody = {
            pushtype: pushtype,
            expressions: [],
          };

          const jsonResult = JSON.parse(transformedEditor.getValue());

          jsonResult.expressions.forEach((exp) => {
            deployRequestBody.expressions.push(exp);
          });

          const deployEndpoint = `https://${targetHost.name}.${config.setup.common.domain}/CorpoWebserver/api/control/push`;

          const response = await fetch(deployEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Basic " + btoa(username + ":" + password),
            },
            body: JSON.stringify(deployRequestBody),
          });

          if (!response.ok) {
            throw new Error("Failed to deploy differences");
          }

          let result;
          try {
            result = await response.json();
          } catch (e) {
            result = "No JSON response from deployment";
          }

          logAction("Deployment completed successfully.");
          logRemote(JSON.stringify(result, null, 2));
        } catch (error) {
          console.error("Error:", error);
          logAction(`Error: ${error.message}`);
        }
      });

    // Toggle theme button functionality
    document
      .getElementById("toggleThemeButton")
      .addEventListener("click", () => {
        if (transformedEditor) {
          const currentTheme = transformedEditor.getOption("theme");
          const newTheme = currentTheme === "dracula" ? "default" : "dracula";
          transformedEditor.setOption("theme", newTheme);
          if (editor) {
            editor.setOption("theme", newTheme);
          }
        } else {
          console.error("transformedEditor is not defined");
        }
      });

    document.getElementById("clearLogsButton").addEventListener("click", () => {
      if (logsArea) {
        logsArea.value = "";
      }
      if (remoteLogsArea) {
        remoteLogsArea.value = "";
      }
    });
  } catch (error) {
    console.error("Error during initialization:", error);
  }
});
