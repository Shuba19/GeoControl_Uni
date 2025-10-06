import { NetworkRepository } from "@repositories/NetworkRepository";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";
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

describe("GatewayRepository: mocked database", () => {
    const repo = new GatewayRepository();

    beforeEach(() => {
        jest.clearAllMocks();

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
    });

    //get
    it("get gateways by network code", async () => {
        jest.spyOn(NetworkRepository.prototype, "getSingleNetworkByMacAdd").mockImplementation((code: string) => {
            const net = new NetworkDAO();
            net.code = code;
            net.name = "net_1";
            net.description = "Network 1";
            return Promise.resolve(net);
        }
        );

        const net = new NetworkDAO();
        net.code = "netCode";
        net.name = "net_1";
        net.description = "Network 1";

        const gw1 = new GatewayDAO();
        gw1.macAddress = "gw:mac1";
        gw1.name = "Gateway 1";
        gw1.description = "Description 1";
        gw1.code = "gw_code_1";
        gw1.network = net;

        const gw2 = new GatewayDAO();
        gw2.macAddress = "gw:mac2";
        gw2.name = "Gateway 2";
        gw2.description = "Description 2";
        gw2.code = "gw_code_2";
        gw2.network = net;

        const mockGateways = [gw1, gw2];
        mockFind.mockResolvedValue(mockGateways);

        const result = await repo.getAllGatewaysByCode("netCode");
        expect(result).toHaveLength(2);
        expect(result[0]).toBeInstanceOf(GatewayDAO);
        expect(result[0].macAddress).toBe("gw:mac1");
        expect(result[1]).toBeInstanceOf(GatewayDAO);
        expect(result[1].macAddress).toBe("gw:mac2");
    });
    it("get single gateway by mac address", async () => {
        const mockGateway = new GatewayDAO();
        mockGateway.macAddress = "gw:mac";
        mockGateway.name = "Gateway 1";
        mockGateway.description = "Description 1";
        mockGateway.code = "netCode";
        mockGateway.network = new NetworkDAO();
        mockGateway.network.code = "netCode";
        mockGateway.network.name = "net_1";
        mockGateway.network.description = "Network 1";
        mockFind.mockResolvedValue([mockGateway]);
        const result = await repo.getSingleGatewayByMacAdd("gw:mac");
        expect(result).toBeInstanceOf(GatewayDAO);
        expect(result.macAddress).toBe("gw:mac");
    });

    it("get single gateway by mac address not found", async () => {
        mockFind.mockResolvedValue([]);
        await expect(repo.getSingleGatewayByMacAdd("gw:mac")).rejects.toThrow(NotFoundError);
    });

    //create
    it("create gateway", async () => {
        jest.spyOn(NetworkRepository.prototype, "getSingleNetworkByMacAdd").mockImplementation((code: string) => {
            const net = new NetworkDAO();
            net.code = code;
            net.name = "net_1";
            net.description = "Network 1";
            return Promise.resolve(net);
        });

        jest.spyOn(GatewayRepository.prototype, "getSingleGatewayByMacAdd").mockImplementation(async (mac) => {
            const gw = new GatewayDAO();
            gw.macAddress = mac;
            gw.name = "gw_1";
            gw.description = "gw_desc";
            gw.code = "gw_code";
            gw.network = new NetworkDAO();
            gw.network.code = "netCode";
            gw.network.name = "net_1";
            gw.network.description = "Network 1";
            return gw;
        });

        const networkRepo = new NetworkRepository();
        const network = await networkRepo.getSingleNetworkByMacAdd("netCode");
        if (!network) {
            throw new Error("NetworkNotFoundError");
        }

        mockFind.mockResolvedValue([]);
        const savedGateway = new GatewayDAO();
        savedGateway.macAddress = "gw:mac";
        savedGateway.name = "gw_1";
        savedGateway.description = "gw_desc";
        savedGateway.code = "netCode";
        savedGateway.network = new NetworkDAO();
        savedGateway.network.code = "netCode";
        savedGateway.network.name = "net_1";
        savedGateway.network.description = "Network 1";
        mockSave.mockResolvedValue(savedGateway);

        const result = await repo.createGateway("gw:mac", "gw_1", "gw_desc", "netCode");

        expect(result).toBeInstanceOf(GatewayDAO);
        expect(result.macAddress).toBe("gw:mac");
        expect(result.name).toBe("gw_1");
        expect(result.description).toBe("gw_desc");
        expect(result.code).toBe("gw_code");
        expect(result.network.code).toBe("netCode");
        expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
            macAddress: "gw:mac",
            name: "gw_1",
            description: "gw_desc"
        }));
    });
    it("create gateway - ConflictError", async () => {
        jest.spyOn(NetworkRepository.prototype, "getSingleNetworkByMacAdd").mockImplementation((code: string) => {
            const net = new NetworkDAO();
            net.code = code;
            net.name = "net_1";
            net.description = "Network 1";
            return Promise.resolve(net);
        });

        jest.spyOn(GatewayRepository.prototype, "getSingleGatewayByMacAdd").mockImplementation(async (mac) => {
            const gw = new GatewayDAO();
            gw.macAddress = mac;
            gw.name = "gw_1";
            gw.description = "gw_desc";
            gw.code = "gw_code";
            gw.network = new NetworkDAO();
            gw.network.code = "netCode";
            gw.network.name = "net_1";
            gw.network.description = "Network 1";
            return gw;
        });

        mockFind.mockResolvedValue([new GatewayDAO()]); // Simulate existing gateway

        await expect(repo.createGateway("gw:mac", "gw_1", "gw_desc", "netCode")).rejects.toThrow(ConflictError);
    });
    it("create gateway - NetworkNotFoundError", async () => {
        mockFind.mockResolvedValue([]);
        jest.spyOn(NetworkRepository.prototype, "getSingleNetworkByMacAdd").mockResolvedValue(null);
        jest.restoreAllMocks();
        await expect(
            repo.createGateway("gw:mac", "gw_1", "gw_desc", "netCode")
        ).rejects.toThrow(NotFoundError);

    });
    //update
    it("update gateway", async () => {
        const mockGateway = new GatewayDAO();
        mockGateway.macAddress = "gw:mac";
        mockGateway.name = "Gateway 1";
        mockGateway.description = "Description 1";
        mockGateway.code = "netCode";
        mockGateway.network = new NetworkDAO();
        mockGateway.network.code = "netCode";
        mockGateway.network.name = "net_1";
        mockGateway.network.description = "Network 1";

        mockFind.mockResolvedValueOnce([mockGateway]);
        mockFind.mockResolvedValueOnce([]);

        const updatedGateway = new GatewayDAO();
        updatedGateway.macAddress = "gw:mac-updated";
        updatedGateway.name = "Updated Gateway";
        updatedGateway.description = "Updated Description";
        updatedGateway.code = "netCode";
        updatedGateway.network = new NetworkDAO();
        updatedGateway.network.code = "netCode";
        updatedGateway.network.name = "net_1";
        updatedGateway.network.description = "Network 1";

        mockUpdate.mockResolvedValue(updatedGateway);
        jest.spyOn(GatewayRepository.prototype, "getSingleGatewayByMacAdd").mockResolvedValue(updatedGateway);

        const result = await repo.updateGateway("gw:mac", "gw:mac-updated", "Updated Gateway", "Updated Description");

        expect(result).toBeInstanceOf(GatewayDAO);
        expect(result.macAddress).toBe("gw:mac-updated");
    });
    it("update gateway - NotFoundError", async () => {
        mockFind.mockResolvedValueOnce([]);
        await expect(repo.updateGateway("gw:mac", "gw:mac-updated", "Updated Gateway", "Updated Description"))
            .rejects.toThrow(NotFoundError);
    });

    it("update gateway - ConflictError", async () => {
        const mockGateway = new GatewayDAO();
        mockGateway.macAddress = "gw:mac";
        mockGateway.name = "Gateway 1";
        mockGateway.description = "Description 1";
        mockGateway.code = "netCode";
        mockGateway.network = new NetworkDAO();
        mockGateway.network.code = "netCode";
        mockGateway.network.name = "net_1";
        mockGateway.network.description = "Network 1";

        mockFind.mockResolvedValueOnce([mockGateway]);
        mockFind.mockResolvedValueOnce([new GatewayDAO()]); // Simulate existing gateway with same mac address

        await expect(repo.updateGateway("gw:mac", "gw:mac-updated", "Updated Gateway", "Updated Description"))
            .rejects.toThrow(ConflictError);
    });
    //delete
    it("delete gateway", async () => {
        const mockGateway = new GatewayDAO();
        mockGateway.macAddress = "gw:mac-updated";
        mockGateway.name = "Updated Gateway";
        mockGateway.description = "Updated Description";
        mockGateway.code = "netCode";
        mockGateway.network = new NetworkDAO();
        mockGateway.network.code = "netCode";
        mockGateway.network.name = "net_1";
        mockGateway.network.description = "Network 1";

        mockFind.mockResolvedValueOnce([mockGateway]);
        mockRemove.mockResolvedValue(mockGateway);

        await expect(repo.deleteGateway("gw:mac")).resolves.toBeUndefined();
        expect(mockRemove).toHaveBeenCalledWith(mockGateway);
    });
    it("delete gateway - NotFoundError", async () => {
        mockFind.mockResolvedValueOnce([]);
        await expect(repo.deleteGateway("gw:mac")).rejects.toThrow(NotFoundError);
    });
    it("delete gateway - NetworkNotFoundError", async () => {
        mockFind.mockResolvedValueOnce([]);
        jest.spyOn(NetworkRepository.prototype, "getSingleNetworkByMacAdd").mockResolvedValue(null);
        jest.restoreAllMocks();
        await expect(repo.deleteGateway("gw:mac")).rejects.toThrow(NotFoundError);
    });
    
});
