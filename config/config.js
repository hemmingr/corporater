// config/config.js

import dotenv from "dotenv";
import Joi from "joi";
import { fetchAzureIpRanges } from "../services/azureIpService.js";

dotenv.config(); // Load environment variables from .env

const schema = Joi.object({
  PORT: Joi.number().default(3000),
  RABBITMQ_ENABLED: Joi.boolean().default(false),
  RABBITMQ_URL: Joi.string().uri().required(),
  RABBITMQ_QUEUE_NAME: Joi.string().default("patch_queue"),
  SOURCE_SERVER_BASE_URL: Joi.string()
    .uri()
    .default("https://innovation.corporater.dev"),
  LOG_LEVEL: Joi.string().default("info"),
  HOSTS_USERNAME: Joi.string().required(),
  HOSTS_PASSWORD: Joi.string().required(),
});

const { error, value: envVars } = schema.validate(process.env, {
  allowUnknown: true,
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const staticIpRanges = [
  '185.73.24.0/24',
  '165.1.159.0/24',
  '92.221.76.0/24',
  '54.194.41.0/24',
  '40.94.94.0/24',
  '52.48.167.0/24',
];

const initializeConfig = async () => {
  const azureIpRanges = await fetchAzureIpRanges();
  return {
    port: envVars.PORT,
    rabbitmqEnabled: envVars.RABBITMQ_ENABLED,
    rabbitmqUrl: envVars.RABBITMQ_URL,
    rabbitQueueName: envVars.RABBITMQ_QUEUE_NAME,
    sourceServerBaseUrl: envVars.SOURCE_SERVER_BASE_URL,
    allowedIpRanges: [...staticIpRanges, ...azureIpRanges],
    logLevel: envVars.LOG_LEVEL,
    hostsUsername: envVars.HOSTS_USERNAME,
    hostsPassword: envVars.HOSTS_PASSWORD,
  };
};

export { initializeConfig };

