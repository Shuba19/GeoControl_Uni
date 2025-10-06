import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";

describe("Network API (e2e)", () => {
  let adminToken: string;
  let operatorToken: string;
  let viewerToken: string;

  beforeEach(async () => {
    await beforeAllE2e();
    adminToken = generateToken(TEST_USERS.admin);
    operatorToken = generateToken(TEST_USERS.operator);
    viewerToken = generateToken(TEST_USERS.viewer);
  });

  afterEach(async () => {
    await afterAllE2e();
  });

  // --- SUCCESS TESTS ---

  it("GET /networks - get all networks", async () => {
    const res = await request(app)
      .get("/api/v1/networks")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /networks - create a new network", async () => {
    const newNetwork = {
      code: "NET03",
      name: "Test Network",
      description: "A test network",
    };
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(newNetwork);
    expect(res.status).toBe(201);
  });

  it("GET /networks/:networkCode - get a network", async () => {
    const res = await request(app)
      .get("/api/v1/networks/NET01")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe("NET01");
  });

  it("PATCH /networks/:networkCode - update a network", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/NET01")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: "NET01", name: "Updated", description: "Updated desc" });
    expect(res.status).toBe(204);
  });

  it("DELETE /networks/:networkCode - delete a network", async () => {
    const res = await request(app)
      .delete("/api/v1/networks/NET01")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
  });

  // --- ERROR TESTS ---

  // GET all networks
  it("GET /networks - 401 Unauthorized (no token)", async () => {
    const res = await request(app).get("/api/v1/networks");
    expect(res.status).toBe(401);
  });

  // CREATE network
  it("POST /networks - 400 Bad Request (missing fields)", async () => {
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: "NET02" }); // missing name/description
    expect(res.status).toBe(400);
  });

  it("POST /networks - 401 Unauthorized (no token)", async () => {
    const res = await request(app)
      .post("/api/v1/networks")
      .send({ code: "NET02", name: "x", description: "x" });
    expect(res.status).toBe(401);
  });

  it("POST /networks - 403 Forbidden (viewer token)", async () => {
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ code: "NET02", name: "x", description: "x" });
    expect(res.status).toBe(403);
  });

  it("POST /networks - 409 Conflict (code already in use)", async () => {
    // First, create the network
    await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: "NET03", name: "Dup", description: "Dup" });
    // Try to create again
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: "NET03", name: "Dup", description: "Dup" });
    expect(res.status).toBe(409);
  });

  // GET a network
  it("GET /networks/:networkCode - 401 Unauthorized (no token)", async () => {
    const res = await request(app).get("/api/v1/networks/NET03");
    expect(res.status).toBe(401);
  });

  it("GET /networks/:networkCode - 404 Not Found", async () => {
    const res = await request(app)
      .get("/api/v1/networks/NOTFOUND")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  // UPDATE network
  it("PATCH /networks/:networkCode - 400 Bad Request (missing fields)", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/NET03")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({}); // missing all fields
    expect(res.status).toBe(400);
  });

  it("PATCH /networks/:networkCode - 401 Unauthorized (no token)", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/NET03")
      .send({ code: "NET03", name: "x", description: "x" });
    expect(res.status).toBe(401);
  });

  it("PATCH /networks/:networkCode - 403 Forbidden (viewer token)", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/NET03")
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ code: "NET03", name: "x", description: "x" });
    expect(res.status).toBe(403);
  });

  it("PATCH /networks/:networkCode - 404 Not Found", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/NOTFOUND")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: "NOTFOUND", name: "x", description: "x" });
    expect(res.status).toBe(404);
  });

  it("PATCH /networks/:networkCode - 409 Conflict (code already in use)", async () => {
    const res = await request(app)
      .patch("/api/v1/networks/NET02")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code: "NET01", name: "B", description: "B" });
    expect(res.status).toBe(409);
  });

  // DELETE network
  it("DELETE /networks/:networkCode - 401 Unauthorized (no token)", async () => {
    const res = await request(app)
      .delete("/api/v1/networks/NET04");
    expect(res.status).toBe(401);
  });

  it("DELETE /networks/:networkCode - 403 Forbidden (viewer token)", async () => {
    const res = await request(app)
      .delete("/api/v1/networks/NET04")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });

  it("DELETE /networks/:networkCode - 404 Not Found", async () => {
    const res = await request(app)
      .delete("/api/v1/networks/NOTFOUND")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

});
