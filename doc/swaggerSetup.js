import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { config } from "../config/config.js";

const setupSwagger = (app) => {
  const swaggerOptions = {
    swaggerDefinition: {
      openapi: "3.0.0",
      info: {
        title: "Corporater API",
        version: "1.0.0",
        description: "Corporater API documentation",
      },
      servers: [
        {
          url: `https://localhost:${config.port}`, // Ensure this uses http
        },
      ],
    },
    apis: ["./doc/*.js"], // Path to the API docs
  };

  const swaggerDocs = swaggerJsdoc(swaggerOptions);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};

export default setupSwagger;
