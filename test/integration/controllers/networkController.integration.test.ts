import * as networkController from "@controllers/networkController";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";
import AppError from "@models/errors/AppError";
import { Network as NetworkDTO } from "@dto/Network";

jest.mock("@repositories/NetworkRepository");
jest.mock("@repositories/GatewayRepository");

describe("NetworkController integration", () => {
  beforeEach(() => {
    // Default mock implementation for all tests
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      getAllNetworks: jest.fn().mockResolvedValue([
        { code: "NET01", name: "A", description: "A" },
        { code: "NET02", name: "B", description: "B" }
      ]),
      getSingleNetworkByMacAdd: jest.fn().mockResolvedValue({
        code: "NET01", name: "A", description: "A"
      }),
      createNetwork: jest.fn().mockResolvedValue(undefined),
      updateNetwork: jest.fn().mockResolvedValue(undefined),
      deleteNetwork: jest.fn().mockResolvedValue(undefined)
    }));

    (GatewayRepository as jest.Mock).mockImplementation(() => ({
      getAllGatewaysByCode: jest.fn().mockResolvedValue([])
    }));

    jest.clearAllMocks();
  });

  // --- SUCCESS TESTS ---

  it("getAllNetworks: returns mapped networks", async () => {
    const result = await networkController.getAllNetworks();
    expect(result).toEqual([
      expect.objectContaining({ code: "NET01", name: "A", description: "A" }),
      expect.objectContaining({ code: "NET02", name: "B", description: "B" })
    ]);
    expect(result[0].gateways === undefined || Array.isArray(result[0].gateways)).toBe(true);
    expect(result[1].gateways === undefined || Array.isArray(result[1].gateways)).toBe(true);
  });

  it("getSingleNetworkByMacAdd: returns network", async () => {
    const result = await networkController.getSingleNetworkByMacAdd("NET01");
    expect(result.code).toBe("NET01");
  });

  it("createNetwork: calls repository with correct args", async () => {
    const mockCreate = jest.fn().mockResolvedValue(undefined);
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      createNetwork: mockCreate
    }));

    const dto = { code: "NET03", name: "C", description: "C" };
    await networkController.createNetwork(dto);
    expect(mockCreate).toHaveBeenCalledWith("NET03", "C", "C");
  });

  it("updateNetwork: calls repository with correct args", async () => {
    const mockUpdate = jest.fn().mockResolvedValue(undefined);
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      updateNetwork: mockUpdate
    }));

    const dto = { code: "NET03", name: "C", description: "C" };
    await networkController.updateNetwork("NET03", dto);
    expect(mockUpdate).toHaveBeenCalledWith("NET03", "NET03", "C", "C");
  });

  it("deleteNetwork: calls repository with correct code", async () => {
    const mockDelete = jest.fn().mockResolvedValue(undefined);
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      deleteNetwork: mockDelete
    }));

    await networkController.deleteNetwork("NET03");
    expect(mockDelete).toHaveBeenCalledWith("NET03");
  });

  // --- ERROR TESTS ---

  // getAllNetworks
  it("getAllNetworks: throws UnauthorizedError (401)", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      getAllNetworks: jest.fn().mockRejectedValue(new UnauthorizedError("Unauthorized"))
    }));
    await expect(networkController.getAllNetworks()).rejects.toThrow(UnauthorizedError);
  });

  it("getAllNetworks: throws AppError (500)", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      getAllNetworks: jest.fn().mockRejectedValue(new AppError("Internal", 500))
    }));
    await expect(networkController.getAllNetworks()).rejects.toThrow(AppError);
  });

  // createNetwork
  it("createNetwork: throws AppError (400)", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      createNetwork: jest.fn().mockRejectedValue(new AppError("Bad Request", 400))
    }));
    await expect(networkController.createNetwork({ code: "", name: "", description: "" })).rejects.toThrow(AppError);
  });

  it("createNetwork: throws UnauthorizedError (401)", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      createNetwork: jest.fn().mockRejectedValue(new UnauthorizedError("Unauthorized"))
    }));
    await expect(networkController.createNetwork({ code: "NET", name: "N", description: "D" })).rejects.toThrow(UnauthorizedError);
  });

  it("createNetwork: throws InsufficientRightsError (403)", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      createNetwork: jest.fn().mockRejectedValue(new InsufficientRightsError("Forbidden"))
    }));
    await expect(networkController.createNetwork({ code: "NET", name: "N", description: "D" })).rejects.toThrow(InsufficientRightsError);
  });

  it("createNetwork: throws ConflictError (409)", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      createNetwork: jest.fn().mockRejectedValue(new ConflictError("Conflict"))
    }));
    await expect(networkController.createNetwork({ code: "NET", name: "N", description: "D" })).rejects.toThrow(ConflictError);
  });

  it("createNetwork: throws AppError (500)", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      createNetwork: jest.fn().mockRejectedValue(new AppError("Internal", 500))
    }));
    await expect(networkController.createNetwork({ code: "NET", name: "N", description: "D" })).rejects.toThrow(AppError);
  });

  // getSingleNetworkByMacAdd
  it("getSingleNetworkByMacAdd: throws UnauthorizedError (401)", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      getSingleNetworkByMacAdd: jest.fn().mockRejectedValue(new UnauthorizedError("Unauthorized"))
    }));
    await expect(networkController.getSingleNetworkByMacAdd("NET01")).rejects.toThrow(UnauthorizedError);
  });

  it("getSingleNetworkByMacAdd: throws NotFoundError (404)", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      getSingleNetworkByMacAdd: jest.fn().mockRejectedValue(new NotFoundError("Not found"))
    }));
    await expect(networkController.getSingleNetworkByMacAdd("NOTFOUND")).rejects.toThrow(NotFoundError);
  });

  it("getSingleNetworkByMacAdd: throws AppError (500)", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      getSingleNetworkByMacAdd: jest.fn().mockRejectedValue(new AppError("Internal", 500))
    }));
    await expect(networkController.getSingleNetworkByMacAdd("NET01")).rejects.toThrow(AppError);
  });

  it("getSingleNetworkByMacAdd: maps DAO to DTO and omits unwanted fields", async () => {
    // Simulate a DAO with extra/internal fields
    const fakeNetworkDAO = {
      code: "NET01",
      name: "Main",
      description: "Main network",
      internalField: "should not be in DTO"
    };
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      getSingleNetworkByMacAdd: jest.fn().mockResolvedValue(fakeNetworkDAO)
    }));

    const result = await networkController.getSingleNetworkByMacAdd("NET01");
    expect(result).toEqual(
      expect.objectContaining({
        code: "NET01",
        name: "Main",
        description: "Main network"
      })
    );
    // Accept gateways as either undefined or an empty array
    expect(
      result.gateways === undefined || 
      (Array.isArray(result.gateways) && result.gateways.length === 0)
    ).toBe(true);
    expect(result).not.toHaveProperty("internalField");
  });

  // updateNetwork
  it("updateNetwork: throws AppError (400)", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      updateNetwork: jest.fn().mockRejectedValue(new AppError("Bad Request", 400))
    }));
    await expect(networkController.updateNetwork("NET01", { code: "", name: "", description: "" })).rejects.toThrow(AppError);
  });

  it("updateNetwork: throws UnauthorizedError (401)", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      updateNetwork: jest.fn().mockRejectedValue(new UnauthorizedError("Unauthorized"))
    }));
    await expect(networkController.updateNetwork("NET01", { code: "NET01", name: "N", description: "D" })).rejects.toThrow(UnauthorizedError);
  });

  it("updateNetwork: throws InsufficientRightsError (403)", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      updateNetwork: jest.fn().mockRejectedValue(new InsufficientRightsError("Forbidden"))
    }));
    await expect(networkController.updateNetwork("NET01", { code: "NET01", name: "N", description: "D" })).rejects.toThrow(InsufficientRightsError);
  });

  it("updateNetwork: throws NotFoundError (404)", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      updateNetwork: jest.fn().mockRejectedValue(new NotFoundError("Not found"))
    }));
    await expect(networkController.updateNetwork("NOTFOUND", { code: "NOTFOUND", name: "N", description: "D" })).rejects.toThrow(NotFoundError);
  });

  it("updateNetwork: throws ConflictError (409)", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      updateNetwork: jest.fn().mockRejectedValue(new ConflictError("Conflict"))
    }));
    await expect(networkController.updateNetwork("NET01", { code: "NET02", name: "N", description: "D" })).rejects.toThrow(ConflictError);
  });

  it("updateNetwork: throws AppError (500)", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      updateNetwork: jest.fn().mockRejectedValue(new AppError("Internal", 500))
    }));
    await expect(networkController.updateNetwork("NET01", { code: "NET01", name: "N", description: "D" })).rejects.toThrow(AppError);
  });

  // deleteNetwork
  it("deleteNetwork: throws UnauthorizedError (401)", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      deleteNetwork: jest.fn().mockRejectedValue(new UnauthorizedError("Unauthorized"))
    }));
    await expect(networkController.deleteNetwork("NET01")).rejects.toThrow(UnauthorizedError);
  });

  it("deleteNetwork: throws InsufficientRightsError (403)", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      deleteNetwork: jest.fn().mockRejectedValue(new InsufficientRightsError("Forbidden"))
    }));
    await expect(networkController.deleteNetwork("NET01")).rejects.toThrow(InsufficientRightsError);
  });

  it("deleteNetwork: throws NotFoundError (404)", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      deleteNetwork: jest.fn().mockRejectedValue(new NotFoundError("Not found"))
    }));
    await expect(networkController.deleteNetwork("NOTFOUND")).rejects.toThrow(NotFoundError);
  });

  it("deleteNetwork: throws AppError (500)", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      deleteNetwork: jest.fn().mockRejectedValue(new AppError("Internal", 500))
    }));
    await expect(networkController.deleteNetwork("NET01")).rejects.toThrow(AppError);
  });

  it("getAllNetworks: maps DAOs to DTOs and omits unwanted fields", async () => {
    const fakeNetworksDAO = [
      { code: "NET01", name: "A", description: "A", secret: "x" },
      { code: "NET02", name: "B", description: "B", secret: "y" }
    ];
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      getAllNetworks: jest.fn().mockResolvedValue(fakeNetworksDAO)
    }));

    const result = await networkController.getAllNetworks();
    expect(result[0]).toEqual(
      expect.objectContaining({ code: "NET01", name: "A", description: "A" })
    );
    expect(result[1]).toEqual(
      expect.objectContaining({ code: "NET02", name: "B", description: "B" })
    );
    // Accept gateways as either undefined or an empty array for each network
    expect(
      result[0].gateways === undefined || 
      (Array.isArray(result[0].gateways) && result[0].gateways.length === 0)
    ).toBe(true);
    expect(
      result[1].gateways === undefined || 
      (Array.isArray(result[1].gateways) && result[1].gateways.length === 0)
    ).toBe(true);
    expect(result.every(n => !("secret" in n))).toBe(true);
  });
});