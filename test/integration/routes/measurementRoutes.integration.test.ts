import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as measurementController from "@controllers/measurementController";
import { UserType } from "@models/UserType";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { NotFoundError } from "@models/errors/NotFoundError";
import AppError from "@models/errors/AppError";

jest.mock("@services/authService");
jest.mock("@controllers/measurementController");

describe("MeasurementRoutes integration", () => {
  const token = "Bearer faketoken";
  const networkCode = "NET01";
  const gatewayMac = "GW01";
  const sensorMac = "SENSOR01";

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- POST SENSOR MEASUREMENTS ---
  describe("POST /api/v1/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements", () => {
    const endpoint = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`;

    it("should create measurements as admin", async () => {
      const measurementData = {
        "0": { createdAt: "2023-10-01T12:00:00Z", value: 25.5 }
      };

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.createSensorMeasurement as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", token)
        .send(measurementData);

      expect(response.status).toBe(201);
      expect(authService.processToken).toHaveBeenCalledWith(token, [UserType.Admin, UserType.Operator]);
      expect(measurementController.createSensorMeasurement).toHaveBeenCalledWith(
        networkCode, gatewayMac, sensorMac, { createdAt: "2023-10-01T12:00:00Z", value: 25.5 }
      );
    });

    it("should create measurements as operator", async () => {
      const measurementData = {
        "0": { createdAt: "2023-10-01T12:00:00Z", value: 25.5 }
      };

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.createSensorMeasurement as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", token)
        .send(measurementData);

      expect(response.status).toBe(201);
      expect(authService.processToken).toHaveBeenCalledWith(token, [UserType.Admin, UserType.Operator]);
    });

    it("should reject measurement creation as viewer", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new InsufficientRightsError("Forbidden");
      });

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", token)
        .send({ "0": { createdAt: "2023-10-01T12:00:00Z", value: 25.5 } });

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Forbidden/);
    });

    it("should reject measurement creation without authentication", async () => {
      const response = await request(app)
        .post(endpoint)
        .send({ "0": { createdAt: "2023-10-01T12:00:00Z", value: 25.5 } });

      expect(response.status).toBe(403);
    });

    it("should handle multiple measurements in one request", async () => {
      const measurementData = {
        "0": { createdAt: "2023-10-01T12:00:00Z", value: 25.5 },
        "1": { createdAt: "2023-10-01T12:01:00Z", value: 26.0 }
      };

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.createSensorMeasurement as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", token)
        .send(measurementData);

      expect(response.status).toBe(201);
      expect(measurementController.createSensorMeasurement).toHaveBeenCalledTimes(2);
    });

    it("should return 404 for non-existent sensor", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.createSensorMeasurement as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Sensor not found");
      });

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", token)
        .send({ "0": { createdAt: "2023-10-01T12:00:00Z", value: 25.5 } });

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/Sensor not found/);
    });
  });

  // --- GET SENSOR MEASUREMENTS ---
  describe("GET /api/v1/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements", () => {
    const endpoint = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`;

    it("should get measurements as any authenticated user", async () => {
      const mockResult = {
        sensorMacAddress: sensorMac,
        measurements: [
          { createdAt: "2023-10-01T12:00:00.000Z", value: 25.5, isOutlier: false }
        ],
        stats: { mean: 25.5, variance: 0 }
      };

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getSensorMeasurements as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get(endpoint)
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(authService.processToken).toHaveBeenCalledWith(token, []);
    });

    it("should filter measurements by date range", async () => {
      const mockResult = { sensorMacAddress: sensorMac, measurements: [] };

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getSensorMeasurements as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get(endpoint)
        .query({
          startDate: "2023-10-01T00:00:00Z",
          endDate: "2023-10-01T23:59:59Z"
        })
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(measurementController.getSensorMeasurements).toHaveBeenCalledWith(
        networkCode, gatewayMac, sensorMac, "2023-10-01T00:00:00Z", "2023-10-01T23:59:59Z"
      );
    });

    it("should return 404 for non-existent sensor", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getSensorMeasurements as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Sensor not found");
      });

      const response = await request(app)
        .get(endpoint)
        .set("Authorization", token);

      expect(response.status).toBe(404);
    });
  });

  // --- GET SENSOR STATS ---
  describe("GET /api/v1/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/stats", () => {
    const endpoint = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/stats`;

    it("should get sensor statistics", async () => {
      const mockStats = {
        mean: 25.5,
        variance: 2.5,
        upperThreshold: 30.0,
        lowerThreshold: 21.0
      };

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getSensorStats as jest.Mock).mockResolvedValue(mockStats);

      const response = await request(app)
        .get(endpoint)
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStats);
    });

    it("should filter statistics by date range", async () => {
      const mockStats = { mean: 25.5, variance: 2.5 };

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getSensorStats as jest.Mock).mockResolvedValue(mockStats);

      const response = await request(app)
        .get(endpoint)
        .query({
          startDate: "2023-10-01T00:00:00Z",
          endDate: "2023-10-01T23:59:59Z"
        })
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(measurementController.getSensorStats).toHaveBeenCalledWith(
        networkCode, gatewayMac, sensorMac, "2023-10-01T00:00:00Z", "2023-10-01T23:59:59Z"
      );
    });
  });

  // --- GET SENSOR OUTLIERS ---
  describe("GET /api/v1/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/outliers", () => {
    const endpoint = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/outliers`;

    it("should get sensor outliers", async () => {
      const mockResult = {
        sensorMacAddress: sensorMac,
        measurements: [
          { createdAt: "2023-10-01T12:00:00.000Z", value: 100.0, isOutlier: true }
        ],
        stats: { mean: 25.5, variance: 2.5 }
      };

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getSensorOutliers as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get(endpoint)
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
    });
  });

  // --- GET NETWORK MEASUREMENTS ---
  describe("GET /api/v1/networks/:networkCode/measurements", () => {
    const endpoint = `/api/v1/networks/${networkCode}/measurements`;

    it("should get all network measurements", async () => {
      const mockResult = [
        { sensorMacAddress: "SENSOR01", measurements: [], stats: { mean: 25.5 } },
        { sensorMacAddress: "SENSOR02", measurements: [], stats: { mean: 30.0 } }
      ];

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getNetworkMeasurements as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get(endpoint)
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toEqual(mockResult);
    });

    it("should filter network measurements by sensor MACs", async () => {
      const mockResult = [{ sensorMacAddress: "SENSOR01", measurements: [] }];

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getNetworkMeasurements as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get(endpoint)
        .query({ sensorMacs: "SENSOR01,SENSOR02" })
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(measurementController.getNetworkMeasurements).toHaveBeenCalledWith(
        networkCode, ["SENSOR01", "SENSOR02"], undefined, undefined
      );
    });

    it("should filter network measurements by date range", async () => {
      const mockResult = [];

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getNetworkMeasurements as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get(endpoint)
        .query({
          startDate: "2023-10-01T00:00:00Z",
          endDate: "2023-10-01T23:59:59Z"
        })
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(measurementController.getNetworkMeasurements).toHaveBeenCalledWith(
        networkCode, undefined, "2023-10-01T00:00:00Z", "2023-10-01T23:59:59Z"
      );
    });
  });

  // --- GET NETWORK STATS ---
  describe("GET /api/v1/networks/:networkCode/stats", () => {
    const endpoint = `/api/v1/networks/${networkCode}/stats`;

    it("should get network statistics", async () => {
      const mockResult = [
        { sensorMacAddress: "SENSOR01", stats: { mean: 25.5, variance: 2.5 } },
        { sensorMacAddress: "SENSOR02", stats: { mean: 30.0, variance: 3.0 } }
      ];

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getNetworkStats as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get(endpoint)
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toEqual(mockResult);
    });
  });

  // --- GET NETWORK OUTLIERS ---
  describe("GET /api/v1/networks/:networkCode/outliers", () => {
    const endpoint = `/api/v1/networks/${networkCode}/outliers`;

    it("should get network outliers", async () => {
      const mockResult = [
        {
          sensorMacAddress: "SENSOR01",
          measurements: [{ createdAt: "2023-10-01T12:00:00.000Z", value: 100.0, isOutlier: true }],
          stats: { mean: 25.5, variance: 2.5 }
        }
      ];

      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getNetworkOutliers as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get(endpoint)
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toEqual(mockResult);
    });
  });

  // --- ERROR HANDLING TESTS ---
  describe("Error handling", () => {
    it("should handle 401 Unauthorized errors", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError("Unauthorized");
      });

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/measurements`)
        .set("Authorization", "Bearer invalid");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/);
    });

    it("should handle 500 Internal Server Error", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getNetworkMeasurements as jest.Mock).mockImplementation(() => {
        throw new AppError("Internal error", 500);
      });

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/measurements`)
        .set("Authorization", token);

      expect(response.status).toBe(500);
      expect(response.body.message).toMatch(/Internal error/);
    });
  });

  // --- ADDITIONAL EDGE CASE TESTS ---

  describe("Route Parameter Validation", () => {
    it("should handle malformed network codes", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getNetworkMeasurements as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Network not found");
      });

      const response = await request(app)
        .get("/api/v1/networks/INVALID@CODE/measurements")
        .set("Authorization", token);

      expect(response.status).toBe(404);
    });

    it("should handle malformed MAC addresses", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getSensorMeasurements as jest.Mock).mockImplementation(() => {
        throw new NotFoundError("Gateway not found");
      });

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/gateways/INVALID@MAC/sensors/${sensorMac}/measurements`)
        .set("Authorization", token);

      expect(response.status).toBe(404);
    });
  });

  describe("Query Parameter Edge Cases", () => {
    it("should handle empty sensor MAC list", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getNetworkMeasurements as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/measurements`)
        .query({ sensorMacs: "" })
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(measurementController.getNetworkMeasurements).toHaveBeenCalledWith(
        networkCode, undefined, undefined, undefined
      );
    });

    it("should handle single sensor MAC in list", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getNetworkMeasurements as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/measurements`)
        .query({ sensorMacs: "SENSOR01" })
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(measurementController.getNetworkMeasurements).toHaveBeenCalledWith(
        networkCode, ["SENSOR01"], undefined, undefined
      );
    });

    it("should handle whitespace in sensor MAC list", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getNetworkMeasurements as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/measurements`)
        .query({ sensorMacs: " SENSOR01 , SENSOR02 " })
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(measurementController.getNetworkMeasurements).toHaveBeenCalledWith(
        networkCode, [" SENSOR01 ", " SENSOR02 "], undefined, undefined
      );
    });
  });

  describe("Content-Type and Request Body Validation", () => {
    const endpoint = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`;

    it("should handle missing Content-Type header", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.createSensorMeasurement as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", token)
        .type('text')
        .send('{"0": {"createdAt": "2023-10-01T12:00:00Z", "value": 25.5}}');

      expect(response.status).toBe(201);
    });

    it("should handle empty request body", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", token)
        .send({});

      expect(response.status).toBe(201);
    });

    it("should handle malformed JSON", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", token)
        .set("Content-Type", "application/json")
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
    });
  });

  describe("Authentication Edge Cases", () => {
    it("should handle missing Authorization header", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError("Unauthorized: No token provided");
      });

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/measurements`);

      expect(response.status).toBe(401);
    });

    it("should handle malformed Authorization header", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError("Unauthorized: Invalid token format");
      });

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/measurements`)
        .set("Authorization", "InvalidFormat");

      expect(response.status).toBe(401);
    });

    it("should handle expired token", async () => {
      (authService.processToken as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedError("Token expired");
      });

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/measurements`)
        .set("Authorization", "Bearer expired-token");

      expect(response.status).toBe(401);
    });
  });

  describe("HTTP Method Validation", () => {
    it("should reject unsupported HTTP methods", async () => {
      const response = await request(app)
        .patch(`/api/v1/networks/${networkCode}/measurements`)
        .set("Authorization", token);

      expect(response.status).toBe(404);
    });

    it("should reject PUT on measurement endpoints", async () => {
      const response = await request(app)
        .put(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`)
        .set("Authorization", token);

      expect(response.status).toBe(404);
    });
  });

  describe("Response Format Validation", () => {
    it("should return proper JSON content type", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getNetworkMeasurements as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/measurements`)
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it("should handle controller returning null", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getNetworkMeasurements as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/v1/networks/${networkCode}/measurements`)
        .set("Authorization", token);

      expect(response.status).toBe(200);
      expect(response.body).toBeNull();
    });
  });

  describe("Concurrent Request Handling", () => {
    it("should handle multiple concurrent POST requests", async () => {
      const endpoint = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`;
      
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.createSensorMeasurement as jest.Mock).mockResolvedValue(undefined);

      const promises = Array(5).fill(0).map((_, i) =>
        request(app)
          .post(endpoint)
          .set("Authorization", token)
          .send({ "0": { createdAt: `2023-10-01T12:${String(i).padStart(2, '0')}:00Z`, value: 25.5 + i } })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
    });

    it("should handle multiple concurrent GET requests", async () => {
      (authService.processToken as jest.Mock).mockResolvedValue(undefined);
      (measurementController.getNetworkMeasurements as jest.Mock).mockResolvedValue([]);

      const promises = Array(10).fill(0).map(() =>
        request(app)
          .get(`/api/v1/networks/${networkCode}/measurements`)
          .set("Authorization", token)
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
}); 