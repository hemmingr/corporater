import dotenv from "dotenv";
import Joi from "joi";

dotenv.config(); // Load environment variables from .env

const schema = Joi.object({
  PORT: Joi.number().default(3000),
  RABBITMQ_ENABLED: Joi.boolean().default(false),
  RABBITMQ_URL: Joi.string().uri().required(),
  RABBITMQ_QUEUE_NAME: Joi.string().default("patch_queue"),
  SOURCE_SERVER_BASE_URL: Joi.string()
    .uri()
    .default("https://innovation.corporater.dev"),
});

const { error, value: envVars } = schema.validate(process.env, {
  allowUnknown: true,
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  port: envVars.PORT,
  rabbitmqEnabled: envVars.RABBITMQ_ENABLED,
  rabbitmqUrl: envVars.RABBITMQ_URL,
  rabbitQueueName: envVars.RABBITMQ_QUEUE_NAME,
  sourceServerBaseUrl: envVars.SOURCE_SERVER_BASE_URL,
};

export { config };
