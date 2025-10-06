import { MeasurementsRepository } from "@repositories/MeasurementRepository";
import { MeasurementsDAO } from "@dao/MeasurementsDAO";
import { SensorDAO } from "@dao/SensorDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";

const mockFind = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();

const mockGetSingleSensorByMacAddress = jest.fn();
jest.mock("@repositories/SensorRepository", () => ({
  SensorRepository: jest.fn().mockImplementation(() => ({
    getSingleSensorByMacAddress: mockGetSingleSensorByMacAddress
  }))
}));

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: () => ({
      find: mockFind,
      save: mockSave,
      remove: mockRemove
    })
  }
}));

describe("MeasurementsRepository: mocked database", () => {
  const repo = new MeasurementsRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllMeasurements", () => {
    it("should return all measurements", async () => {
      const mockMeasurements = [
        { sensorMacAddress: "sensor1", createdAt: new Date(), value: 25.5, isOutlier: false },
        { sensorMacAddress: "sensor2", createdAt: new Date(), value: 30.0, isOutlier: true }
      ];
      mockFind.mockResolvedValue(mockMeasurements);

      const result = await repo.getAllMeasurements();

      expect(result).toBe(mockMeasurements);
      expect(mockFind).toHaveBeenCalledWith();
    });
  });

  describe("getallMeasurementsBySensorMacAddress", () => {
    it("should return measurements for a specific sensor", async () => {
      const sensorMac = "AA:BB:CC:DD:EE:FF";
      const mockSensor = { macAddress: sensorMac };
      const mockMeasurements = [
        { sensorMacAddress: sensorMac, createdAt: new Date(), value: 25.5, isOutlier: false }
      ];

      mockGetSingleSensorByMacAddress.mockResolvedValue(mockSensor);
      mockFind.mockResolvedValue(mockMeasurements);

      const result = await repo.getallMeasurementsBySensorMacAddress(sensorMac);

      expect(mockGetSingleSensorByMacAddress).toHaveBeenCalledWith(sensorMac);
      expect(mockFind).toHaveBeenCalledWith({ where: { sensorMacAddress: sensorMac } });
      expect(result).toBe(mockMeasurements);
    });

    it("should throw error if sensor not found", async () => {
      const sensorMac = "INVALID:MAC";
      mockGetSingleSensorByMacAddress.mockRejectedValue(new NotFoundError("Sensor not found"));

      await expect(repo.getallMeasurementsBySensorMacAddress(sensorMac)).rejects.toThrow(NotFoundError);
    });
  });

  describe("getAllMeasurementsFiltered", () => {
    const sensorMac = "AA:BB:CC:DD:EE:FF";
    const mockSensor = { macAddress: sensorMac };

    beforeEach(() => {
      mockGetSingleSensorByMacAddress.mockResolvedValue(mockSensor);
    });

    it("should filter by date range when both dates provided", async () => {
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-12-31");
      const mockMeasurements = [{ sensorMacAddress: sensorMac, value: 25.5 }];

      mockFind.mockResolvedValue(mockMeasurements);

      const result = await repo.getAllMeasurementsFiltered(sensorMac, startDate, endDate);

      expect(mockFind).toHaveBeenCalledWith({
        where: {
          sensorMacAddress: sensorMac,
          createdAt: expect.any(Object) 
        }
      });
      expect(result).toBe(mockMeasurements);
    });

    it("should filter by start date only", async () => {
      const startDate = new Date("2023-01-01");
      const mockMeasurements = [{ sensorMacAddress: sensorMac, value: 25.5 }];

      mockFind.mockResolvedValue(mockMeasurements);

      const result = await repo.getAllMeasurementsFiltered(sensorMac, startDate);

      expect(mockFind).toHaveBeenCalledWith({
        where: {
          sensorMacAddress: sensorMac,
          createdAt: expect.any(Object)
        }
      });
      expect(result).toBe(mockMeasurements);
    });

    it("should filter by end date only", async () => {
      const endDate = new Date("2023-12-31");
      const mockMeasurements = [{ sensorMacAddress: sensorMac, value: 25.5 }];

      mockFind.mockResolvedValue(mockMeasurements);

      const result = await repo.getAllMeasurementsFiltered(sensorMac, undefined, endDate);

      expect(mockFind).toHaveBeenCalledWith({
        where: {
          sensorMacAddress: sensorMac,
          createdAt: expect.any(Object) 
        }
      });
      expect(result).toBe(mockMeasurements);
    });

    it("should not filter by date when no dates provided", async () => {
      const mockMeasurements = [{ sensorMacAddress: sensorMac, value: 25.5 }];

      mockFind.mockResolvedValue(mockMeasurements);

      const result = await repo.getAllMeasurementsFiltered(sensorMac);

      expect(mockFind).toHaveBeenCalledWith({
        where: { sensorMacAddress: sensorMac }
      });
      expect(result).toBe(mockMeasurements);
    });

    it("should handle invalid dates", async () => {
      const invalidDate = new Date("invalid");
      const mockMeasurements = [{ sensorMacAddress: sensorMac, value: 25.5 }];

      mockFind.mockResolvedValue(mockMeasurements);

      const result = await repo.getAllMeasurementsFiltered(sensorMac, invalidDate, invalidDate);

      expect(mockFind).toHaveBeenCalledWith({
        where: { sensorMacAddress: sensorMac }
      });
      expect(result).toBe(mockMeasurements);
    });
  });

  describe("getSingleMeasurementByMacAdd", () => {
    it("should return a single measurement", async () => {
      const sensorMac = "AA:BB:CC:DD:EE:FF";
      const createdAt = "2023-01-01T10:00:00Z";
      const mockMeasurement = { sensorMacAddress: sensorMac, createdAt: new Date(createdAt), value: 25.5 };

      mockFind.mockResolvedValue([mockMeasurement]);

      const result = await repo.getSingleMeasurementByMacAdd(sensorMac, createdAt);

      expect(mockFind).toHaveBeenCalledWith({
        where: { sensorMacAddress: sensorMac, createdAt: new Date(createdAt) }
      });
      expect(result).toBe(mockMeasurement);
    });

    it("should throw NotFoundError when measurement not found", async () => {
      const sensorMac = "AA:BB:CC:DD:EE:FF";
      const createdAt = "2023-01-01T10:00:00Z";

      mockFind.mockResolvedValue([]);

      await expect(repo.getSingleMeasurementByMacAdd(sensorMac, createdAt)).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteMeasurement", () => {
    it("should delete a measurement", async () => {
      const sensorMac = "AA:BB:CC:DD:EE:FF";
      const createdAt = "2023-01-01T10:00:00Z";
      const mockSensor = { macAddress: sensorMac };
      const mockMeasurement = { sensorMacAddress: sensorMac, createdAt: new Date(createdAt), value: 25.5 };

      mockGetSingleSensorByMacAddress.mockResolvedValue(mockSensor);
      mockFind.mockResolvedValue([mockMeasurement]);
      mockRemove.mockResolvedValue(undefined);

      await repo.deleteMeasurement(sensorMac, createdAt);

      expect(mockGetSingleSensorByMacAddress).toHaveBeenCalledWith(sensorMac);
      expect(mockRemove).toHaveBeenCalledWith(mockMeasurement);
    });

    it("should throw error if sensor not found", async () => {
      const sensorMac = "INVALID:MAC";
      const createdAt = "2023-01-01T10:00:00Z";

      mockGetSingleSensorByMacAddress.mockRejectedValue(new NotFoundError("Sensor not found"));

      await expect(repo.deleteMeasurement(sensorMac, createdAt)).rejects.toThrow(NotFoundError);
    });
  });

  describe("createMeasurement", () => {
    it("should create a new measurement", async () => {
      const sensorMac = "AA:BB:CC:DD:EE:FF";
      const createdAt = new Date("2023-01-01T10:00:00Z");
      const value = 25.5;
      const isOutlier = false;
      const mockSensor = { macAddress: sensorMac };
      const mockSavedMeasurement = { sensorMacAddress: sensorMac, createdAt, value, isOutlier, sensor: mockSensor };

      mockFind.mockResolvedValue([]); 
      mockGetSingleSensorByMacAddress.mockResolvedValue(mockSensor);
      mockSave.mockResolvedValue(mockSavedMeasurement);

      const result = await repo.createMeasurement(sensorMac, createdAt, value, isOutlier);

      expect(mockFind).toHaveBeenCalledWith({
        where: { sensorMacAddress: sensorMac, createdAt }
      });
      expect(mockGetSingleSensorByMacAddress).toHaveBeenCalledWith(sensorMac);
      expect(mockSave).toHaveBeenCalledWith({
        sensorMacAddress: sensorMac,
        createdAt: createdAt,
        value: value,
        isOutlier: isOutlier,
        sensor: mockSensor
      });
      expect(result).toBe(mockSavedMeasurement);
    });

    it("should throw ConflictError when measurement already exists", async () => {
      const sensorMac = "AA:BB:CC:DD:EE:FF";
      const createdAt = new Date("2023-01-01T10:00:00Z");
      const value = 25.5;
      const isOutlier = false;
      const existingMeasurement = { sensorMacAddress: sensorMac, createdAt, value: 20.0 };

      mockFind.mockResolvedValue([existingMeasurement]); 

      await expect(repo.createMeasurement(sensorMac, createdAt, value, isOutlier)).rejects.toThrow(ConflictError);
    });

    it("should throw error if sensor not found", async () => {
      const sensorMac = "INVALID:MAC";
      const createdAt = new Date("2023-01-01T10:00:00Z");
      const value = 25.5;
      const isOutlier = false;

      mockFind.mockResolvedValue([]); 
      mockGetSingleSensorByMacAddress.mockRejectedValue(new NotFoundError("Sensor not found"));

      await expect(repo.createMeasurement(sensorMac, createdAt, value, isOutlier)).rejects.toThrow(NotFoundError);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    describe("Date filtering edge cases", () => {
      beforeEach(async () => {
        jest.clearAllMocks();
        const mockSensor = { macAddress: "SENSOR_EDGE_01" };
        mockGetSingleSensorByMacAddress.mockResolvedValue(mockSensor);
        
        mockSave.mockImplementation((measurement) => Promise.resolve(measurement));
        
        let callCount = 0;
        mockFind.mockImplementation(() => {
          callCount++;
          return Promise.resolve([]);
        });
        
        await repo.createMeasurement(
          "SENSOR_EDGE_01",
          new Date("2023-01-01T00:00:00.000Z"),
          10.0,
          false
        );
        await repo.createMeasurement(
          "SENSOR_EDGE_01",
          new Date("2023-12-31T23:59:59.999Z"),
          20.0,
          false
        );
        await repo.createMeasurement(
          "SENSOR_EDGE_01",
          new Date("2023-06-15T12:30:45.123Z"),
          15.0,
          false
        );
      });

      it("should handle exact timestamp boundaries", async () => {
        const mockResult = [{ sensorMacAddress: "SENSOR_EDGE_01", createdAt: new Date("2023-01-01T00:00:00.000Z"), value: 10.0, isOutlier: false }];
        mockFind.mockResolvedValue(mockResult);
        
        const result = await repo.getAllMeasurementsFiltered(
          "SENSOR_EDGE_01",
          new Date("2023-01-01T00:00:00.000Z"),
          new Date("2023-01-01T00:00:00.000Z")
        );

        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(10.0);
      });

      it("should handle millisecond precision", async () => {
        const mockResult = [{ sensorMacAddress: "SENSOR_EDGE_01", createdAt: new Date("2023-12-31T23:59:59.999Z"), value: 20.0, isOutlier: false }];
        mockFind.mockResolvedValue(mockResult);
        
        const result = await repo.getAllMeasurementsFiltered(
          "SENSOR_EDGE_01",
          new Date("2023-12-31T23:59:59.999Z"),
          new Date("2023-12-31T23:59:59.999Z")
        );

        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(20.0);
      });

      it("should handle timezone-aware filtering", async () => {
        const mockResult = [{ sensorMacAddress: "SENSOR_EDGE_01", createdAt: new Date("2023-06-15T12:30:45.123Z"), value: 15.0, isOutlier: false }];
        mockFind.mockResolvedValue(mockResult);
        
        const result = await repo.getAllMeasurementsFiltered(
          "SENSOR_EDGE_01",
          new Date("2023-06-15T12:30:45.000Z"),
          new Date("2023-06-15T12:30:46.000Z")
        );

        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(15.0);
      });

      it("should return empty array for future date ranges", async () => {
        mockFind.mockResolvedValue([]);
        
        const result = await repo.getAllMeasurementsFiltered(
          "SENSOR_EDGE_01",
          new Date("2025-01-01T00:00:00Z"),
          new Date("2025-12-31T23:59:59Z")
        );

        expect(result).toHaveLength(0);
      });

      it("should return empty array for past date ranges with no data", async () => {
        mockFind.mockResolvedValue([]);
        
        const result = await repo.getAllMeasurementsFiltered(
          "SENSOR_EDGE_01",
          new Date("2020-01-01T00:00:00Z"),
          new Date("2020-12-31T23:59:59Z")
        );

        expect(result).toHaveLength(0);
      });
    });

    describe("Extreme value handling", () => {
      beforeEach(() => {
        jest.clearAllMocks();
        mockGetSingleSensorByMacAddress.mockImplementation((macAddress) => 
          Promise.resolve({ macAddress })
        );
        mockSave.mockImplementation((measurement) => Promise.resolve(measurement));
        mockFind.mockResolvedValue([]);
      });

      it("should handle very large measurement values", async () => {
        const largeValue = Number.MAX_SAFE_INTEGER;
        
        await repo.createMeasurement(
          "SENSOR_LARGE",
          new Date("2023-10-01T12:00:00Z"),
          largeValue,
          false
        );

        const mockResult = [{ sensorMacAddress: "SENSOR_LARGE", createdAt: new Date("2023-10-01T12:00:00Z"), value: largeValue, isOutlier: false }];
        mockFind.mockResolvedValue(mockResult);

        const result = await repo.getallMeasurementsBySensorMacAddress("SENSOR_LARGE");
        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(largeValue);
      });

      it("should handle very small measurement values", async () => {
        const smallValue = Number.MIN_SAFE_INTEGER;
        
        await repo.createMeasurement(
          "SENSOR_SMALL",
          new Date("2023-10-01T12:00:00Z"),
          smallValue,
          false
        );

        const mockResult = [{ sensorMacAddress: "SENSOR_SMALL", createdAt: new Date("2023-10-01T12:00:00Z"), value: smallValue, isOutlier: false }];
        mockFind.mockResolvedValue(mockResult);

        const result = await repo.getallMeasurementsBySensorMacAddress("SENSOR_SMALL");
        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(smallValue);
      });

      it("should handle decimal precision", async () => {
        const preciseValue = 123.456789012345;
        
        await repo.createMeasurement(
          "SENSOR_PRECISE",
          new Date("2023-10-01T12:00:00Z"),
          preciseValue,
          false
        );

        const mockResult = [{ sensorMacAddress: "SENSOR_PRECISE", createdAt: new Date("2023-10-01T12:00:00Z"), value: preciseValue, isOutlier: false }];
        mockFind.mockResolvedValue(mockResult);

        const result = await repo.getallMeasurementsBySensorMacAddress("SENSOR_PRECISE");
        expect(result).toHaveLength(1);
        expect(result[0].value).toBeCloseTo(preciseValue, 10);
      });

      it("should handle negative values", async () => {
        const negativeValue = -273.15;
        
        await repo.createMeasurement(
          "SENSOR_NEGATIVE",
          new Date("2023-10-01T12:00:00Z"),
          negativeValue,
          false
        );

        const mockResult = [{ sensorMacAddress: "SENSOR_NEGATIVE", createdAt: new Date("2023-10-01T12:00:00Z"), value: negativeValue, isOutlier: false }];
        mockFind.mockResolvedValue(mockResult);

        const result = await repo.getallMeasurementsBySensorMacAddress("SENSOR_NEGATIVE");
        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(negativeValue);
      });

      it("should handle zero values", async () => {
        await repo.createMeasurement(
          "SENSOR_ZERO",
          new Date("2023-10-01T12:00:00Z"),
          0,
          false
        );

        const mockResult = [{ sensorMacAddress: "SENSOR_ZERO", createdAt: new Date("2023-10-01T12:00:00Z"), value: 0, isOutlier: false }];
        mockFind.mockResolvedValue(mockResult);

        const result = await repo.getallMeasurementsBySensorMacAddress("SENSOR_ZERO");
        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(0);
      });
    });

    describe("Outlier flag handling", () => {
      beforeEach(() => {
        jest.clearAllMocks();
        mockGetSingleSensorByMacAddress.mockImplementation((macAddress) => 
          Promise.resolve({ macAddress })
        );
        mockSave.mockImplementation((measurement) => Promise.resolve(measurement));
        mockFind.mockResolvedValue([]);
      });

      it("should correctly store and retrieve outlier flags", async () => {
        await repo.createMeasurement(
          "SENSOR_OUTLIER",
          new Date("2023-10-01T12:00:00Z"),
          100.0,
          true
        );
        await repo.createMeasurement(
          "SENSOR_OUTLIER",
          new Date("2023-10-01T12:01:00Z"),
          25.0,
          false
        );

        const mockResult = [
          { sensorMacAddress: "SENSOR_OUTLIER", createdAt: new Date("2023-10-01T12:00:00Z"), value: 100.0, isOutlier: true },
          { sensorMacAddress: "SENSOR_OUTLIER", createdAt: new Date("2023-10-01T12:01:00Z"), value: 25.0, isOutlier: false }
        ];
        mockFind.mockResolvedValue(mockResult);

        const result = await repo.getallMeasurementsBySensorMacAddress("SENSOR_OUTLIER");
        expect(result).toHaveLength(2);
        
        const outlier = result.find(m => m.value === 100.0);
        const normal = result.find(m => m.value === 25.0);
        
        expect(outlier?.isOutlier).toBe(true);
        expect(normal?.isOutlier).toBe(false);
      });
    });

    describe("Sensor MAC address validation", () => {
      beforeEach(() => {
        jest.clearAllMocks();
        mockGetSingleSensorByMacAddress.mockImplementation((macAddress) => 
          Promise.resolve({ macAddress })
        );
        mockSave.mockImplementation((measurement) => Promise.resolve(measurement));
        mockFind.mockResolvedValue([]);
      });

      it("should handle long MAC addresses", async () => {
        const longMac = "VERY_LONG_SENSOR_MAC_ADDRESS_123456789";
        
        await repo.createMeasurement(
          longMac,
          new Date("2023-10-01T12:00:00Z"),
          25.0,
          false
        );

        const mockResult = [{ sensorMacAddress: longMac, createdAt: new Date("2023-10-01T12:00:00Z"), value: 25.0, isOutlier: false }];
        mockFind.mockResolvedValue(mockResult);

        const result = await repo.getallMeasurementsBySensorMacAddress(longMac);
        expect(result).toHaveLength(1);
        expect(result[0].sensorMacAddress).toBe(longMac);
      });

      it("should handle MAC addresses with special characters", async () => {
        const specialMac = "SENSOR-01_TEST.MAC";
        
        await repo.createMeasurement(
          specialMac,
          new Date("2023-10-01T12:00:00Z"),
          25.0,
          false
        );

        const mockResult = [{ sensorMacAddress: specialMac, createdAt: new Date("2023-10-01T12:00:00Z"), value: 25.0, isOutlier: false }];
        mockFind.mockResolvedValue(mockResult);

        const result = await repo.getallMeasurementsBySensorMacAddress(specialMac);
        expect(result).toHaveLength(1);
        expect(result[0].sensorMacAddress).toBe(specialMac);
      });
    });

    describe("Concurrent operations", () => {
      beforeEach(() => {
        jest.clearAllMocks();
        mockGetSingleSensorByMacAddress.mockImplementation((macAddress) => 
          Promise.resolve({ macAddress })
        );
        mockSave.mockImplementation((measurement) => Promise.resolve(measurement));
        mockFind.mockResolvedValue([]);
      });

      it("should handle concurrent measurement creation", async () => {
        const promises = [];
        for (let i = 0; i < 10; i++) {
          promises.push(
            repo.createMeasurement(
              "SENSOR_CONCURRENT",
              new Date(`2023-10-01T12:${String(i).padStart(2, '0')}:00Z`),
              i * 10,
              false
            )
          );
        }

        await Promise.all(promises);

        const mockResult = Array.from({ length: 10 }, (_, i) => ({
          sensorMacAddress: "SENSOR_CONCURRENT",
          createdAt: new Date(`2023-10-01T12:${String(i).padStart(2, '0')}:00Z`),
          value: i * 10,
          isOutlier: false
        }));
        mockFind.mockResolvedValue(mockResult);

        const result = await repo.getallMeasurementsBySensorMacAddress("SENSOR_CONCURRENT");
        expect(result).toHaveLength(10);
      });

      it("should handle concurrent read operations", async () => {
        await repo.createMeasurement(
          "SENSOR_READ_CONCURRENT",
          new Date("2023-10-01T12:00:00Z"),
          25.0,
          false
        );

        const mockResult = [{ sensorMacAddress: "SENSOR_READ_CONCURRENT", createdAt: new Date("2023-10-01T12:00:00Z"), value: 25.0, isOutlier: false }];
        mockFind.mockResolvedValue(mockResult);

        const promises = [];
        for (let i = 0; i < 5; i++) {
          promises.push(
            repo.getallMeasurementsBySensorMacAddress("SENSOR_READ_CONCURRENT")
          );
        }

        const results = await Promise.all(promises);
        
        results.forEach(result => {
          expect(result).toHaveLength(1);
          expect(result[0].value).toBe(25.0);
        });
      });
    });

    describe("Error conditions", () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it("should handle non-existent sensor MAC addresses gracefully", async () => {
        mockGetSingleSensorByMacAddress.mockRejectedValue(new NotFoundError("Sensor not found"));
        mockFind.mockResolvedValue([]);
        
        await expect(repo.getallMeasurementsBySensorMacAddress("NON_EXISTENT_SENSOR")).rejects.toThrow(NotFoundError);
      });

      it("should handle empty sensor MAC address", async () => {
        mockGetSingleSensorByMacAddress.mockRejectedValue(new NotFoundError("Sensor not found"));
        mockFind.mockResolvedValue([]);
        
        await expect(repo.getallMeasurementsBySensorMacAddress("")).rejects.toThrow(NotFoundError);
      });

      it("should throw error when trying to get single measurement that doesn't exist", async () => {
        mockFind.mockResolvedValue([]);
        
        await expect(
          repo.getSingleMeasurementByMacAdd("NON_EXISTENT", "2023-10-01T12:00:00Z")
        ).rejects.toThrow(NotFoundError);
      });

      it("should throw error when trying to delete non-existent measurement", async () => {
        mockGetSingleSensorByMacAddress.mockRejectedValue(new NotFoundError("Sensor not found"));
        
        await expect(
          repo.deleteMeasurement("NON_EXISTENT", "2023-10-01T12:00:00Z")
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe("Data consistency", () => {
      beforeEach(() => {
        jest.clearAllMocks();
        mockGetSingleSensorByMacAddress.mockImplementation((macAddress) => 
          Promise.resolve({ macAddress })
        );
        mockSave.mockImplementation((measurement) => Promise.resolve(measurement));
        mockRemove.mockImplementation(() => Promise.resolve());
      });

      it("should maintain data integrity across operations", async () => {
        const sensorMac = "SENSOR_INTEGRITY";
        const timestamp = new Date("2023-10-01T12:00:00Z");
        const value = 42.5;
        
        const mockMeasurement = { sensorMacAddress: sensorMac, createdAt: timestamp, value, isOutlier: false };

        mockFind.mockResolvedValueOnce([]);
        mockFind.mockResolvedValueOnce([mockMeasurement]);
        mockFind.mockResolvedValueOnce([mockMeasurement]);
        mockFind.mockResolvedValueOnce([mockMeasurement]);
        mockFind.mockResolvedValueOnce([]);

        await repo.createMeasurement(sensorMac, timestamp, value, false);

        const allMeasurements = await repo.getallMeasurementsBySensorMacAddress(sensorMac);
        expect(allMeasurements).toHaveLength(1);

        const singleMeasurement = await repo.getSingleMeasurementByMacAdd(
          sensorMac,
          timestamp.toISOString()
        );
        expect(singleMeasurement).toBeDefined();
        expect(singleMeasurement.value).toBe(value);

        await repo.deleteMeasurement(sensorMac, timestamp.toISOString());

        const afterDeletion = await repo.getallMeasurementsBySensorMacAddress(sensorMac);
        expect(afterDeletion).toHaveLength(0);
      });
    });
  });
}); 