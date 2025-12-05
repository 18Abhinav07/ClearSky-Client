Authentication API

  These endpoints are prefixed with the base path /api/auth.

  ---

  1. Login

   * Endpoint: POST /api/auth/login
   * Description: Authenticates a user via their wallet address and returns a JWT token pair for session
     management.
   * Request Body:

   1     {
   2       "wallet_address": "YOUR_WALLET_ADDRESS"
   3     }
   * Success Response (`200 OK`):

    1     {
    2       "success": true,
    3       "data": {
    4         "walletAddress": "string",
    5         "devices": [],
    6         "limited": false,
    7         "tokens": {
    8           "access_token": "string (jwt)",
    9           "refresh_token": "string (jwt)"
   10         }
   11       }
   12     }
   * Error Responses:
       * 400 Bad Request: wallet_address is missing.
       * 500 Internal Server Error: General server error.

  ---

  2. Refresh Token

   * Endpoint: POST /api/auth/refresh
   * Description: Generates a new pair of access and refresh tokens.
   * Request Body:

   1     {
   2       "refresh_token": "YOUR_REFRESH_TOKEN"
   3     }
   * Success Response (`200 OK`):

   1     {
   2       "success": true,
   3       "data": {
   4         "access_token": "string (jwt)",
   5         "refresh_token": "string (jwt)"
   6       }
   7     }
   * Error Responses:
       * 400 Bad Request: refresh_token is missing.
       * 401 Unauthorized: Token is invalid, expired, or revoked.
       * 500 Internal Server Error: General server error.

  ---

  3. Logout

   * Endpoint: POST /api/auth/logout
   * Description: Invalidates the user's current session, effectively logging them out.
   * Headers:
       * Authorization: Bearer <YOUR_ACCESS_TOKEN>
   * Success Response (`200 OK`):

   1     {
   2       "success": true,
   3       "message": "Logged out successfully"
   4     }
   * Error Responses:
       * 401 Unauthorized: Access token is missing or invalid.
       * 500 Internal Server Error: General server error.

  ---

  Device API

  These endpoints are prefixed with /api/devices and require a valid access_token.

  ---

  1. Create Device

   * Endpoint: POST /api/devices
   * Description: Registers a new device for the authenticated user.
   * Headers:
       * Authorization: Bearer <YOUR_ACCESS_TOKEN>
   * Request Body:
   1     {
   2       "deviceId": "string (64 hex characters)",
   3       "location": "string",
   4       "sensor": "string"
   5     }
   * Success Response (`201 Created`):

    1     {
    2       "success": true,
    3       "device": {
    4         "_id": "string",
    5         "deviceId": "string",
    6         "owner": "string",
    7         "location": "string",
    8         "sensor": "string",
    9         "status": "active",
   10         "registeredAt": "date-time"
   11       }
   12     }
   * Error Responses:
       * 400 Bad Request: Required fields are missing or deviceId has an invalid format.
       * 401 Unauthorized: Not authenticated.
       * 403 Forbidden: User has reached the maximum device limit.
       * 500 Internal Server Error: General server error.

  ---

  2. Get Devices

   * Endpoint: GET /api/devices
   * Description: Retrieves all devices registered by the authenticated user.
   * Headers:
       * Authorization: Bearer <YOUR_ACCESS_TOKEN>
   * Success Response (`200 OK`):

    1     {
    2       "success": true,
    3       "devices": [
    4         {
    5           "_id": "string",
    6           "deviceId": "string",
    7           "owner": "string",
    8           "location": "string",
    9           "sensor": "string",
   10           "status": "active",
   11           "registeredAt": "date-time"
   12         }
   13       ]
   14     }
   * Error Responses:
       * 401 Unauthorized: Not authenticated.
       * 500 Internal Server Error: General server error.

  ---

  3. Delete Device

   * Endpoint: DELETE /api/devices/:deviceId
   * Description: This endpoint is defined but not implemented on the server.
   * Response (`501 Not Implemented`):

   1     {
   2       "success": false,
   3       "error": {
   4         "message": "Not Implemented"
   5       }
   6     }
