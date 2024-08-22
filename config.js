import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  rabbitmqEnabled: process.env.RABBITMQ_ENABLED === "true",
  rabbitmqUrl: process.env.RABBITMQ_URL,
  rabbitQueueName: process.env.RABBITMQ_QUEUE_NAME || "patch_queue",
  azureServiceBusEnabled: process.env.AZURE_SERVICE_BUS_ENABLED === "true",
  serviceBusConnectionString: process.env.AZURE_SERVICE_BUS_CONNECTION_STRING,
  queueName: process.env.AZURE_SERVICE_BUS_QUEUE_NAME || "defaultQueue",
  SOURCE_SERVER_BASE_URL: process.env.SOURCE_SERVER_BASE_URL,
};
