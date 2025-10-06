import { MeasurementsRepository } from "@repositories/MeasurementRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { MeasurementsDAO } from "@models/dao/MeasurementsDAO";
import { SensorDAO } from "@models/dao/SensorDAO";
import { GatewayDAO } from "@models/dao/GatewayDAO";
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
  await TestDataSource.getRepository(MeasurementsDAO).clear();
  await TestDataSource.getRepository(SensorDAO).clear();
  await TestDataSource.getRepository(GatewayDAO).clear();
  await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("MeasurementsRepository: SQLite in-memory", () => {
  let repo: MeasurementsRepository;
  let sensorRepo: SensorRepository;
  let gatewayRepo: GatewayRepository;
  let networkRepo: NetworkRepository;

  beforeEach(async () => {
    repo = new MeasurementsRepository();
    sensorRepo = new SensorRepository();
    gatewayRepo = new GatewayRepository();
    networkRepo = new NetworkRepository();

    await networkRepo.createNetwork("testNet", "Test Network", "Test network description");
    await gatewayRepo.createGateway("testGW", "Test Gateway", "Test gateway description", "testNet");
    await sensorRepo.createSensor("testSensor", "testGW", "Test Sensor", "Test sensor description", "temperature", "Celsius");
  });

  describe("createMeasurement", () => {
    it("should create a new measurement", async () => {
      const createdAt = new Date("2023-01-01T10:00:00Z");
      const value = 25.5;
      const isOutlier = false;

      const measurement = await repo.createMeasurement("testSensor", createdAt, value, isOutlier);

      expect(measurement).toBeDefined();
      expect(measurement.sensorMacAddress).toBe("testSensor");
      expect(measurement.createdAt).toEqual(createdAt);
      expect(measurement.value).toBe(value);
      expect(measurement.isOutlier).toBe(isOutlier);
      expect(measurement.sensor).toBeDefined();
    });

    it("should throw ConflictError when measurement already exists", async () => {
      const createdAt = new Date("2023-01-01T10:00:00Z");
      const value = 25.5;

      await repo.createMeasurement("testSensor", createdAt, value, false);

      await expect(
        repo.createMeasurement("testSensor", createdAt, 30.0, true)
      ).rejects.toThrow(ConflictError);
    });

    it("should throw NotFoundError when sensor does not exist", async () => {
      const createdAt = new Date("2023-01-01T10:00:00Z");

      await expect(
        repo.createMeasurement("nonExistentSensor", createdAt, 25.5, false)
      ).rejects.toThrow(NotFoundError);
    });

    it("should create measurement with outlier flag", async () => {
      const createdAt = new Date("2023-01-01T10:00:00Z");
      const value = 100.0;
      const isOutlier = true;

      const measurement = await repo.createMeasurement("testSensor", createdAt, value, isOutlier);

      expect(measurement.isOutlier).toBe(true);
    });
  });

  describe("getAllMeasurements", () => {
    it("should return all measurements", async () => {
      await repo.createMeasurement("testSensor", new Date("2023-01-01T10:00:00Z"), 25.5, false);
      await repo.createMeasurement("testSensor", new Date("2023-01-01T11:00:00Z"), 26.0, false);

      const measurements = await repo.getAllMeasurements();

      expect(measurements).toHaveLength(2);
      expect(measurements[0]).toBeDefined();
    });

    it("should return empty array when no measurements exist", async () => {
      const measurements = await repo.getAllMeasurements();

      expect(measurements).toHaveLength(0);
    });
  });

  describe("getallMeasurementsBySensorMacAddress", () => {
    it("should return measurements for specific sensor", async () => {
      await sensorRepo.createSensor("sensor2", "testGW", "Sensor 2", "Description", "humidity", "Percent");
      
      await repo.createMeasurement("testSensor", new Date("2023-01-01T10:00:00Z"), 25.5, false);
      await repo.createMeasurement("testSensor", new Date("2023-01-01T11:00:00Z"), 26.0, false);
      await repo.createMeasurement("sensor2", new Date("2023-01-01T10:00:00Z"), 60.0, false);

      const measurements = await repo.getallMeasurementsBySensorMacAddress("testSensor");

      expect(measurements).toHaveLength(2);
      measurements.forEach(m => {
        expect(m.sensorMacAddress).toBe("testSensor");
      });
    });

    it("should throw NotFoundError when sensor does not exist", async () => {
      await expect(
        repo.getallMeasurementsBySensorMacAddress("nonExistentSensor")
      ).rejects.toThrow(NotFoundError);
    });

    it("should return empty array when sensor exists but has no measurements", async () => {
      const measurements = await repo.getallMeasurementsBySensorMacAddress("testSensor");

      expect(measurements).toHaveLength(0);
    });
  });

  describe("getAllMeasurementsFiltered", () => {
    beforeEach(async () => {
      await repo.createMeasurement("testSensor", new Date("2023-01-01T10:00:00Z"), 25.5, false);
      await repo.createMeasurement("testSensor", new Date("2023-01-15T10:00:00Z"), 26.0, false);
      await repo.createMeasurement("testSensor", new Date("2023-02-01T10:00:00Z"), 27.0, false);
    });

    it("should filter by date range when both dates provided", async () => {
      const startDate = new Date("2023-01-01T00:00:00Z");
      const endDate = new Date("2023-01-31T23:59:59Z");

      const measurements = await repo.getAllMeasurementsFiltered("testSensor", startDate, endDate);

      expect(measurements).toHaveLength(2);
      measurements.forEach(m => {
        expect(m.createdAt.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(m.createdAt.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });

    it("should filter by start date only", async () => {
      const startDate = new Date("2023-01-15T00:00:00Z");

      const measurements = await repo.getAllMeasurementsFiltered("testSensor", startDate);

      expect(measurements).toHaveLength(2);
      measurements.forEach(m => {
        expect(m.createdAt.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
      });
    });

    it("should filter by end date only", async () => {
      const endDate = new Date("2023-01-15T23:59:59Z");

      const measurements = await repo.getAllMeasurementsFiltered("testSensor", undefined, endDate);

      expect(measurements).toHaveLength(2);
      measurements.forEach(m => {
        expect(m.createdAt.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });

    it("should return all measurements when no dates provided", async () => {
      const measurements = await repo.getAllMeasurementsFiltered("testSensor");

      expect(measurements).toHaveLength(3);
    });

    it("should handle invalid dates gracefully", async () => {
      const invalidDate = new Date("invalid");

      const measurements = await repo.getAllMeasurementsFiltered("testSensor", invalidDate, invalidDate);

      expect(measurements).toHaveLength(3);
    });

    it("should throw NotFoundError when sensor does not exist", async () => {
      await expect(
        repo.getAllMeasurementsFiltered("nonExistentSensor")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getSingleMeasurementByMacAdd", () => {
    it("should return single measurement", async () => {
      const createdAt = new Date("2023-01-01T10:00:00Z");
      await repo.createMeasurement("testSensor", createdAt, 25, false);

      const measurement = await repo.getSingleMeasurementByMacAdd("testSensor", createdAt.toISOString());

      expect(measurement).toBeDefined();
      expect(measurement.sensorMacAddress).toBe("testSensor");
      expect(measurement.value).toBe(25);
    });

    it("should throw NotFoundError when measurement does not exist", async () => {
      await expect(
        repo.getSingleMeasurementByMacAdd("testSensor", "2023-01-01T10:00:00Z")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteMeasurement", () => {
    it("should delete existing measurement", async () => {
      const createdAt = new Date("2023-01-01T10:00:00Z");
      await repo.createMeasurement("testSensor", createdAt, 25.5, false);

      await repo.deleteMeasurement("testSensor", createdAt.toISOString());

      await expect(
        repo.getSingleMeasurementByMacAdd("testSensor", createdAt.toISOString())
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when sensor does not exist", async () => {
      await expect(
        repo.deleteMeasurement("nonExistentSensor", "2023-01-01T10:00:00Z")
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when measurement does not exist", async () => {
      await expect(
        repo.deleteMeasurement("testSensor", "2023-01-01T10:00:00Z")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("Edge cases and data integrity", () => {
    it("should handle extreme values", async () => {
      const largeValue = 999999999;
      const smallValue = -999999999;
      const preciseValue = 123;

      await repo.createMeasurement("testSensor", new Date("2023-01-01T10:00:00Z"), largeValue, false);
      await repo.createMeasurement("testSensor", new Date("2023-01-01T11:00:00Z"), smallValue, false);
      await repo.createMeasurement("testSensor", new Date("2023-01-01T12:00:00Z"), preciseValue, false);

      const measurements = await repo.getallMeasurementsBySensorMacAddress("testSensor");

      expect(measurements).toHaveLength(3);
      expect(measurements.find(m => m.value === largeValue)).toBeDefined();
      expect(measurements.find(m => m.value === smallValue)).toBeDefined();
      expect(measurements.find(m => m.value === preciseValue)).toBeDefined();
    });

    it("should handle zero and negative values", async () => {
      await repo.createMeasurement("testSensor", new Date("2023-01-01T10:00:00Z"), 0, false);
      await repo.createMeasurement("testSensor", new Date("2023-01-01T11:00:00Z"), -273, false);

      const measurements = await repo.getallMeasurementsBySensorMacAddress("testSensor");

      expect(measurements).toHaveLength(2);
      expect(measurements.find(m => m.value === 0)).toBeDefined();
      expect(measurements.find(m => m.value === -273)).toBeDefined();
    });

    it("should maintain referential integrity with sensor", async () => {
      const createdAt = new Date("2023-01-01T10:00:00Z");
      const measurement = await repo.createMeasurement("testSensor", createdAt, 25.5, false);

      expect(measurement.sensor).toBeDefined();
      expect(measurement.sensor.macAddress).toBe("testSensor");
    });

    it("should handle millisecond precision in timestamps", async () => {
      const timestamp1 = new Date("2023-01-01T10:00:00.000Z");
      const timestamp2 = new Date("2023-01-01T10:00:00.001Z");

      await repo.createMeasurement("testSensor", timestamp1, 25.5, false);
      await repo.createMeasurement("testSensor", timestamp2, 26.0, false);

      const measurements = await repo.getallMeasurementsBySensorMacAddress("testSensor");

      expect(measurements).toHaveLength(2);
    });
  });
}); 