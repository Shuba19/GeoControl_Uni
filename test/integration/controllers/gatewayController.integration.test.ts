jest.mock("@repositories/GatewayRepository");
jest.mock("@repositories/SensorRepository");
jest.mock("@repositories/NetworkRepository");

import * as gatewayController from "@controllers/gatewayController";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { Gateway as GatewayDTO } from "@dto/Gateway";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { SensorRepository } from "@repositories/SensorRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";
describe("GatewayController integration", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("getNetworkGateway: mapperService integration", async () => {
        const fakeGatewayDAO: GatewayDAO = {
            macAddress: "testgw",
            name: "testgw",
            description: "A test gateway",
            code: "testCode",
            sensors: [],
            network: {
                code: "testCode",
                name: "Test Network",
                description: "A test network",
                gateways: []
            }
        };
        const expectedDTO: GatewayDTO = {
            macAddress: fakeGatewayDAO.macAddress,
            name: fakeGatewayDAO.name,
            description: fakeGatewayDAO.description,
            sensors: []
        };
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            getAllGatewaysByCode: jest.fn().mockResolvedValue([fakeGatewayDAO]),
            getSingleGatewayByMacAdd: jest.fn().mockResolvedValue(fakeGatewayDAO)
        }));
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            getSensorByGatewayMacAddress: jest.fn().mockResolvedValue([])
        }));

        const result = await gatewayController.getNetworkGateway("testNetworkCode");

        expect(result).toEqual([expectedDTO]);
    });

    it("getNetworkGateway: retrieve and map gateways related to a network", async () => {
        const fakeGatewayDAO: GatewayDAO = {
            macAddress: "testgw",
            name: "testgw",
            description: "A test gateway",
            code: "testCode",
            sensors: [],
            network: {
                code: "testCode",
                name: "Test Network",
                description: "A test network",
                gateways: []
            }
        };
        const expectedDTO: GatewayDTO = {
            macAddress: fakeGatewayDAO.macAddress,
            name: fakeGatewayDAO.name,
            description: fakeGatewayDAO.description,
            sensors: []
        };
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            getAllGatewaysByCode: jest.fn().mockResolvedValue([fakeGatewayDAO]),
            getSingleGatewayByMacAdd: jest.fn().mockResolvedValue(fakeGatewayDAO)
        }));
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            getSensorByGatewayMacAddress: jest.fn().mockResolvedValue([])
        }));

        const result = await gatewayController.getNetworkGateway("testCode");

        expect(result).toEqual([expectedDTO]);
    });

    it("getSingleGatewayByMacAdd: controller get single gw", async () => {
        const fakeGatewayDAO: GatewayDAO = {
            macAddress: "testgw",
            name: "testgw",
            description: "A test gateway",
            code: "testCode",
            sensors: [],
            network: {
                code: "testCode",
                name: "Test Network",
                description: "A test network",
                gateways: []
            }
        };
        const expectedDTO: GatewayDTO = {
            macAddress: fakeGatewayDAO.macAddress,
            name: fakeGatewayDAO.name,
            description: fakeGatewayDAO.description,
            sensors: []
        };
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            getAllGatewaysByCode: jest.fn().mockResolvedValue([fakeGatewayDAO]),
            getSingleGatewayByMacAdd: jest.fn().mockResolvedValue(fakeGatewayDAO)
        }));
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            getSensorByGatewayMacAddress: jest.fn().mockResolvedValue([])
        }));
        (NetworkRepository as jest.Mock).mockImplementation(() => ({
            getSingleNetworkByMacAdd: jest.fn().mockResolvedValue({
                code: "testCode",
                name: "Test Network",
                description: "A test network",
                gateways: []
            })
        }));

        const result = await gatewayController.getSingleGatewayByMacAdd("testgw");

        expect(result).toEqual(expectedDTO);
    });

    it("createGateway: controller create gw", async () => {
        const mockCreateGateway = jest.fn().mockResolvedValue(undefined);
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            createGateway: mockCreateGateway
        }));
        const fakeGatewayDTO: GatewayDTO = {
            macAddress: "testgw",
            name: "testgw",
            description: "gw test",
            sensors: []
        };

        await gatewayController.createGateway(fakeGatewayDTO, "testCode");

        expect(mockCreateGateway).toHaveBeenCalledWith(
            fakeGatewayDTO.macAddress,
            fakeGatewayDTO.name,
            fakeGatewayDTO.description,
            "testCode"
        );
    });

    it("deleteGateway: controller delete gw", async () => {
        const mockDeleteGateway = jest.fn().mockResolvedValue(undefined);
        const mockGetSingleGatewayByMacAdd = jest.fn().mockResolvedValue({
            macAddress: "testgw",
            network: { code: "testCode" }
        });
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            deleteGateway: mockDeleteGateway,
            getSingleGatewayByMacAdd: mockGetSingleGatewayByMacAdd
        }));

        await gatewayController.deleteGateway("testgw");

        expect(mockGetSingleGatewayByMacAdd).toHaveBeenCalledWith("testgw");
        expect(mockDeleteGateway).toHaveBeenCalledWith("testgw");
    });
    //updateGateway
    it("updateGateway: controller update gw", async () => {
        const mockUpdateGateway = jest.fn().mockResolvedValue(undefined);
        const mockGetSingleGatewayByMacAdd = jest.fn().mockResolvedValue({
            macAddress: "testgw",
            network: { code: "testCode" }
        });
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            updateGateway: mockUpdateGateway,
            getSingleGatewayByMacAdd : mockGetSingleGatewayByMacAdd
        }));
        const fakeGatewayDTO: GatewayDTO = {
            macAddress: "testgw",
            name: "testgw",
            description: "gw test",
            sensors: []
        };

        await gatewayController.updateGateway("testgw", fakeGatewayDTO);

        expect(mockUpdateGateway).toHaveBeenCalledWith(
            "testgw",
            fakeGatewayDTO.macAddress,
            fakeGatewayDTO.name,
            fakeGatewayDTO.description
        );
    });

    //error simulation
    it("getNetworkGateway: no found, 1 param", async () => {
        
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            getSingleGatewayByMacAdd: jest.fn().mockRejectedValue(new NotFoundError("not found"))
        }));
        (NetworkRepository as jest.Mock).mockImplementation(() => ({
            getSingleNetworkByMacAdd: jest.fn().mockResolvedValue({ /* ... */ })
        }));
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            getSensorByGatewayMacAddress: jest.fn().mockResolvedValue([])
        }));

        await expect(gatewayController.getSingleGatewayByMacAdd("codeNet")).rejects.toThrow(NotFoundError);
    });

    it("getSingleGatewayByMacAdd:  NotFoundError,2 param", async () => {
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            getSingleGatewayByMacAdd: jest.fn().mockRejectedValue(new NotFoundError("not found"))
        }));
        (NetworkRepository as jest.Mock).mockImplementation(() => ({
            getSingleNetworkByMacAdd: jest.fn().mockResolvedValue({ /* ... */ })
        }));
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            getSensorByGatewayMacAddress: jest.fn().mockResolvedValue([])
        }));
    
        await expect(gatewayController.getSingleGatewayByMacAdd("notfound", "testCode")).rejects.toThrow(NotFoundError);
    });

    //delete gateway, NotFoundError
    
    it("deleteGateway: NotFoundError", async () => {
        const mockGetSingleGatewayByMacAdd = jest.fn().mockResolvedValue({
            macAddress: "testgw",
            network: { code: "testCode" }
        });
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            deleteGateway: jest.fn().mockRejectedValue(new NotFoundError("not found")),
            getSingleGatewayByMacAdd: mockGetSingleGatewayByMacAdd
        }));
        (NetworkRepository as jest.Mock).mockImplementation(() => ({
            getSingleNetworkByMacAdd: jest.fn().mockResolvedValue({  })
        }));
    
        await expect(gatewayController.deleteGateway("FakeCode")).rejects.toThrow(NotFoundError);
    });
    //updateGateway, NotFoundError
    it("updateGateway: NotFoundError", async () => {
        const mockGetSingleGatewayByMacAdd = jest.fn().mockResolvedValue({
            macAddress: "testgw",
            network: { code: "testCode" }
        });

        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            updateGateway: jest.fn().mockRejectedValue(new NotFoundError("not found")),
            getSingleGatewayByMacAdd: mockGetSingleGatewayByMacAdd
        }));
        (NetworkRepository as jest.Mock).mockImplementation(() => ({
            getSingleNetworkByMacAdd: jest.fn().mockResolvedValue({  })
        }));

        const fakeGatewayDTO: GatewayDTO = {
            macAddress: "testgw",
            name: "testgw",
            description: "gw test",
            sensors: []
        };

        await expect(gatewayController.updateGateway("macAdd", fakeGatewayDTO)).rejects.toThrow(NotFoundError);
    });

    //createGateway, ConflictError
    it("createGateway: ConflictError", async () => {
        (GatewayRepository as jest.Mock).mockImplementation(() => ({
            createGateway: jest.fn().mockRejectedValue(new ConflictError("Conflict error"))
        }));
        const fakeGatewayDTO: GatewayDTO = {
            macAddress: "testgw",
            name: "testgw",
            description: "gw test",
            sensors: []
        };

        await expect(gatewayController.createGateway(fakeGatewayDTO, "testCode")).rejects.toThrow(ConflictError);
    });
});