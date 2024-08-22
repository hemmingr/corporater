# Corporater JSON API Service

## Overview

This project provides a JSON API service with endpoints for calculating JSON differences, managing GitHub repository configurations, and integrating with Uptime Robot. The service includes functionality for hashing, base64 encoding, and GitHub API interactions.

## Table of Contents

- [Getting Started](#getting-started)
- [Endpoints](#endpoints)
  - [JSON Diff Calculation](#json-diff-calculation)
  - [Configuration](#configuration)
  - [GitHub Integration](#github-integration)
  - [Uptime Monitoring](#uptime-monitoring)
  - [Integrity Check](#integrity-check)
  - [Base64 Encoding](#base64-encoding)
- [Configuration](#configuration)
- [Setup](#setup)
- [License](#license)

## Getting Started

To get a local copy of this project up and running, follow these steps:

### Prerequisites

- Node.js (v14.x or higher)
- npm (v6.x or higher)
- GitHub account and token
- (Optional) Uptime Robot API key

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
Install dependencies:

bash
Copy code
npm install
Create a .env file in the root directory with the following environment variables:

env
Copy code
PORT=3000
RABBITMQ_ENABLED=true
RABBITMQ_URL=your-rabbitmq-url
RABBITMQ_QUEUE_NAME=patch_queue
AZURE_SERVICE_BUS_ENABLED=true
AZURE_SERVICE_BUS_CONNECTION_STRING=your-azure-service-bus-connection-string
AZURE_SERVICE_BUS_QUEUE_NAME=defaultQueue
SOURCE_SERVER_USERNAME=your-username
SOURCE_SERVER_PASSWORD=your-password
GITHUB_TOKEN=your-github-token
UPTIME_ROBOT_API_KEY=your-uptime-robot-api-key
Start the server:

bash
Copy code
npm start
Access the application:

Open your web browser and go to http://localhost:3000 to interact with the API service. You can also access specific endpoints as described in the Endpoints section.

Endpoints
JSON Diff Calculation
POST /api/diff

Request Body:
json
Copy code
{
  "json1": [ ... ],
  "json2": [ ... ]
}
Response: JSON object showing the difference between json1 and json2.
GET /api/latest-diff

Response: The latest diff result.
Configuration
GET /api/config

Response: Current configuration JSON.
POST /api/update-config

Request Body: JSON object to update the configuration.
Response: Success message.
GitHub Integration
GET /github/api/config

Response: Fetch and return the JSON from a GitHub repository.
POST /github/api/save-config

Request Body: JSON object to save to the GitHub repository.
Response: Success message.
GET /github/api/commits

Response: Last 5 commits from the GitHub repository.
POST /github/api/revert

Request Body:
json
Copy code
{
  "version": "commit-sha"
}
Response: Message indicating the revert status.
POST /github/api/hash

Request Body:
json
Copy code
{
  "text": "some text",
  "initial": true/false
}
Response: Message indicating if the hash matches.
GET /github/api/uptime

Response: Data from Uptime Robot API.
Integrity Check
GET /api/integrity
Response: SHA256 hash of the latest diff result.
Base64 Encoding
GET /api/base64encode
Response: Base64 encoded string of the latest diff result.
Configuration
The application is configured through the .env file. Ensure that all environment variables are correctly set based on your setup.

License
This project is licensed under the MIT License - see the LICENSE file for details.

rust
Copy code

This version should be properly formatted for Markdown rendering. If you need f