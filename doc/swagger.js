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