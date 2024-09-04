// entityConfig.js

const entityConfig = {
  user: {
    dependencies: ["card", "template"],
    apiEndpoint: "/user",
  },
  property: {
    dependencies: ["owner", "location"],
    apiEndpoint: "/property",
  },
  // Add more entity types as needed
};

export { entityConfig };
