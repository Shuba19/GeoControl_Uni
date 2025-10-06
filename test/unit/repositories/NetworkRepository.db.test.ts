import { NetworkRepository } from "@repositories/NetworkRepository";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

beforeAll(async () => {
  await initializeTestDataSource();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("NetworkRepository: SQLite in-memory", () => {
  const repo = new NetworkRepository();

  it("createNetwork: creates a network", async () => {
    const network = await repo.createNetwork("NET01", "Main", "Main network");
    expect(network).toMatchObject({
      code: "NET01",
      name: "Main",
      description: "Main network"
    });

    const found = await repo.getSingleNetworkByMacAdd("NET01");
    expect(found.code).toBe("NET01");
  });

  it("getAllNetworks: returns all networks", async () => {
    await repo.createNetwork("NET01", "Main", "Main network");
    await repo.createNetwork("NET02", "Backup", "Backup network");

    const networks = await repo.getAllNetworks();
    const codes = networks.map(n => n.code).sort();
    expect(codes).toEqual(["NET01", "NET02"]);
  });

  it("getSingleNetworkByMacAdd: returns network", async () => {
    await repo.createNetwork("NET03", "Test", "Test network");
    const network = await repo.getSingleNetworkByMacAdd("NET03");
    expect(network).toMatchObject({
      code: "NET03",
      name: "Test",
      description: "Test network"
    });
  });

  it("getSingleNetworkByMacAdd: not found", async () => {
    await expect(repo.getSingleNetworkByMacAdd("NOTFOUND")).rejects.toThrow(NotFoundError);
  });

  it("createNetwork: conflict", async () => {
    await repo.createNetwork("NET01", "Main", "Main network");
    await expect(
      repo.createNetwork("NET01", "Duplicate", "Duplicate network")
    ).rejects.toThrow(ConflictError);
  });

  it("updateNetwork: updates a network", async () => {
    await repo.createNetwork("NET04", "Old", "Old network");
    const updated = await repo.updateNetwork("NET04", "NET04", "Updated", "Updated network");
    expect(updated).toMatchObject({
      code: "NET04",
      name: "Updated",
      description: "Updated network"
    });
  });

  it("updateNetwork: not found", async () => {
    await expect(
      repo.updateNetwork("NOTFOUND", "NETX", "Name", "Desc")
    ).rejects.toThrow(NotFoundError);
  });

  it("deleteNetwork: removes network", async () => {
    await repo.createNetwork("NET05", "ToDelete", "To be deleted");
    const net  = await repo.getSingleNetworkByMacAdd("NET05");
    expect(net).toBeDefined();
    await repo.deleteNetwork("NET05");
    await expect(repo.getSingleNetworkByMacAdd("NET05")).rejects.toThrow(NotFoundError);
  });

  it("deleteNetwork: not found", async () => {
    await expect(repo.deleteNetwork("NOTFOUND")).rejects.toThrow(NotFoundError);
  });
});
