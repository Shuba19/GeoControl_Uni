import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as networkController from "@controllers/networkController";
import { UserType } from "@models/UserType";
import { Network as NetworkDTO } from "@dto/Network";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";
import AppError from "@models/errors/AppError";

jest.mock("@services/authService");
jest.mock("@controllers/networkController");

describe("NetworkRoutes integration", () => {
  const token = "Bearer faketoken";

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- GET ALL NETWORKS ---
  it("get all networks", async () => {
    const mockNetworks: NetworkDTO[] = [
      { code: "NET01", name: "A", description: "A" },
      { code: "NET02", name: "B", description: "B" }
    ];

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.getAllNetworks as jest.Mock).mockResolvedValue(mockNetworks);

    const response = await request(app)
      .get("/api/v1/networks")
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockNetworks);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin, UserType.Operator, UserType.Viewer
    ]);
    expect(networkController.getAllNetworks).toHaveBeenCalled();
  });

  it("get all networks: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token provided");
    });

    const response = await request(app)
      .get("/api/v1/networks")
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("get all networks: 500 AppError", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.getAllNetworks as jest.Mock).mockImplementation(() => {
      throw new AppError("Internal error", 500);
    });

    const response = await request(app)
      .get("/api/v1/networks")
      .set("Authorization", token);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/Internal error/);
  });

  // --- GET NETWORK BY CODE ---
  it("get network by code", async () => {
    const mockNetwork: NetworkDTO = { code: "NET01", name: "A", description: "A" };

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.getSingleNetworkByMacAdd as jest.Mock).mockResolvedValue(mockNetwork);

    const response = await request(app)
      .get("/api/v1/networks/NET01")
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockNetwork);
    expect(networkController.getSingleNetworkByMacAdd).toHaveBeenCalledWith("NET01");
  });

  it("get network by code: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized");
    });

    const response = await request(app)
      .get("/api/v1/networks/NET01")
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("get network by code: 404 NotFoundError", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.getSingleNetworkByMacAdd as jest.Mock).mockImplementation(() => {
      throw new NotFoundError("Not found");
    });

    const response = await request(app)
      .get("/api/v1/networks/NOTFOUND")
      .set("Authorization", token);

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/Not found/);
  });

  it("get network by code: 500 AppError", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.getSingleNetworkByMacAdd as jest.Mock).mockImplementation(() => {
      throw new AppError("Internal error", 500);
    });

    const response = await request(app)
      .get("/api/v1/networks/NET01")
      .set("Authorization", token);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/Internal error/);
  });

  // --- CREATE NETWORK ---
  it("create network", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.createNetwork as jest.Mock).mockResolvedValue(undefined);

    const newNetwork = { code: "NET03", name: "C", description: "C" };

    const response = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", token)
      .send(newNetwork);

    expect(response.status).toBe(201);
    expect(networkController.createNetwork).toHaveBeenCalledWith(newNetwork);
  });

  it("create network: 400 BadRequest", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.createNetwork as jest.Mock).mockImplementation(() => {
      throw new AppError("Bad request", 400);
    });

    const response = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", token)
      .send({ code: "" }); // invalid

    expect(response.status).toBe(400);
  });

  it("create network: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized");
    });

    const response = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", "Bearer invalid")
      .send({ code: "NET", name: "N", description: "D" });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("create network: 403 InsufficientRightsError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden");
    });

    const response = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", token)
      .send({ code: "NET", name: "N", description: "D" });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Forbidden/);
  });

  it("create network: 409 ConflictError", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.createNetwork as jest.Mock).mockImplementation(() => {
      throw new ConflictError("Conflict");
    });

    const response = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", token)
      .send({ code: "NET01", name: "A", description: "A" });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/Conflict/);
  });

  it("create network: 500 AppError", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.createNetwork as jest.Mock).mockImplementation(() => {
      throw new AppError("Internal error", 500);
    });

    const response = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", token)
      .send({ code: "NET", name: "N", description: "D" });

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/Internal error/);
  });

  // --- UPDATE NETWORK ---
  it("update network", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.updateNetwork as jest.Mock).mockResolvedValue(undefined);

    const updateNetwork = { code: "NET03", name: "C", description: "C" };

    const response = await request(app)
      .patch("/api/v1/networks/NET03")
      .set("Authorization", token)
      .send(updateNetwork);

    expect(response.status).toBe(204);
    expect(networkController.updateNetwork).toHaveBeenCalledWith("NET03", updateNetwork);
  });

  it("update network: 400 BadRequest", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.updateNetwork as jest.Mock).mockImplementation(() => {
      throw new AppError("Bad request", 400);
    });

    const response = await request(app)
      .patch("/api/v1/networks/NET03")
      .set("Authorization", token)
      .send({ code: "" }); // invalid

    expect(response.status).toBe(400);
  });

  it("update network: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized");
    });

    const response = await request(app)
      .patch("/api/v1/networks/NET03")
      .set("Authorization", "Bearer invalid")
      .send({ code: "NET03", name: "C", description: "C" });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("update network: 403 InsufficientRightsError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden");
    });

    const response = await request(app)
      .patch("/api/v1/networks/NET03")
      .set("Authorization", token)
      .send({ code: "NET03", name: "C", description: "C" });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Forbidden/);
  });

  it("update network: 404 NotFoundError", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.updateNetwork as jest.Mock).mockImplementation(() => {
      throw new NotFoundError("Not found");
    });

    const response = await request(app)
      .patch("/api/v1/networks/NOTFOUND")
      .set("Authorization", token)
      .send({ code: "NOTFOUND", name: "C", description: "C" });

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/Not found/);
  });

  it("update network: 409 ConflictError", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.updateNetwork as jest.Mock).mockImplementation(() => {
      throw new ConflictError("Conflict");
    });

    const response = await request(app)
      .patch("/api/v1/networks/NET03")
      .set("Authorization", token)
      .send({ code: "NET01", name: "C", description: "C" });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/Conflict/);
  });

  it("update network: 500 AppError", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.updateNetwork as jest.Mock).mockImplementation(() => {
      throw new AppError("Internal error", 500);
    });

    const response = await request(app)
      .patch("/api/v1/networks/NET03")
      .set("Authorization", token)
      .send({ code: "NET03", name: "C", description: "C" });

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/Internal error/);
  });

  // --- DELETE NETWORK ---
  it("delete network", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.deleteNetwork as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .delete("/api/v1/networks/NET03")
      .set("Authorization", token);

    expect(response.status).toBe(204);
    expect(networkController.deleteNetwork).toHaveBeenCalledWith("NET03");
  });

  it("delete network: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized");
    });

    const response = await request(app)
      .delete("/api/v1/networks/NET03")
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("delete network: 403 InsufficientRightsError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden");
    });

    const response = await request(app)
      .delete("/api/v1/networks/NET03")
      .set("Authorization", token);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Forbidden/);
  });

  it("delete network: 404 NotFoundError", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.deleteNetwork as jest.Mock).mockImplementation(() => {
      throw new NotFoundError("Not found");
    });

    const response = await request(app)
      .delete("/api/v1/networks/NOTFOUND")
      .set("Authorization", token);

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/Not found/);
  });

  it("delete network: 500 AppError", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.deleteNetwork as jest.Mock).mockImplementation(() => {
      throw new AppError("Internal error", 500);
    });

    const response = await request(app)
      .delete("/api/v1/networks/NET03")
      .set("Authorization", token);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/Internal error/);
  });
});
