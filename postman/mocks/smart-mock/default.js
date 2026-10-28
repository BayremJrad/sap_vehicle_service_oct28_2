/**
 * Vehicle Service – Stateful Smart Mock
 * Uses pm.state to persist vehicles in-memory across requests.
 *
 * Routes:
 *   POST   /vehicles      – Create a vehicle   (201 | 400 | 409)
 *   GET    /vehicles      – List all vehicles   (200)
 *   GET    /vehicles/:id  – Get one vehicle     (200 | 404)
 *   PATCH  /vehicles/:id  – Update a vehicle    (200 | 404)
 *   DELETE /vehicles/:id  – Remove a vehicle    (204 | 404)
 */
const http = require("http");
const PORT = process.env.PORT || 4500;
const JSON_H = { "Content-Type": "application/json" };

const readBody = (req) =>
  new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); }
    });
  });

const server = http.createServer(async (req, res) => {
  const { method } = req;
  const urlPath = req.url.split("?")[0].replace(/\/$/, "") || "/";

  const isVehiclesBase  = urlPath === "/vehicles";
  const vehicleIdMatch  = urlPath.match(/^\/vehicles\/([^/]+)$/);
  const vehicleId       = vehicleIdMatch ? vehicleIdMatch[1] : null;

  let vehicles = (await pm.state.get("vehicles")) || [];
  let nextId   = (await pm.state.get("nextId"))   || 1;

  // @endpoint POST /vehicles
  if (method === "POST" && isVehiclesBase) {
    const body = await readBody(req);

    if (!body.vin || !body.make || !body.model) {
      res.writeHead(400, JSON_H);
      return res.end(JSON.stringify({ error: "Missing required attribute", required: ["vin", "make", "model"] }));
    }

    if (vehicles.find((v) => v.vin === body.vin)) {
      res.writeHead(409, JSON_H);
      return res.end(JSON.stringify({ error: "Vehicle already exists", vin: body.vin }));
    }

    const vehicle = {
      id:       nextId,
      nickName: body.nickName || "",
      vin:      body.vin,
      make:     body.make,
      model:    body.model,
      year:     body.year  || "",
      miles:    body.miles ?? 0,
    };

    vehicles.push(vehicle);
    await pm.state.set("vehicles", vehicles);
    await pm.state.set("nextId", nextId + 1);

    res.writeHead(201, JSON_H);
    return res.end(JSON.stringify(vehicle));
  }

  // @endpoint GET /vehicles
  if (method === "GET" && isVehiclesBase) {
    res.writeHead(200, JSON_H);
    return res.end(JSON.stringify(vehicles));
  }

  // @endpoint GET /vehicles/:id
  if (method === "GET" && vehicleId) {
    const vehicle = vehicles.find((v) => String(v.id) === vehicleId);
    if (!vehicle) {
      res.writeHead(404, JSON_H);
      return res.end(JSON.stringify({ error: "Vehicle not found", id: vehicleId }));
    }
    res.writeHead(200, JSON_H);
    return res.end(JSON.stringify(vehicle));
  }

  // @endpoint PATCH /vehicles/:id
  if (method === "PATCH" && vehicleId) {
    const idx = vehicles.findIndex((v) => String(v.id) === vehicleId);
    if (idx === -1) {
      res.writeHead(404, JSON_H);
      return res.end(JSON.stringify({ error: "Vehicle not found", id: vehicleId }));
    }
    const body = await readBody(req);
    const { id: _ignored, ...patch } = body;
    vehicles[idx] = { ...vehicles[idx], ...patch };
    await pm.state.set("vehicles", vehicles);
    res.writeHead(200, JSON_H);
    return res.end(JSON.stringify(vehicles[idx]));
  }

  // @endpoint DELETE /vehicles/:id
  if (method === "DELETE" && vehicleId) {
    const idx = vehicles.findIndex((v) => String(v.id) === vehicleId);
    if (idx === -1) {
      res.writeHead(404, JSON_H);
      return res.end(JSON.stringify({ error: "Vehicle not found", id: vehicleId }));
    }
    vehicles.splice(idx, 1);
    await pm.state.set("vehicles", vehicles);
    res.writeHead(204, {});
    return res.end();
  }

  // Fallback 404
  res.writeHead(404, JSON_H);
  res.end(JSON.stringify({
    error: "Endpoint not defined",
    message: `${method} ${urlPath} is not handled by this mock.`,
  }));
});

server.listen(PORT, () => console.log(`Vehicle Service Smart Mock running on port ${PORT}`));
