#!/usr/bin/env python3
"""
Vehicle Service API
Implements: postman/specs/Vehicle Service - API Contract/index.yaml

Endpoints
---------
GET    /vehicles          – List all vehicles
POST   /vehicles          – Create a vehicle
GET    /vehicles/{id}     – Retrieve a vehicle
PATCH  /vehicles/{id}     – Partially update a vehicle
DELETE /vehicles/{id}     – Delete a vehicle
"""

from flask import Flask, jsonify, request

app = Flask(__name__)

# ---------------------------------------------------------------------------
# In-memory store
# ---------------------------------------------------------------------------
_vehicles: dict[int, dict] = {}   # id -> vehicle record
_next_id: int = 1

# Required fields on create (BR-3)
_REQUIRED = {"vin", "make", "model", "year"}

# Fields that may be set via POST / PATCH
_ALLOWED = {"nickName", "vin", "make", "model", "year", "miles"}


def _err(msg: str, status: int):
    """Return a JSON error envelope that matches the API contract."""
    return jsonify({"message": msg}), status


# ---------------------------------------------------------------------------
# GET /vehicles  –  list all vehicles  (BR-4)
# ---------------------------------------------------------------------------
@app.get("/vehicles")
def list_vehicles():
    try:
        return jsonify(list(_vehicles.values())), 200
    except Exception:
        return _err("An unexpected error occurred.", 500)


# ---------------------------------------------------------------------------
# POST /vehicles  –  create a vehicle  (BR-1, BR-2, BR-3)
# ---------------------------------------------------------------------------
@app.post("/vehicles")
def create_vehicle():
    try:
        data = request.get_json(silent=True)

        # Missing or non-JSON body → treat as missing required attributes
        if not isinstance(data, dict):
            return _err("Request body missing required attribute: vin", 400)

        # Validate required fields (BR-3)
        for field in _REQUIRED:
            if field not in data:
                return _err(f"Request body missing required attribute: {field}", 400)

        # Duplicate VIN check (BR-2)
        vin = data["vin"]
        for existing in _vehicles.values():
            if existing["vin"] == vin:
                return _err(
                    f"Vehicle with VIN {vin} already exists. "
                    f"Existing vehicle ID: {existing['id']}",
                    409,
                )

        global _next_id
        vehicle = {
            "id": _next_id,
            "nickName": data.get("nickName", ""),
            "vin": vin,
            "make": data["make"],
            "model": data["model"],
            "year": data["year"],
            "miles": data.get("miles", 0),
        }
        _vehicles[_next_id] = vehicle
        _next_id += 1
        return jsonify(vehicle), 201

    except Exception:
        return _err("An unexpected error occurred.", 500)


# ---------------------------------------------------------------------------
# GET /vehicles/{id}  –  retrieve one vehicle  (BR-5, BR-6)
# ---------------------------------------------------------------------------
@app.get("/vehicles/<int:vehicle_id>")
def get_vehicle(vehicle_id: int):
    try:
        vehicle = _vehicles.get(vehicle_id)
        if vehicle is None:
            return _err(f"Vehicle with id: {vehicle_id} not found.", 404)
        return jsonify(vehicle), 200
    except Exception:
        return _err("An unexpected error occurred.", 500)


# ---------------------------------------------------------------------------
# PATCH /vehicles/{id}  –  partial update  (BR-7, BR-8)
# ---------------------------------------------------------------------------
@app.patch("/vehicles/<int:vehicle_id>")
def update_vehicle(vehicle_id: int):
    try:
        vehicle = _vehicles.get(vehicle_id)
        if vehicle is None:
            return _err(f"Vehicle with id: {vehicle_id} not found.", 404)

        data = request.get_json(silent=True)
        if not isinstance(data, dict) or len(data) == 0:
            return _err("Bad request body.", 400)

        # Only update recognised fields; silently ignore unknown keys
        for key, value in data.items():
            if key in _ALLOWED:
                vehicle[key] = value

        return jsonify(vehicle), 200

    except Exception:
        return _err("An unexpected error occurred.", 500)


# ---------------------------------------------------------------------------
# DELETE /vehicles/{id}  –  delete a vehicle  (BR-9)
# ---------------------------------------------------------------------------
@app.delete("/vehicles/<int:vehicle_id>")
def delete_vehicle(vehicle_id: int):
    try:
        if vehicle_id not in _vehicles:
            # 204 is idempotent per the contract; returning 204 for missing IDs
            # keeps the implementation strictly aligned with the spec which only
            # defines 204 and 500 for this operation.
            return "", 204
        del _vehicles[vehicle_id]
        return "", 204
    except Exception:
        return _err("An unexpected error occurred.", 500)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
