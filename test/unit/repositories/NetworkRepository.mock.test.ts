import { NetworkRepository } from "@repositories/NetworkRepository";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";

const mockFind = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();
const mockUpdate = jest.fn();

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: () => ({
      find: mockFind,
      save: mockSave,
      remove: mockRemove,
      update: mockUpdate
    })
  }
}));

describe("NetworkRepository: mocked database", () => {
  const repo = new NetworkRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("createNetwork: creates a network", async () => {
    mockFind.mockResolvedValue([]);
    const savedNetwork = new NetworkDAO();
    savedNetwork.code = "NET01";
    savedNetwork.name = "Main";
    savedNetwork.description = "Main network";
    mockSave.mockResolvedValue(savedNetwork);

    const result = await repo.createNetwork("NET01", "Main", "Main network");

    expect(result).toBeInstanceOf(NetworkDAO);
    expect(result.code).toBe("NET01");
    expect(result.name).toBe("Main");
    expect(result.description).toBe("Main network");
    expect(mockSave).toHaveBeenCalledWith({
      code: "NET01",
      name: "Main",
      description: "Main network"
    });
  });

  it("createNetwork: conflict", async () => {
    const existingNetwork = new NetworkDAO();
    existingNetwork.code = "NET01";
    existingNetwork.name = "Main";
    existingNetwork.description = "Main network";
    mockFind.mockResolvedValue([existingNetwork]);

    await expect(
      repo.createNetwork("NET01", "Another", "Another network")
    ).rejects.toThrow(ConflictError);
  });

  it("getAllNetworks: returns all networks", async () => {
    const net1 = new NetworkDAO();
    net1.code = "NET01";
    net1.name = "Main";
    net1.description = "Main network";

    const net2 = new NetworkDAO();
    net2.code = "NET02";
    net2.name = "Backup";
    net2.description = "Backup network";

    mockFind.mockResolvedValue([net1, net2]);

    const networks = await repo.getAllNetworks();
    expect(networks).toEqual([net1, net2]);
    expect(mockFind).toHaveBeenCalled();
  });

  it("getSingleNetworkByMacAdd: returns network", async () => {
    const foundNetwork = new NetworkDAO();
    foundNetwork.code = "NET01";
    foundNetwork.name = "Main";
    foundNetwork.description = "Main network";

    mockFind.mockResolvedValue([foundNetwork]);

    const result = await repo.getSingleNetworkByMacAdd("NET01");
    expect(result).toBe(foundNetwork);
    expect(result.code).toBe("NET01");
  });

  it("getSingleNetworkByMacAdd: not found", async () => {
    mockFind.mockResolvedValue([]);

    await expect(repo.getSingleNetworkByMacAdd("NOTFOUND")).rejects.toThrow(
      NotFoundError
    );
  });

  it("updateNetwork: updates a network", async () => {
    mockUpdate.mockResolvedValue({ affected: 1 });
    const updatedNetwork = new NetworkDAO();
    updatedNetwork.code = "NET01";
    updatedNetwork.name = "Updated";
    updatedNetwork.description = "Updated network";
    mockFind.mockResolvedValue([updatedNetwork]);

    const result = await repo.updateNetwork("NET01", "NET01", "Updated", "Updated network");
    expect(result).toBe(updatedNetwork);
    expect(mockUpdate).toHaveBeenCalledWith(
      { code: "NET01" },
      { code: "NET01", name: "Updated", description: "Updated network" }
    );
  });

  it("updateNetwork: not found", async () => {
    mockUpdate.mockResolvedValue({ affected: 0 });
    mockFind.mockResolvedValue([]);
    await expect(
      repo.updateNetwork("NOTFOUND", "NETX", "Name", "Desc")
    ).rejects.toThrow(NotFoundError);
  });

  it("deleteNetwork: removes network", async () => {
    const net = new NetworkDAO();
    net.code = "NET01";
    net.name = "Main";
    net.description = "Main network";
    mockFind.mockResolvedValue([net]);
    mockRemove.mockResolvedValue(undefined);

    await repo.deleteNetwork("NET01");

    expect(mockRemove).toHaveBeenCalledWith(net);
  });

  it("deleteNetwork: not found", async () => {
    mockFind.mockResolvedValue([]);

    await expect(repo.deleteNetwork("NOTFOUND")).rejects.toThrow(NotFoundError);
  });
});
