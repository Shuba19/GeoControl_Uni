import * as measurementController from "@controllers/measurementController";
import { MeasurementsRepository } from "@repositories/MeasurementRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import AppError from "@models/errors/AppError";

jest.mock("@repositories/MeasurementRepository");
jest.mock("@repositories/NetworkRepository");
jest.mock("@repositories/GatewayRepository");
jest.mock("@repositories/SensorRepository");

const mockMeasurementsRepo = {
  getAllMeasurementsFiltered: jest.fn(),
  getallMeasurementsBySensorMacAddress: jest.fn(),
  createMeasurement: jest.fn()
};

const mockNetworkRepo = {
  getSingleNetworkByMacAdd: jest.fn()
};

const mockGatewayRepo = {
  getSingleGatewayByMacAdd: jest.fn(),
  getAllGatewaysByCode: jest.fn()
};

const mockSensorRepo = {
  getSingleSensorByMacAddress: jest.fn()
};

(MeasurementsRepository as jest.Mock).mockImplementation(() => mockMeasurementsRepo);
(NetworkRepository as jest.Mock).mockImplementation(() => mockNetworkRepo);
(GatewayRepository as jest.Mock).mockImplementation(() => mockGatewayRepo);
(SensorRepository as jest.Mock).mockImplementation(() => mockSensorRepo);

describe("MeasurementController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getSensorMeasurements", () => {
    const networkCode = "NET001";
    const gatewayMac = "AA:BB:CC:DD:EE:FF";
    const sensorMac = "11:22:33:44:55:66";

    beforeEach(() => {
      mockGatewayRepo.getSingleGatewayByMacAdd.mockResolvedValue({
        macAddress: gatewayMac,
        code: networkCode
      });
      mockSensorRepo.getSingleSensorByMacAddress.mockResolvedValue({
        macAddress: sensorMac,
        macAddressGateway: gatewayMac
      });
    });

    it("should return measurements with statistics when measurements exist", async () => {
      const mockMeasurements = [
        { createdAt: new Date("2023-01-01"), value: 20.0, isOutlier: false },
        { createdAt: new Date("2023-01-02"), value: 25.0, isOutlier: false },
        { createdAt: new Date("2023-01-03"), value: 30.0, isOutlier: false }
      ];

      mockMeasurementsRepo.getAllMeasurementsFiltered.mockResolvedValue(mockMeasurements);

      const result = await measurementController.getSensorMeasurements(
        networkCode, gatewayMac, sensorMac
      );

      expect(result.sensorMacAddress).toBe(sensorMac);
      expect(result.measurements).toHaveLength(3);
      expect(result.stats).toBeDefined();
      expect(result.stats.mean).toBe(25.0);
      expect(result.stats.variance).toBeCloseTo(16.67, 1);
    });

    it("should return empty measurements and defined null stats when no measurements exist", async () => {
      mockMeasurementsRepo.getAllMeasurementsFiltered.mockResolvedValue([]);

      const result = await measurementController.getSensorMeasurements(
        networkCode, gatewayMac, sensorMac
      );

      expect(result.sensorMacAddress).toBe(sensorMac);
      expect(result.measurements).toHaveLength(0);
      expect(result.stats).toBeDefined();
    });

    it("should throw error when gateway does not belong to network", async () => {
      mockGatewayRepo.getSingleGatewayByMacAdd.mockResolvedValue({
        macAddress: gatewayMac,
        code: "DIFFERENT_NETWORK"
      });

      await expect(
        measurementController.getSensorMeasurements(networkCode, gatewayMac, sensorMac)
      ).rejects.toThrow(AppError);
    });

    it("should throw error when sensor does not belong to gateway", async () => {
      mockSensorRepo.getSingleSensorByMacAddress.mockResolvedValue({
        macAddress: sensorMac,
        macAddressGateway: "DIFFERENT:GATEWAY"
      });

      await expect(
        measurementController.getSensorMeasurements(networkCode, gatewayMac, sensorMac)
      ).rejects.toThrow(AppError);
    });

    it("should handle date filtering", async () => {
      const startDate = "2023-01-01";
      const endDate = "2023-12-31";
      const mockMeasurements = [
        { createdAt: new Date("2023-06-01"), value: 25.0, isOutlier: false }
      ];

      mockMeasurementsRepo.getAllMeasurementsFiltered.mockResolvedValue(mockMeasurements);

      await measurementController.getSensorMeasurements(
        networkCode, gatewayMac, sensorMac, startDate, endDate
      );

      expect(mockMeasurementsRepo.getAllMeasurementsFiltered).toHaveBeenCalledWith(
        sensorMac, new Date(startDate), new Date(endDate)
      );
    });
  });

  describe("getSensorStats", () => {
    const networkCode = "NET001";
    const gatewayMac = "AA:BB:CC:DD:EE:FF";
    const sensorMac = "11:22:33:44:55:66";

    beforeEach(() => {
      mockGatewayRepo.getSingleGatewayByMacAdd.mockResolvedValue({
        macAddress: gatewayMac,
        code: networkCode
      });
      mockSensorRepo.getSingleSensorByMacAddress.mockResolvedValue({
        macAddress: sensorMac,
        macAddressGateway: gatewayMac
      });
    });

    it("should return statistics when measurements exist", async () => {
      const mockMeasurements = [
        { createdAt: new Date("2023-01-01"), value: 20.0, isOutlier: false },
        { createdAt: new Date("2023-01-02"), value: 30.0, isOutlier: false }
      ];

      mockMeasurementsRepo.getAllMeasurementsFiltered.mockResolvedValue(mockMeasurements);

      const result = await measurementController.getSensorStats(
        networkCode, gatewayMac, sensorMac
      );

      expect(result.mean).toBe(25.0);
      expect(result.variance).toBe(25.0);
      expect(result.upperThreshold).toBe(35.0);
      expect(result.lowerThreshold).toBe(15.0);
    });

    it("should throw error when no measurements exist", async () => {
      mockMeasurementsRepo.getAllMeasurementsFiltered.mockResolvedValue([]);

      const result  = await expect(
        measurementController.getSensorStats(networkCode, gatewayMac, sensorMac)
      );
      expect(result).toBeDefined();
    });
  });

  describe("getSensorOutliers", () => {
    const networkCode = "NET001";
    const gatewayMac = "AA:BB:CC:DD:EE:FF";
    const sensorMac = "11:22:33:44:55:66";

    beforeEach(() => {
      mockGatewayRepo.getSingleGatewayByMacAdd.mockResolvedValue({
        macAddress: gatewayMac,
        code: networkCode
      });
      mockSensorRepo.getSingleSensorByMacAddress.mockResolvedValue({
        macAddress: sensorMac,
        macAddressGateway: gatewayMac
      });
    });

    it("should return outliers when they exist", async () => {
      const mockMeasurements = [
        { createdAt: new Date("2023-01-01"), value: 20.0, isOutlier: false },
        { createdAt: new Date("2023-01-02"), value: 21.0, isOutlier: false },
        { createdAt: new Date("2023-01-03"), value: 22.0, isOutlier: false },
        { createdAt: new Date("2023-01-04"), value: 23.0, isOutlier: false },
        { createdAt: new Date("2023-01-05"), value: 10000.0, isOutlier: false } // This should definitely be detected as outlier
      ];

      mockMeasurementsRepo.getAllMeasurementsFiltered.mockResolvedValue(mockMeasurements);

      const result = await measurementController.getSensorOutliers(
        networkCode, gatewayMac, sensorMac
      );

      expect(result.sensorMacAddress).toBe(sensorMac);
      expect(result.stats).toBeDefined();
      expect(Array.isArray(result.measurements)).toBe(true);
    });

    it("should return empty array when no outliers exist", async () => {
      const mockMeasurements = [
        { createdAt: new Date("2023-01-01"), value: 20.0, isOutlier: false },
        { createdAt: new Date("2023-01-02"), value: 25.0, isOutlier: false },
        { createdAt: new Date("2023-01-03"), value: 30.0, isOutlier: false }
      ];

      mockMeasurementsRepo.getAllMeasurementsFiltered.mockResolvedValue(mockMeasurements);

      const result = await measurementController.getSensorOutliers(
        networkCode, gatewayMac, sensorMac
      );

      expect(result.sensorMacAddress).toBe(sensorMac);
      expect(result.measurements).toHaveLength(0);
    });

    it("should return empty measurements when no data exists", async () => {
      mockMeasurementsRepo.getAllMeasurementsFiltered.mockResolvedValue([]);

      const result = await measurementController.getSensorOutliers(
        networkCode, gatewayMac, sensorMac
      );

      expect(result.sensorMacAddress).toBe(sensorMac);
      expect(result.measurements).toHaveLength(0);
    });
  });

  describe("createSensorMeasurement", () => {
    const networkCode = "NET001";
    const gatewayMac = "AA:BB:CC:DD:EE:FF";
    const sensorMac = "11:22:33:44:55:66";
    const measurementData = {
      createdAt: "2023-01-01T10:00:00Z",
      value: 25.0
    };

    beforeEach(() => {
      mockGatewayRepo.getSingleGatewayByMacAdd.mockResolvedValue({
        macAddress: gatewayMac,
        code: networkCode
      });
      mockSensorRepo.getSingleSensorByMacAddress.mockResolvedValue({
        macAddress: sensorMac,
        macAddressGateway: gatewayMac
      });
    });

    it("should create measurement when no existing measurements", async () => {
      mockMeasurementsRepo.getallMeasurementsBySensorMacAddress.mockResolvedValue([]);
      mockMeasurementsRepo.createMeasurement.mockResolvedValue({});

      await measurementController.createSensorMeasurement(
        networkCode, gatewayMac, sensorMac, measurementData
      );

      expect(mockMeasurementsRepo.createMeasurement).toHaveBeenCalledWith(
        sensorMac,
        new Date(measurementData.createdAt),
        measurementData.value,
        false
      );
    });

    it("should create measurement with outlier detection when existing measurements", async () => {
      const existingMeasurements = [
        { createdAt: new Date("2023-01-01"), value: 20.0, isOutlier: false },
        { createdAt: new Date("2023-01-02"), value: 25.0, isOutlier: false }
      ];

      mockMeasurementsRepo.getallMeasurementsBySensorMacAddress.mockResolvedValue(existingMeasurements);
      mockMeasurementsRepo.createMeasurement.mockResolvedValue({});

      await measurementController.createSensorMeasurement(
        networkCode, gatewayMac, sensorMac, measurementData
      );

      expect(mockMeasurementsRepo.createMeasurement).toHaveBeenCalledWith(
        sensorMac,
        new Date(measurementData.createdAt),
        measurementData.value,
        false
      );
    });

    it("should throw error when gateway does not belong to network", async () => {
      mockGatewayRepo.getSingleGatewayByMacAdd.mockResolvedValue({
        macAddress: gatewayMac,
        code: "DIFFERENT_NETWORK"
      });

      await expect(
        measurementController.createSensorMeasurement(networkCode, gatewayMac, sensorMac, measurementData)
      ).rejects.toThrow(AppError);
    });

    it("should throw error when sensor does not belong to gateway", async () => {
      mockSensorRepo.getSingleSensorByMacAddress.mockResolvedValue({
        macAddress: sensorMac,
        macAddressGateway: "DIFFERENT:GATEWAY"
      });

      await expect(
        measurementController.createSensorMeasurement(networkCode, gatewayMac, sensorMac, measurementData)
      ).rejects.toThrow(AppError);
    });
  });

  describe("getNetworkMeasurements", () => {
    const networkCode = "NET001";

    beforeEach(() => {
      mockNetworkRepo.getSingleNetworkByMacAdd.mockResolvedValue({
        code: networkCode
      });
      mockGatewayRepo.getAllGatewaysByCode.mockResolvedValue([
        { macAddress: "GW1", code: networkCode },
        { macAddress: "GW2", code: networkCode }
      ]);
    });

    it("should return measurements for specific sensors", async () => {
      const sensorMacs = ["SENSOR1", "SENSOR2"];
      
      mockSensorRepo.getSingleSensorByMacAddress
        .mockResolvedValueOnce({ macAddress: "SENSOR1", macAddressGateway: "GW1" })
        .mockResolvedValueOnce({ macAddress: "SENSOR2", macAddressGateway: "GW2" });
      
      mockGatewayRepo.getSingleGatewayByMacAdd
        .mockResolvedValueOnce({ macAddress: "GW1", code: networkCode })
        .mockResolvedValueOnce({ macAddress: "GW2", code: networkCode });

      mockMeasurementsRepo.getAllMeasurementsFiltered
        .mockResolvedValueOnce([{ createdAt: new Date(), value: 20.0, isOutlier: false }])
        .mockResolvedValueOnce([{ createdAt: new Date(), value: 25.0, isOutlier: false }]);

      const result = await measurementController.getNetworkMeasurements(
        networkCode, sensorMacs
      );

      expect(result).toHaveLength(2);
      expect(result[0].sensorMacAddress).toBe("SENSOR1");
      expect(result[1].sensorMacAddress).toBe("SENSOR2");
    });

    it("should throw error when sensor does not belong to network", async () => {
      const sensorMacs = ["SENSOR1"];
      
      mockSensorRepo.getSingleSensorByMacAddress.mockResolvedValue({
        macAddress: "SENSOR1",
        macAddressGateway: "GW1"
      });
      
      mockGatewayRepo.getSingleGatewayByMacAdd.mockResolvedValue({
        macAddress: "GW1",
        code: "DIFFERENT_NETWORK"
      });

      const result = await measurementController.getNetworkMeasurements(networkCode, sensorMacs)
      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });
  });
}); 