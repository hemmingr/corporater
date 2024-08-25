import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env

const getConfig = () => {
  if (!process.env.PORT) {
    throw new Error("Missing environment variable: PORT");
  }
  if (!process.env.SOURCE_SERVER_BASE_URL) {
    throw new Error("Missing environment variable: SOURCE_SERVER_BASE_URL");
  }

  return {
    port: process.env.PORT || 3000,
    rabbitmqEnabled: process.env.RABBITMQ_ENABLED === "true",
    rabbitmqUrl: process.env.RABBITMQ_URL,
    rabbitQueueName: process.env.RABBITMQ_QUEUE_NAME || "patch_queue",
    azureServiceBusEnabled: process.env.AZURE_SERVICE_BUS_ENABLED === "true",
    serviceBusConnectionString: process.env.AZURE_SERVICE_BUS_CONNECTION_STRING,
    queueName: process.env.AZURE_SERVICE_BUS_QUEUE_NAME || "defaultQueue",
    sourceServerBaseUrl: process.env.SOURCE_SERVER_BASE_URL,
  };
};

const config = getConfig();

export { config };
