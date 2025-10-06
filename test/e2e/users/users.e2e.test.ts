import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";

describe("User API (e2e)", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  //Get all users e2e test
  it("GET /users - get all users", async () => {
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);

    const usernames = res.body.map((u: any) => u.username).sort();
    const types = res.body.map((u: any) => u.type).sort();

    expect(usernames).toEqual(["admin", "operator", "viewer"]);
    expect(types).toEqual(["admin", "operator", "viewer"]);
  });

  //Get user by username e2e test
  it("GET /users/:username - get user by username", async () => {
    const res = await request(app)
      .get("/api/v1/users/admin")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe("admin");
    expect(res.body.type).toBe("admin");
    expect(res.body).not.toHaveProperty("password");
  });

   //Create user e2e test
  it("POST /users - create a new user", async () => {
    const newUser = {
      username: "testuser",
      password: "testpass",
      type: "viewer"
    };

    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send(newUser);

    expect(res.status).toBe(201);
  });

  //Delete user e2e test
  it("DELETE /users/:username - delete user", async () => {
    const res = await request(app)
      .delete("/api/v1/users/testuser")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);  
  });

  // --- ERROR TESTS ---

  // GET all users
  it("GET /users - 401 Unauthorized (no token)", async () => {
    const res = await request(app).get("/api/v1/users");
    expect(res.status).toBe(401);
  });

  it("GET /users - 403 Forbidden (operator token)", async () => {
    const operatorToken = generateToken(TEST_USERS.operator);
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${operatorToken}`);
    expect(res.status).toBe(403);
  });

  // CREATE user
  it("POST /users - 400 Bad Request (missing fields)", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "incomplete" });
    expect(res.status).toBe(400);
  });

  it("POST /users - 401 Unauthorized (no token)", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .send({ username: "test", password: "pw", type: "viewer" });
    expect(res.status).toBe(401);
  });

  it("POST /users - 403 Forbidden (operator token)", async () => {
    const operatorToken = generateToken(TEST_USERS.operator);
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${operatorToken}`)
      .send({ username: "test", password: "pw", type: "viewer" });
    expect(res.status).toBe(403);
  });

  it("POST /users - 409 Conflict (user exists)", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "admin", password: "pw", type: "admin" });
    expect(res.status).toBe(409);
  });

  // GET user by username
  it("GET /users/:username - 401 Unauthorized (no token)", async () => {
    const res = await request(app).get("/api/v1/users/admin");
    expect(res.status).toBe(401);
  });

  it("GET /users/:username - 403 Forbidden (operator token)", async () => {
    const operatorToken = generateToken(TEST_USERS.operator);
    const res = await request(app)
      .get("/api/v1/users/admin")
      .set("Authorization", `Bearer ${operatorToken}`);
    expect(res.status).toBe(403);
  });

  it("GET /users/:username - 404 Not Found", async () => {
    const res = await request(app)
      .get("/api/v1/users/notarealuser")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  // DELETE user
  it("DELETE /users/:username - 401 Unauthorized (no token)", async () => {
    const res = await request(app)
      .delete("/api/v1/users/admin");
    expect(res.status).toBe(401);
  });

  it("DELETE /users/:username - 403 Forbidden (operator token)", async () => {
    const operatorToken = generateToken(TEST_USERS.operator);
    const res = await request(app)
      .delete("/api/v1/users/admin")
      .set("Authorization", `Bearer ${operatorToken}`);
    expect(res.status).toBe(403);
  });

  it("DELETE /users/:username - 404 Not Found", async () => {
    const res = await request(app)
      .delete("/api/v1/users/notarealuser")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  // --- SERVER ERROR TESTS ---

  // GET all users - 500 Internal Server Error
  it("GET /users - 500 Internal Server Error", async () => {
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .set("X-Force-Error", "true"); 
    expect(res.status).toBe(500);
  });

  // GET user by username - 500 Internal Server Error
  it("GET /users/:username - 500 Internal Server Error", async () => {
    const res = await request(app)
      .get("/api/v1/users/admin")
      .set("Authorization", `Bearer ${token}`)
      .set("X-Force-Error", "true");
    expect(res.status).toBe(500);
  });

  // POST user - 500 Internal Server Error
  it("POST /users - 500 Internal Server Error", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .set("X-Force-Error", "true")
      .send({ username: "erruser", password: "pw", type: "viewer" });
    expect(res.status).toBe(500);
  });

  // DELETE user - 500 Internal Server Error
  it("DELETE /users/:username - 500 Internal Server Error", async () => {
    const res = await request(app)
      .delete("/api/v1/users/testuser")
      .set("Authorization", `Bearer ${token}`)
      .set("X-Force-Error", "true");
    expect(res.status).toBe(500);
  });
});

