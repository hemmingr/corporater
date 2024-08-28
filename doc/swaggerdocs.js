/**
 * @swagger
 * /api/diff:
 *   post:
 *     summary: Process JSON data and return the diff result
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               json1:
 *                 type: array
 *                 items:
 *                   type: object
 *               json2:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: The diff result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Both json1 and json2 should be arrays
 *       500:
 *         description: Error processing. Ensure both JSON objects are valid
 */

/**
 * @swagger
 * /api/latest-diff:
 *   get:
 *     summary: Get the latest diff result
 *     responses:
 *       200:
 *         description: The latest diff result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: No diff data available
 */

/**
 * @swagger
 * /api/config:
 *   get:
 *     summary: Get the current configuration
 *     responses:
 *       200:
 *         description: The current configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

/**
 * @swagger
 * /api/update-config:
 *   post:
 *     summary: Update the configuration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *       400:
 *         description: Invalid JSON data
 */

/**
 * @swagger
 * /api/integrity:
 *   post:
 *     summary: Calculate the SHA-256 hash of the provided data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: The SHA-256 hash of the provided data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 */

/**
 * @swagger
 * /api/base64encode:
 *   post:
 *     summary: Encode the provided text to Base64
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *     responses:
 *       200:
 *         description: The Base64 encoded result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *       400:
 *         description: Text is required and must be a non-empty string
 */

/**
 * @swagger
 * /api/genextended:
 *   post:
 *     summary: Process text and update GitHub file
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *     responses:
 *       200:
 *         description: The processed result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Text is required and must be a non-empty string
 *       500:
 *         description: Error processing text. Please check the input format and try again
 */

/**
 * @swagger
 * /api/get-api-key:
 *   get:
 *     summary: Get the API key
 *     responses:
 *       200:
 *         description: The API key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKey:
 *                   type: string
 */

/**
 * @swagger
 * /api/process-ids:
 *   post:
 *     summary: Process IDs and convert them to human-readable names
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *     responses:
 *       200:
 *         description: The processed result with human-readable names
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rows:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       exp:
 *                         type: string
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalLines:
 *                       type: integer
 *                     changesMade:
 *                       type: integer
 *                     unchangedLines:
 *                       type: integer
 *       400:
 *         description: Input is required and must be a non-empty string
 */

/**
 * @swagger
 * /github/config:
 *   get:
 *     summary: Fetch the configuration file from GitHub
 *     responses:
 *       200:
 *         description: The configuration file content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Failed to fetch JSON from GitHub
 */

/**
 * @swagger
 * /github/save-config:
 *   post:
 *     summary: Save the configuration file to GitHub
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Configuration saved successfully
 *       400:
 *         description: Invalid JSON data
 *       500:
 *         description: Failed to save configuration
 */

/**
 * @swagger
 * /github/commits:
 *   get:
 *     summary: Fetch the commits from GitHub
 *     responses:
 *       200:
 *         description: The list of commits
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Failed to fetch commits
 */

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Retrieve deployment frequency, lead time, MTTR, and change failure rate metrics.
 *     responses:
 *       200:
 *         description: Metrics including deployment frequency, average lead time, MTTR, and change failure rate.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deploymentFrequency:
 *                   type: number
 *                   description: The frequency of deployments per day.
 *                 averageLeadTime:
 *                   type: number
 *                   description: The average lead time for changes in seconds.
 *                 averageMTTR:
 *                   type: number
 *                   description: The average Mean Time to Recovery (MTTR) in seconds.
 *                 changeFailureRate:
 *                   type: number
 *                   description: The percentage of deployments that result in a failure.
 *       500:
 *         description: Failed to fetch metrics.
 */
