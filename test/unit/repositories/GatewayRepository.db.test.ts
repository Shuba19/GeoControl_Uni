import { GatewayRepository } from "@repositories/GatewayRepository";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";
import {
    initializeTestDataSource,
    closeTestDataSource,
    TestDataSource
} from "@test/setup/test-datasource";

beforeAll(async () => {
    await initializeTestDataSource();
});
afterAll(async () => {
    await closeTestDataSource();
});
beforeEach(async () => {
    await TestDataSource.getRepository(GatewayDAO).clear();
    await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("GatewayRepository (db)", () => {
    let repo: GatewayRepository;
    let netRepo: NetworkRepository;

    beforeEach(async () => {
        repo = new GatewayRepository();
        netRepo = new NetworkRepository();
        // Crea la rete necessaria per la relazione
        await netRepo.createNetwork("netCode", "Network 1", "Description 1");
    });

    it("createGateway", async () => {
        const gw = await repo.createGateway("gw1", "Gateway 1", "Description 1", "netCode");
        expect(gw).toBeInstanceOf(GatewayDAO);
        expect(gw.macAddress).toBe("gw1");
        expect(gw.name).toBe("Gateway 1");
        expect(gw.description).toBe("Description 1");
    });

    it("getSingleGatewayByMacAdd", async () => {
        await repo.createGateway("gw2", "Gateway 2", "Desc 2", "netCode");
        const gw = await repo.getSingleGatewayByMacAdd("gw2");
        expect(gw).toBeInstanceOf(GatewayDAO);
        expect(gw.macAddress).toBe("gw2");
    });

    it("getAllGatewaysByCode", async () => {
        await repo.createGateway("gw3", "Gateway 3", "Desc 3", "netCode");
        await repo.createGateway("gw4", "Gateway 4", "Desc 4", "netCode");
        const gateways = await repo.getAllGatewaysByCode("netCode");
        expect(gateways.length).toBe(2);
        expect(gateways.map(g => g.macAddress)).toEqual(expect.arrayContaining(["gw3", "gw4"]));
    });

    it("deleteGateway", async () => {
        await repo.createGateway("gw5", "Gateway 5", "Desc 5", "netCode");
        const gw = await repo.getSingleGatewayByMacAdd("gw5");
        expect(gw).toBeDefined();
        await repo.deleteGateway("gw5");
        await expect(repo.getSingleGatewayByMacAdd("gw5")).rejects.toThrow(NotFoundError);
    });

    it("updateGateway", async () => {
        await repo.createGateway("gw6", "Gateway 6", "Desc 6", "netCode");
        const updated = await repo.updateGateway("gw6", "gw6-updated", "Updated Gateway", "Updated Desc");
        expect(updated.macAddress).toBe("gw6-updated");
        expect(updated.name).toBe("Updated Gateway");
        expect(updated.description).toBe("Updated Desc");
    });

    it("deleting non existing gw", async () => {
        await expect(repo.deleteGateway("Fakegw")).rejects.toThrow(NotFoundError);
    });
    it("updating non existing gw", async () => {
        await expect(repo.updateGateway("Fakegw", "Fakegw", "Updated Name", "Updated Desc")).rejects.toThrow(NotFoundError);
    });
    it("using an already used macAdd", async () => {
        await repo.createGateway("gw7", "Gateway 7", "Desc 7", "netCode");
        await expect(repo.createGateway("gw7", "Gateway 8", "Desc 8", "netCode")).rejects.toThrow(ConflictError);
    });
    it("update using an already used macAdd", async () => {
        await repo.createGateway("gw8", "Gateway 8", "Desc 8", "netCode");
        await repo.createGateway("gw9", "Gateway 9", "Desc 9", "netCode");
        await expect(repo.updateGateway("gw8", "gw9", "Updated Name", "Updated Desc")).rejects.toThrow(ConflictError);
    });
    it("getSingleGatewayByMacAdd not found", async () => {
        await expect(repo.getSingleGatewayByMacAdd("nonExistentMac")).rejects.toThrow(NotFoundError);
    });
    it("create with non-existing network code", async () => {
        await expect(repo.createGateway("gw10", "Gateway 10", "Desc 10", "fakeCode")).rejects.toThrow(NotFoundError);
    });
});