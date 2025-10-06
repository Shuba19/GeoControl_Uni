import { GatewayRepository } from "@repositories/GatewayRepository";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { SensorRepository } from "@repositories/SensorRepository";
import { SensorDAO } from "@models/dao/SensorDAO";
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
    await TestDataSource.getRepository(SensorDAO).clear();
});
describe("SensorRepository (db)", () => {
    let repo: SensorRepository;
    let netRepo: NetworkRepository;
    let gwRepo: GatewayRepository;

    beforeEach(async () => {
        repo = new SensorRepository();
        netRepo = new NetworkRepository();
        gwRepo = new GatewayRepository();
        await netRepo.createNetwork("netCode", "Network 1", "Description 1");
        await gwRepo.createGateway("gw1", "Gateway 1", "Description 1", "netCode");
    });

    it("createSensor", async () => {
        const sensor = await repo.createSensor(
            "mc:sensor",
            "gw1",
            "Sensor 1",
            "Description 1",
            "temperature",
            "Celsius"
        );
        expect(sensor).toBeInstanceOf(SensorDAO);
        expect(sensor.macAddress).toBe("mc:sensor");
    });
    it("createSensor: conflict", async () => {
        await repo.createSensor(
            "mc:sensor",
            "gw1",
            "Sensor 1",
            "Description 1",
            "temperature",
            "Celsius"
        );
        await expect(
            repo.createSensor(
                "mc:sensor",
                "gw1",
                "Sensor 1 Duplicate",
                "Description 1 Duplicate",
                "temperature",
                "Celsius"
            )
        ).rejects.toThrow(ConflictError);
    });
    it("createSensor: not found gateway", async () => {
        await expect(
            repo.createSensor(
                "mc:sensor",
                "fakeGW",
                "Sensor 1",
                "Description 1",
                "temperature",
                "Celsius"
            )
        ).rejects.toThrow(NotFoundError);
    });
    //get
    it("getSingleSensorByMacAdd", async () => {
        await repo.createSensor(
            "mc:sensor:2",
            "gw1",
            "Sensor 2",
            "Description 2",
            "humidity",
            "Percent"
        );
        const sensor = await repo.getSingleSensorByMacAddress("mc:sensor:2");
        expect(sensor).toBeInstanceOf(SensorDAO);
        expect(sensor.macAddress).toBe("mc:sensor:2");
    });
    it("getAllSensorsByGatewayMacAdd", async () => {
        await repo.createSensor(
            "mc:sensor",
            "gw1",
            "Sensor 3",
            "Description 3",
            "pressure",
            "Pascal"
        );
        await repo.createSensor(
            "mc:sensor:2",
            "gw1",
            "Sensor 4",
            "Description 4",
            "light",
            "Lux"
        );
        const sensors = await repo.getAllSensorsByGatewayMacAddress("gw1");
        expect(sensors.length).toBe(2);
        expect(sensors.map(s => s.macAddress)).toEqual(expect.arrayContaining(["mc:sensor", "mc:sensor:2"]));
    });
    it("getAllSensorsByGatewayMacAdd: not found", async () => {
        await expect(repo.getAllSensorsByGatewayMacAddress("fakeGW")).rejects.toThrow(NotFoundError);
    });
    it("getSingleSensorByMacAdd: not found", async () => {
        await expect(repo.getSingleSensorByMacAddress("fakeGW")).rejects.toThrow(NotFoundError);
    });
    //delete
    it("deleteSensor", async () => {
        await repo.createSensor(
            "mc:sensor",
            "gw1",
            "Sensor 5",
            "Description 5",
            "temperature",
            "Celsius"
        );
        const sensor = await repo.getSingleSensorByMacAddress("mc:sensor");
        expect(sensor).toBeDefined();
        await repo.deleteSensor("mc:sensor");
        await expect(repo.getSingleSensorByMacAddress("mc:sensor")).rejects.toThrow(NotFoundError);
    });
    it("deleteSensor: not found", async () => {
        await expect(repo.deleteSensor("notfound")).rejects.toThrow(NotFoundError);
    });
    //update
    it("updateSensor", async () => {
        await repo.createSensor(
            "mc:sensor",
            "gw1",
            "Sensor 6",
            "Description 6",
            "humidity",
            "Percent"
        );
        const updated = await repo.updateSensor(
            "mc:sensor",
            "mc:sensor:2",
            "Sensor 6 Updated",
            "Description 6 Updated",
            "temperature",
            "Celsius"
        );
        expect(updated).toBeInstanceOf(SensorDAO);
        expect(updated.macAddress).toBe("mc:sensor:2");
    });
    it("updateSensor: not found", async () => {
        await expect(
            repo.updateSensor("notfound", "newMac", "New Name", "New Desc", "variable", "unit")
        ).rejects.toThrow(NotFoundError);
    });
    it("updateSensor: conflict", async () => {
        await repo.createSensor(
            "mc:sensor",
            "gw1",
            "Sensor",
            "desc",
            "temperature",
            "Celsius"
        );
        await repo.createSensor(
            "mc:sensor:2",
            "gw1",
            "Sensor",
            "desc 2",
            "humidity",
            "Percent"
        );
        await expect(
            repo.updateSensor("mc:sensor", "mc:sensor:2", "Updated Sensor", "Updated Desc", "variable", "unit")
        ).rejects.toThrow(ConflictError);
    });
});