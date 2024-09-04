// services/idProcessor.js

export function processIds(input, typeMappingsPrefix) {
  const typeMappings = {
    Page: "Page",
    ExtendedTable: "Table",
    TextElement: "Text",
    ActionButton: "Button",
    URLView: "View",
    InputView: "View",
    ExtendedExpression: "Expression",
    Scorecard: "Scorecard",
    StandardChart: "StandardChart",
    APIClientAuthentication: "APIClientAuthentication",
    EndpointParameter: "EndpointParameter",
    NotificationTransportGroup: "NotificationTransportGroup",
    InputSet: "InputSet",
    ExtendedTransport: "ExtendedTransport",
    RemoteResource: "RemoteResource",
    LogFolder: "LogFolder",
    Category: "Category",
  };

  const rows = [];
  let rowIndex = 1;
  let changesMade = 0;

  input.split("\n").forEach((line) => {
    const match = line.match(
      /t\.(\d+)\.change\(id := '(\d+)', name := '([^']+)'/
    );
    if (match) {
      const id = match[1];
      const name = match[3];
      const type = line.split("//")[1].trim();
      const newName = `${name.replace(/\s+/g, "")}${
        typeMappings[type] || ""
      }${typeMappingsPrefix}`;
      const newLine = line
        .replace(`t.${id}`, `t.${newName}`)
        .replace(`id := '${id}'`, `id := '${newName}'`);
      rows.push({ id: rowIndex++, exp: newLine });
      changesMade++;
    } else {
      rows.push({ id: rowIndex++, exp: line });
    }
  });

  return {
    rows,
    summary: {
      totalLines: input.split("\n").length,
      changesMade,
      unchangedLines: input.split("\n").length - changesMade,
    },
  };
}
