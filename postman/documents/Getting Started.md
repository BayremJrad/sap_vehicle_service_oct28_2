# Getting Started with the Vehicle Service API

Welcome to the **Vehicle Service** workspace. This guide will walk you through everything you need to know to start sending successful requests using the Vehicle Service Collection.

---

## Prerequisites

- Postman desktop app installed (or Postman web)
- Access to the **Vehicle Service** workspace
- The **Mock Environment** selected as your active environment

---

## Step 1 – Select the Mock Environment

Before sending any requests, you need to activate the correct environment so that the `{{baseUrl}}` variable resolves correctly.

1. Open the **Vehicle Service** workspace.
2. Click the environment selector in the top-right corner of Postman (it may say "No Environment").
3. Select **Mock Environment** from the dropdown.

> The `baseUrl` variable in the Mock Environment defines the root URL that all requests are sent to. Without it, requests will fail because `{{baseUrl}}` will not resolve.

---

## Step 2 – Set the `baseUrl` Variable

The `baseUrl` variable must be set to the target server URL. This is the base address of the Vehicle Service API (for example, a mock server URL or a deployed environment URL).

1. Click the eye icon next to the environment selector to open the environment quick-look.
2. Find the `baseUrl` variable and enter the API server URL as the **Current Value**.
3. Save the environment.

**Example value:**
```
https://<your-mock-server-id>.mock.pstmn.io
```

---

## Step 3 – Understand the Authorization Model

The Vehicle Service API **does not require authentication**. You do not need to provide any API keys, bearer tokens, or other credentials. All requests in the collection can be sent as-is once `baseUrl` is configured.

No additional authorization setup is needed.

---

## Step 4 – Send Your First Request

The recommended starting point is to create a vehicle, then retrieve it.

### Create a vehicle

1. Open the **Vehicle Service Collection** in the sidebar.
2. Click on **Create a vehicle** (POST).
3. Review the JSON body — it is pre-filled with an example vehicle:
   ```json
   {
     "nickName": "The Lisa Marie",
     "vin": "4M2DV11W4RDJ53329",
     "make": "Mercury",
     "model": "Villager",
     "year": "1994",
     "miles": 159864
   }
   ```
4. Click **Send**.
5. A `201 Created` response confirms the vehicle was added successfully. Copy the `id` field from the response body — you'll need it for the next steps.

### Retrieve a vehicle

1. Open the **Retrieve a vehicle** (GET) request.
2. In the path parameters, set the `:id` value to the `id` you copied from the create response.
3. Click **Send**.
4. A `200 OK` response returns the full vehicle record.

---

## Step 5 – Explore the Full API

The collection contains five endpoints covering the full vehicle lifecycle:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/vehicles` | Create a new vehicle |
| `GET` | `/vehicles/:id` | Retrieve a vehicle by ID |
| `PATCH` | `/vehicles/:id` | Update a vehicle's details |
| `DELETE` | `/vehicles/:id` | Delete a vehicle by ID |
| `GET` | `/vehicles` | List all vehicles |

Each request includes saved **examples** showing the expected responses for success and error scenarios. Click on any request in the sidebar and expand the **Examples** section to explore them.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `Could not send request` | Check that `baseUrl` is set in the Mock Environment and the environment is active. |
| `404 Not Found` on Retrieve/Update/Delete | Make sure you are using a valid vehicle `id` returned from a Create request. |
| `409 Conflict` on Create | A vehicle with that VIN already exists. Change the `vin` field and try again. |
| `400 Bad Request` on Create | A required field is missing from the request body. Check that all fields are present. |

---

## Need Help?

- Review the **Vehicle Service Collection** description for a full endpoint reference.
- Check the saved **Examples** on each request to understand expected request and response shapes.