jest.mock("@repositories/GatewayRepository");
jest.mock("@repositories/SensorRepository");
jest.mock("@repositories/NetworkRepository");

import * as sensorController from "@controllers/sensorController";
import { Sensor as SensorDTO } from "@dto/Sensor";
import { SensorRepository } from "@repositories/SensorRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";
import { SensorDAO } from "@models/dao/SensorDAO";
import { getSensorByGatewayMacAddress, getSingleSensorByMacAddress } from "@controllers/sensorController";


describe("SensorRepository", () => {
    let repo: SensorRepository;
    let sensorRepo: jest.Mocked<SensorRepository>;

    afterEach(() => {
        jest.clearAllMocks();
    }
    );

    it("Mapper service integration", async () => {
        const fakeSensorDAO: SensorDAO = {
            macAddress: "sen:sor",
            name: "sensor",
            description: "Sensor description",
            variable: "temperature",
            unit: "Celsius",
            macAddressGateway: "gw",
            gateway: {
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
            }
        } as SensorDAO;
        const expectedSensorDTO: SensorDTO = {
            macAddress: "sen:sor",
            name: "sensor",
            description: "Sensor description",
            variable: "temperature",
            unit: "Celsius",
        };
        (SensorRepository as jest.Mock).mockImplementation(() =>({
            getSingleSensorByMacAddress: jest.fn().mockResolvedValue(fakeSensorDAO),
        }));
        const sensor = await getSingleSensorByMacAddress("sen:sor");
        expect(sensor).toEqual(expectedSensorDTO);
    });
    it("retrieve and map sensors by gw mac address", async () => {
        const fakeSensorDAO: SensorDAO = {
            macAddress: "sen:sor",
            name: "sensor",
            description: "Sensor description",
            variable: "temperature",
            unit: "Celsius",
            macAddressGateway: "gw",
            gateway: {
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
            }
        } as SensorDAO;
        const expectedSensorDTO: SensorDTO = {
            macAddress: "sen:sor",
            name: "sensor",
            description: "Sensor description",
            variable: "temperature",
            unit: "Celsius",
        };
        (SensorRepository as jest.Mock).mockImplementation(() =>({
            getSensorByGatewayMacAddress: jest.fn().mockResolvedValue([fakeSensorDAO]),
        }));
        const sensor = await getSensorByGatewayMacAddress("testgw");
        expect(sensor).toEqual([expectedSensorDTO]);
    });
    
    it("create sensor", async () => {
        const fakeSensorDTO: SensorDTO = {
            macAddress: "sen:sor",
            name: "sensor",
            description: "Sensor description",
            variable: "temperature",
            unit: "Celsius",
        };
        const mockCreateSensor = jest.fn().mockResolvedValue(undefined);
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            createSensor: mockCreateSensor,
        }));
        await sensorController.createSensor(fakeSensorDTO, "testgw");
        expect(mockCreateSensor).toHaveBeenCalledWith(
            fakeSensorDTO.macAddress,
            "testgw",
            fakeSensorDTO.name,
            fakeSensorDTO.description,
            fakeSensorDTO.variable,
            fakeSensorDTO.unit);
    });
    it("delete sensor", async () => {
        const mockDeleteSensor = jest.fn().mockResolvedValue(undefined);
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            deleteSensor: mockDeleteSensor,
        }));
        await sensorController.deleteSensor("sen:sor");
        expect(mockDeleteSensor).toHaveBeenCalledWith("sen:sor");
    });
    it("update sensor", async () => {
        const fakeSensorDTO: SensorDTO = {
            macAddress: "sen:sor",
            name: "sensor",
            description: "Sensor description",
            variable: "temperature",
            unit: "Celsius",
        };
        const mockUpdateSensor = jest.fn().mockResolvedValue(undefined);
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            updateSensor: mockUpdateSensor,
        }));
        await sensorController.updateSensor(
            "testgw",
            fakeSensorDTO);
        expect(mockUpdateSensor).toHaveBeenCalledWith(
            "testgw",
            fakeSensorDTO.macAddress,
            fakeSensorDTO.name,
            fakeSensorDTO.description,
            fakeSensorDTO.variable,
            fakeSensorDTO.unit
        );
    });

    it("getSingleSensorByMacAddress throws NotFoundError", async () => {
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            getSingleSensorByMacAddress: jest.fn().mockRejectedValue(new NotFoundError("Sensor not found")),
        }));
        await expect(getSingleSensorByMacAddress("nonexistent")).rejects.toThrow(NotFoundError);
    });
    it("getSensorByGatewayMacAddress throws NotFoundError", async () => {
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            getSensorByGatewayMacAddress: jest.fn().mockRejectedValue(new NotFoundError("Gateway not found")),
        }));
        await expect(getSensorByGatewayMacAddress("nonexistent")).rejects.toThrow(NotFoundError);
    });
    it("createSensor throws ConflictError", async () => {
        const fakeSensorDTO: SensorDTO = {
            macAddress: "sen:sor",
            name: "sensor",
            description: "Sensor description",
            variable: "temperature",
            unit: "Celsius",
        };
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            createSensor: jest.fn().mockRejectedValue(new ConflictError("Sensor already exists")),
        }));
        await expect(sensorController.createSensor(fakeSensorDTO, "testgw")).rejects.toThrow(ConflictError);
    });
    it("deleteSensor throws NotFoundError", async () => {
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            deleteSensor: jest.fn().mockRejectedValue(new NotFoundError("Sensor not found")),
        }));
        await expect(sensorController.deleteSensor("nonexistent")).rejects.toThrow(NotFoundError);
    });
    it("updateSensor throws NotFoundError", async () => {
        const fakeSensorDTO: SensorDTO = {
            macAddress: "sen:sor",
            name: "sensor",
            description: "Sensor description",
            variable: "temperature",
            unit: "Celsius",
        };
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            updateSensor: jest.fn().mockRejectedValue(new NotFoundError("Sensor not found")),
        }));
        await expect(sensorController.updateSensor("testgw", fakeSensorDTO)).rejects.toThrow(NotFoundError);
    });
    it("updateSensor throws ConflictError", async () => {
        const fakeSensorDTO: SensorDTO = {
            macAddress: "sen:sor",
            name: "sensor",
            description: "Sensor description",
            variable: "temperature",
            unit: "Celsius",
        };
        (SensorRepository as jest.Mock).mockImplementation(() => ({
            updateSensor: jest.fn().mockRejectedValue(new ConflictError("Sensor already exists")),
        }));
        await expect(sensorController.updateSensor("testgw", fakeSensorDTO)).rejects.toThrow(ConflictError);
    });

});