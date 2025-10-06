import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as userController from "@controllers/userController";
import { UserType } from "@models/UserType";
import { User as UserDTO } from "@dto/User";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";
import AppError from "@models/errors/AppError";

jest.mock("@services/authService");
jest.mock("@controllers/userController");

describe("UserRoutes integration", () => {
  const token = "Bearer faketoken";

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- GET ALL USERS ---
  it("get all users", async () => {
    const mockUsers: UserDTO[] = [
      { username: "admin", type: UserType.Admin },
      { username: "viewer", type: UserType.Viewer }
    ];

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (userController.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

    const response = await request(app)
      .get("/api/v1/users")
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUsers);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin
    ]);
    expect(userController.getAllUsers).toHaveBeenCalled();
  });

  it("get all users: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token provided");
    });

    const response = await request(app)
      .get("/api/v1/users")
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("get all users: 403 InsufficientRightsError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden: Insufficient rights");
    });

    const response = await request(app)
      .get("/api/v1/users")
      .set("Authorization", token);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Insufficient rights/);
  });

  it("get all users: 500 AppError", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (userController.getAllUsers as jest.Mock).mockImplementation(() => {
      throw new AppError("Internal error", 500);
    });

    const response = await request(app)
      .get("/api/v1/users")
      .set("Authorization", token);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/Internal error/);
  });

  // --- GET USER BY USERNAME ---
  it("get user by username", async () => {
    const mockUser: UserDTO = { username: "admin", type: UserType.Admin };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (userController.getUser as jest.Mock).mockResolvedValue(mockUser);

    const response = await request(app)
      .get("/api/v1/users/admin")
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUser);
    expect(userController.getUser).toHaveBeenCalledWith("admin");
  });

  it("get user by username: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized");
    });

    const response = await request(app)
      .get("/api/v1/users/admin")
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("get user by username: 403 InsufficientRightsError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden");
    });

    const response = await request(app)
      .get("/api/v1/users/admin")
      .set("Authorization", token);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Forbidden/);
  });

  it("get user by username: 404 NotFoundError", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (userController.getUser as jest.Mock).mockImplementation(() => {
      throw new NotFoundError("Not found");
    });

    const response = await request(app)
      .get("/api/v1/users/notfound")
      .set("Authorization", token);

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/Not found/);
  });

  it("get user by username: 500 AppError", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (userController.getUser as jest.Mock).mockImplementation(() => {
      throw new AppError("Internal error", 500);
    });

    const response = await request(app)
      .get("/api/v1/users/admin")
      .set("Authorization", token);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/Internal error/);
  });

  // --- CREATE USER ---
  it("create user", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (userController.createUser as jest.Mock).mockResolvedValue(undefined);

    const newUser = { username: "newuser", password: "pw", type: UserType.Viewer };

    const response = await request(app)
      .post("/api/v1/users")
      .set("Authorization", token)
      .send(newUser);

    expect(response.status).toBe(201);
    expect(userController.createUser).toHaveBeenCalledWith(newUser);
  });

  it("create user: 400 BadRequest", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (userController.createUser as jest.Mock).mockImplementation(() => {
      throw new AppError("Bad request", 400);
    });

    const response = await request(app)
      .post("/api/v1/users")
      .set("Authorization", token)
      .send({ username: "" }); // invalid

    expect(response.status).toBe(400);
  });

  it("create user: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized");
    });

    const response = await request(app)
      .post("/api/v1/users")
      .set("Authorization", "Bearer invalid")
      .send({ username: "x", password: "x", type: UserType.Viewer });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("create user: 403 InsufficientRightsError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden");
    });

    const response = await request(app)
      .post("/api/v1/users")
      .set("Authorization", token)
      .send({ username: "x", password: "x", type: UserType.Viewer });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Forbidden/);
  });

  it("create user: 409 ConflictError", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (userController.createUser as jest.Mock).mockImplementation(() => {
      throw new ConflictError("Conflict");
    });

    const response = await request(app)
      .post("/api/v1/users")
      .set("Authorization", token)
      .send({ username: "admin", password: "pw", type: UserType.Admin });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/Conflict/);
  });

  it("create user: 500 AppError", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (userController.createUser as jest.Mock).mockImplementation(() => {
      throw new AppError("Internal error", 500);
    });

    const response = await request(app)
      .post("/api/v1/users")
      .set("Authorization", token)
      .send({ username: "x", password: "x", type: UserType.Viewer });

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/Internal error/);
  });

  // --- DELETE USER ---
  it("delete user", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (userController.deleteUser as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .delete("/api/v1/users/admin")
      .set("Authorization", token);

    expect(response.status).toBe(204);
    expect(userController.deleteUser).toHaveBeenCalledWith("admin");
  });

  it("delete user: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized");
    });

    const response = await request(app)
      .delete("/api/v1/users/admin")
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("delete user: 403 InsufficientRightsError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden");
    });

    const response = await request(app)
      .delete("/api/v1/users/admin")
      .set("Authorization", token);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Forbidden/);
  });

  it("delete user: 404 NotFoundError", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (userController.deleteUser as jest.Mock).mockImplementation(() => {
      throw new NotFoundError("Not found");
    });

    const response = await request(app)
      .delete("/api/v1/users/notfound")
      .set("Authorization", token);

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/Not found/);
  });

  it("delete user: 500 AppError", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (userController.deleteUser as jest.Mock).mockImplementation(() => {
      throw new AppError("Internal error", 500);
    });

    const response = await request(app)
      .delete("/api/v1/users/admin")
      .set("Authorization", token);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/Internal error/);
  });
});
   