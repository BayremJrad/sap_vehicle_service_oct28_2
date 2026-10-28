const http = require('http');
const PORT = process.env.PORT || 4500;

const server = http.createServer(async (req, res) => {
  const { method, url } = req;

  const parseBody = () => new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { resolve(null); }
    });
  });

  const json = (status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(data !== undefined ? JSON.stringify(data) : '');
  };

  try {
    // @endpoint GET /vehicles
    if (method === 'GET' && url === '/vehicles') {
      const state = await pm.state.toObject();
      const vehicles = Object.entries(state)
        .filter(([k]) => k.startsWith('vs:vehicle:'))
        .map(([, v]) => v);
      json(200, vehicles);
      return;
    }

    // @endpoint POST /vehicles
    if (method === 'POST' && url === '/vehicles') {
      const body = await parseBody();
      if (body === null) {
        json(400, { message: 'Bad request body.' });
        return;
      }
      const required = ['vin', 'make', 'model', 'year'];
      for (const field of required) {
        if (!body[field]) {
          json(400, { message: `Request body missing required attribute: ${field}` });
          return;
        }
      }
      const state = await pm.state.toObject();
      const allVehicles = Object.entries(state)
        .filter(([k]) => k.startsWith('vs:vehicle:'))
        .map(([, v]) => v);
      const dup = allVehicles.find(v => v.vin === body.vin);
      if (dup) {
        json(409, { message: `Vehicle with VIN ${body.vin} already exists. Existing vehicle ID: ${dup.id}` });
        return;
      }
      const nextId = (await pm.state.get('vs:nextId')) || 1;
      const vehicle = { id: nextId, vin: body.vin, make: body.make, model: body.model, year: body.year };
      if (body.nickName !== undefined) vehicle.nickName = body.nickName;
      if (body.miles !== undefined) vehicle.miles = body.miles;
      await pm.state.set(`vs:vehicle:${nextId}`, vehicle);
      await pm.state.set('vs:nextId', nextId + 1);
      json(201, vehicle);
      return;
    }

    const idMatch = url.match(/^\/vehicles\/(\d+)$/);
    if (idMatch) {
      const id = parseInt(idMatch[1], 10);

      // @endpoint GET /vehicles/{id}
      if (method === 'GET') {
        const vehicle = await pm.state.get(`vs:vehicle:${id}`);
        if (!vehicle) { json(404, { message: `Vehicle with id: ${id} not found.` }); return; }
        json(200, vehicle);
        return;
      }

      // @endpoint PATCH /vehicles/{id}
      if (method === 'PATCH') {
        const body = await parseBody();
        if (body === null) { json(400, { message: 'Bad request body.' }); return; }
        const vehicle = await pm.state.get(`vs:vehicle:${id}`);
        if (!vehicle) { json(404, { message: `Vehicle with id: ${id} not found.` }); return; }
        const updated = { ...vehicle, ...body, id };
        await pm.state.set(`vs:vehicle:${id}`, updated);
        json(200, updated);
        return;
      }

      // @endpoint DELETE /vehicles/{id}
      if (method === 'DELETE') {
        await pm.state.delete(`vs:vehicle:${id}`);
        res.writeHead(204);
        res.end();
        return;
      }
    }

    json(404, { message: 'Route not found', method, url });

  } catch (e) {
    json(500, { message: 'An unexpected error occurred.' });
  }
});

server.listen(PORT, () => console.log('Mock server running on port ' + PORT));