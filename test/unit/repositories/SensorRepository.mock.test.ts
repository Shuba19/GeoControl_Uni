import { NetworkRepository } from "@repositories/NetworkRepository";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { SensorRepository } from "@repositories/SensorRepository";
import { SensorDAO } from "@models/dao/SensorDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";
import { mock } from "node:test";
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
    const repo = new SensorRepository();

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
    it("retrieve all sensor of gateway", async () => {
        jest.spyOn(NetworkRepository.prototype, "getSingleNetworkByMacAdd").mockImplementation((code: string) => {
            const net = new NetworkDAO();
            net.code = code;
            net.name = "net_1";
            net.description = "Network 1";
            return Promise.resolve(net);
        }
        );
        jest.spyOn(GatewayRepository.prototype, "getSingleGatewayByMacAdd").mockImplementation((macAddress: string) => {
            const gw = new GatewayDAO();
            gw.macAddress = macAddress;
            gw.name = "gw_1";
            gw.description = "Gateway 1";
            gw.network = new NetworkDAO();
            gw.network.code = "net_1";
            gw.network.name = "Network 1";
            gw.network.description = "Network 1";
            return Promise.resolve(gw);
        });
        const net = new NetworkDAO();
        net.code = "net_1";
        net.name = "Network 1";
        net.description = "Network 1";
        const gw = new GatewayDAO();
        gw.macAddress = "gw:mac:1";
        gw.name = "Gateway 1";
        gw.description = "Gateway 1";
        gw.network = net;
        const s0 = new SensorDAO();
        s0.macAddress = "sensor:mac:0";
        s0.name = "sensor_0";
        s0.description = "Sensor 0";
        s0.gateway = gw;
        s0.variable = "temperature";
        s0.unit = "Kelvin";
        const s1 = new SensorDAO();
        s1.macAddress = "sensor:mac:1";
        s1.name = "sensor_1";
        s1.description = "Sensor 1";
        s1.variable = "temperature";
        s1.unit = "Celsius";
        s1.gateway = gw;
        const mockedSensors = [s0, s1];
        mockFind.mockResolvedValue(mockedSensors);
        const result = await repo.getAllSensorsByGatewayMacAddress(gw.macAddress);
        expect(result).toHaveLength(2);
        expect(result[0].macAddress).toBe("sensor:mac:0");
        expect(result[1].macAddress).toBe("sensor:mac:1");
    });
    it("retrieve single sensor by mac address", async () => {
        const net = new NetworkDAO();
        net.code = "net_1";
        net.name = "Network 1";
        net.description = "Network 1";
        const gw = new GatewayDAO();
        gw.macAddress = "gw:mac:1";
        gw.name = "Gateway 1";
        gw.description = "Gateway 1";
        gw.network = net;
        const mockSensor = new SensorDAO();
        mockSensor.macAddress = "sensor:mac:1";
        mockSensor.name = "sensor_1";
        mockSensor.description = "Sensor 1";
        mockSensor.variable = "temperature";
        mockSensor.unit = "Celsius";
        mockSensor.gateway = gw;
        mockSensor.macAddressGateway = gw.macAddress;
        mockFind.mockResolvedValue([mockSensor]);
        const result = await repo.getSingleSensorByMacAddress(mockSensor.macAddress);
        expect(result).toBeInstanceOf(SensorDAO);
        expect(result.macAddress).toBe("sensor:mac:1");
    });
    it("retrieve single sensor by mac address not found", async () => {
        mockFind.mockResolvedValue([]);
        await expect(repo.getSingleSensorByMacAddress("nonexistent:mac:1")).rejects.toThrow(NotFoundError);
    });
    //POST
    it("create sensor", async () => {
        const net = new NetworkDAO();
        net.code = "net_1";
        net.name = "Network 1";
        net.description = "Network 1";
        const gw = new GatewayDAO();
        gw.macAddress = "gw:mac:1";
        gw.name = "Gateway 1";
        gw.description = "Gateway 1";
        gw.network = net;
        const mockSensor = new SensorDAO();
        mockSensor.macAddress = "sensor:mac:2";
        mockSensor.name = "sensor_2";
        mockSensor.description = "Sensor 2";
        mockSensor.variable = "temperature";
        mockSensor.unit = "Celsius";
        mockSensor.macAddressGateway = gw.macAddress;
        mockSensor.gateway = gw;

        mockSave.mockResolvedValue(mockSensor);
        mockFind.mockResolvedValueOnce([]);           // Nessun sensore esistente
        mockFind.mockResolvedValueOnce([mockSensor]); // Dopo il save, trova il sensore

        const result = await repo.createSensor(
            mockSensor.macAddress,
            mockSensor.name,
            mockSensor.description,
            mockSensor.variable,
            mockSensor.unit,
            gw.macAddress
        );

        expect(result).toBeInstanceOf(SensorDAO);
        expect(result.macAddress).toBe("sensor:mac:2");
    });
    it("create sensor conflict", async () => {
        const net = new NetworkDAO();
        net.code = "net_1";
        net.name = "Network 1";
        net.description = "Network 1";
        const gw = new GatewayDAO();
        gw.macAddress = "gw:mac:1";
        gw.name = "Gateway 1";
        gw.description = "Gateway 1";
        gw.network = net;
        const mockSensor = new SensorDAO();
        mockSensor.macAddress = "sensor:mac:1";
        mockSensor.name = "sensor_1";
        mockSensor.description = "Sensor 1";
        mockSensor.variable = "temperature";
        mockSensor.unit = "Celsius";
        mockSensor.gateway = gw;

        mockFind.mockResolvedValue([mockSensor]);

        await expect(repo.createSensor(mockSensor.macAddress, mockSensor.name, mockSensor.description, mockSensor.variable, mockSensor.unit, gw.macAddress)).rejects.toThrow(ConflictError);
    });

    //update
    
        it("update gateway", async () => {
            const mockGateway = new GatewayDAO();
            mockGateway.macAddress = "gw:mac";
            mockGateway.name = "Gateway 1";
            mockGateway.description = "Description 1";
            mockGateway.code = "net_1";
            mockGateway.network = new NetworkDAO();
            mockGateway.network.code = "net_1";
            mockGateway.network.name = "net_1";
            mockGateway.network.description = "Network 1";
            const sensor1 = new SensorDAO();
            sensor1.macAddress = "sensor:mac:1";
            sensor1.name = "Sensor 1";
            sensor1.description = "Sensor 1 Description";
            sensor1.variable = "temperature";
            sensor1.unit = "Celsius";
            sensor1.macAddressGateway = "gw:mac:1";
            sensor1.gateway = mockGateway;
            mockFind.mockResolvedValueOnce([sensor1]);
            mockFind.mockResolvedValueOnce([]);
    
            const updatedSensor = new SensorDAO();
            updatedSensor.macAddress = "sensor:mac-updated";
            updatedSensor.name = "Sensor Updated";
            updatedSensor.description = "Updated Description";
            updatedSensor.variable = "humidity";
            updatedSensor.unit = "percent";
            updatedSensor.gateway = new GatewayDAO();
            updatedSensor.gateway.macAddress = "gw:mac:1";
            updatedSensor.gateway.name = "Gateway 1";
            updatedSensor.gateway.description = "Description 1";
            updatedSensor.gateway.code = "netCode";
            updatedSensor.gateway.network = new NetworkDAO();
            updatedSensor.gateway.network.code = "net_1";
            updatedSensor.gateway.network.name = "net_1";
            updatedSensor.gateway.network.description = "Network 1";
            mockSave.mockResolvedValue(updatedSensor); 
            jest.spyOn(SensorRepository.prototype, "getSingleSensorByMacAddress").mockResolvedValue(updatedSensor);
    
            const result = await repo.updateSensor("sensor:mac:1", "sensor:mac-updated", "Sensor Updated", "Updated Description", "humidity", "percent");
            expect(result).toBeInstanceOf(SensorDAO);
            expect(result.macAddress).toBe("sensor:mac-updated");

        });
    it("update sensor not found", async () => {
        mockFind.mockResolvedValueOnce([]);
        await expect(repo.updateSensor("nonexistent:mac:1", "new:mac:1", "New Sensor", "New Description", "temperature", "Celsius")).rejects.toThrow(NotFoundError);
    }
    );
    it("update sensor conflict", async () => {
        const net = new NetworkDAO();
        net.code = "net_1";
        net.name = "Network 1";
        net.description = "Network 1";
        const gw = new GatewayDAO();
        gw.macAddress = "gw:mac:1";
        gw.name = "Gateway 1";
        gw.description = "Gateway 1";
        gw.code = "net_1";
        gw.network = net;
        const mockSensor1 = new SensorDAO();
        mockSensor1.macAddress = "sensor:mac:1";
        mockSensor1.name = "sensor_1";
        mockSensor1.description = "Sensor 1";
        mockSensor1.variable = "temperature";
        mockSensor1.unit = "Celsius";
        mockSensor1.gateway = gw;

        const mockSensor2 = new SensorDAO();
        mockSensor2.macAddress = "sensor:mac:2";
        mockSensor2.name = "sensor_2";
        mockSensor2.description = "Sensor 2";
        mockSensor2.variable = "humidity";
        mockSensor2.unit = "percent";
        mockSensor2.gateway = gw;

        mockFind.mockResolvedValueOnce([mockSensor1]);
        mockFind.mockResolvedValueOnce([mockSensor2]);

        await expect(repo.updateSensor(mockSensor1.macAddress, mockSensor2.macAddress, mockSensor2.name, mockSensor2.description, mockSensor2.variable, mockSensor2.unit)).rejects.toThrow(ConflictError);
    });
    //delete
    it("delete sensor", async () => {
        jest.restoreAllMocks();
        const mockSensor = new SensorDAO();
        mockSensor.macAddress = "sensor:mac-updated";
        mockSensor.name = "Sensor Updated";
        mockSensor.description = "Updated Description";
        mockSensor.variable = "humidity";
        mockSensor.unit = "percent";
        mockSensor.macAddressGateway = "gw:mac:1";
        mockSensor.gateway = new GatewayDAO();
        mockSensor.gateway.macAddress = "gw:mac:1";
        mockSensor.gateway.name = "Gateway 1";
        mockSensor.gateway.description = "Description 1";
        mockSensor.gateway.code = "net_1";
        mockSensor.gateway.network = new NetworkDAO();
        mockSensor.gateway.network.code = "net_1";
        mockSensor.gateway.network.name = "net_1";
        mockSensor.gateway.network.description = "Network 1";
        mockFind.mockResolvedValueOnce([mockSensor]);
        mockRemove.mockResolvedValueOnce(mockSensor);
        await repo.deleteSensor(mockSensor.macAddress);
        expect(mockRemove).toHaveBeenCalledWith(expect.objectContaining({
            macAddress: "sensor:mac:1",
            name: "sensor_1",
            description: "Sensor 1",
            variable: "temperature",
            unit: "Celsius",
            gateway: expect.objectContaining({
                macAddress: "gw:mac:1",
                name: "Gateway 1",
                // Puoi aggiungere altri campi se vuoi essere più preciso
            })
        }));
    });
    it("delete sensor not found", async () => {
        mockFind.mockResolvedValueOnce([]);
        await expect(repo.deleteSensor("nonexistent:mac:1")).rejects.toThrow(NotFoundError);
    });
    it("delete sensor, GW not found", async () => {
        mockFind.mockResolvedValueOnce([]);
        jest.spyOn(GatewayRepository.prototype, "getSingleGatewayByMacAdd").mockResolvedValue(null);
        jest.restoreAllMocks();
        await expect(repo.deleteSensor("nonexistent:mac:1")).rejects.toThrow(NotFoundError);
    });
});