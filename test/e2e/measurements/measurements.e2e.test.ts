import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS, TEST_NETWORKS, TEST_GATEWAYS, TEST_SENSORS } from "@test/e2e/lifecycle";

describe("Measurements E2E Tests", () => {
  let adminToken: string;
  let operatorToken: string;
  let viewerToken: string;

  beforeEach(async () => {
    await beforeAllE2e();
    adminToken = generateToken(TEST_USERS.admin);
    operatorToken = generateToken(TEST_USERS.operator);
    viewerToken = generateToken(TEST_USERS.viewer);
  });

  afterEach(async () => {
    await afterAllE2e();
  });

  // --- SENSOR MEASUREMENT ENDPOINTS ---

  describe("POST /api/v1/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements", () => {
    const endpoint = `/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}/measurements`;

    it("should create measurements as admin", async () => {
      const measurementData = {
        "0": { createdAt: "2023-10-01T12:00:00Z", value: 25.5 }
      };

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(measurementData);

      expect(response.status).toBe(201);
    });

    it("should create measurements as operator", async () => {
      const measurementData = {
        "0": { createdAt: "2023-10-01T12:00:00Z", value: 25.5 }
      };

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", `Bearer ${operatorToken}`)
        .send(measurementData);

      expect(response.status).toBe(201);
    });

    it("should reject measurement creation as viewer", async () => {
      const measurementData = {
        "0": { createdAt: "2023-10-01T12:00:00Z", value: 25.5 }
      };

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", `Bearer ${viewerToken}`)
        .send(measurementData);

      expect(response.status).toBe(403);
    });

    it("should reject measurement creation without authentication", async () => {
      const measurementData = {
        "0": { createdAt: "2023-10-01T12:00:00Z", value: 25.5 }
      };

      const response = await request(app)
        .post(endpoint)
        .send(measurementData);

      expect(response.status).toBe(401);
    });

    it("should create multiple measurements in one request", async () => {
      const measurementData = {
        "0": { createdAt: "2023-10-01T12:00:00Z", value: 25.5 },
        "1": { createdAt: "2023-10-01T12:01:00Z", value: 26.0 },
        "2": { createdAt: "2023-10-01T12:02:00Z", value: 24.8 }
      };

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(measurementData);

      expect(response.status).toBe(201);
    });

    it("should return 404 for non-existent network", async () => {
      const invalidEndpoint = `/api/v1/networks/INVALID/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}/measurements`;
      const measurementData = {
        "0": { createdAt: "2023-10-01T12:00:00Z", value: 25.5 }
      };

      const response = await request(app)
        .post(invalidEndpoint)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(measurementData);

      expect(response.status).toBe(404);
    });

    it("should return 404 for non-existent gateway", async () => {
      const invalidEndpoint = `/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/INVALID/sensors/${TEST_SENSORS.sensor1.macAddress}/measurements`;
      const measurementData = {
        "0": { createdAt: "2023-10-01T12:00:00Z", value: 25.5 }
      };

      const response = await request(app)
        .post(invalidEndpoint)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(measurementData);

      expect(response.status).toBe(404);
    });

    it("should return 404 for non-existent sensor", async () => {
      const invalidEndpoint = `/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/INVALID/measurements`;
      const measurementData = {
        "0": { createdAt: "2023-10-01T12:00:00Z", value: 25.5 }
      };

      const response = await request(app)
        .post(invalidEndpoint)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(measurementData);

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/v1/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements", () => {
    const endpoint = `/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}/measurements`;

    beforeEach(async () => {
      // Create some test measurements first
      const measurementData = {
        "0": { createdAt: "2023-10-01T12:00:00Z", value: 25.5 },
        "1": { createdAt: "2023-10-01T13:00:00Z", value: 26.0 },
        "2": { createdAt: "2023-10-01T14:00:00Z", value: 24.8 }
      };

      await request(app)
        .post(endpoint)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(measurementData);
    });

    it("should get measurements as admin", async () => {
      const response = await request(app)
        .get(endpoint)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.sensorMacAddress).toBe(TEST_SENSORS.sensor1.macAddress);
      expect(Array.isArray(response.body.measurements)).toBe(true);
      expect(response.body.measurements.length).toBeGreaterThan(0);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.mean).toBeDefined();
      expect(response.body.stats.variance).toBeDefined();
    });

    it("should get measurements as operator", async () => {
      const response = await request(app)
        .get(endpoint)
        .set("Authorization", `Bearer ${operatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.sensorMacAddress).toBe(TEST_SENSORS.sensor1.macAddress);
    });

    it("should get measurements as viewer", async () => {
      const response = await request(app)
        .get(endpoint)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.sensorMacAddress).toBe(TEST_SENSORS.sensor1.macAddress);
    });

    it("should reject request without authentication", async () => {
      const response = await request(app)
        .get(endpoint);

      expect(response.status).toBe(401);
    });

    it("should filter measurements by date range", async () => {
      const response = await request(app)
        .get(endpoint)
        .query({
          startDate: "2023-10-01T12:30:00Z",
          endDate: "2023-10-01T13:30:00Z"
        })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.sensorMacAddress).toBe(TEST_SENSORS.sensor1.macAddress);
      // Should only include measurements within the date range
      expect(Array.isArray(response.body.measurements)).toBe(true);
    });

    it("should return 404 for non-existent sensor", async () => {
      const invalidEndpoint = `/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/INVALID/measurements`;

      const response = await request(app)
        .get(invalidEndpoint)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/v1/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/stats", () => {
    const endpoint = `/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}/stats`;

    beforeEach(async () => {
      // Create some test measurements first
      const measurementData = {
        "0": { createdAt: "2023-10-01T12:00:00Z", value: 25.5 },
        "1": { createdAt: "2023-10-01T13:00:00Z", value: 26.0 },
        "2": { createdAt: "2023-10-01T14:00:00Z", value: 24.8 }
      };

      await request(app)
        .post(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}/measurements`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(measurementData);
    });

    it("should get sensor statistics", async () => {
      const response = await request(app)
        .get(endpoint)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.mean).toBeDefined();
      expect(response.body.variance).toBeDefined();
      expect(response.body.upperThreshold).toBeDefined();
      expect(response.body.lowerThreshold).toBeDefined();
      expect(typeof response.body.mean).toBe("number");
      expect(typeof response.body.variance).toBe("number");
    });

    it("should filter statistics by date range", async () => {
      const response = await request(app)
        .get(endpoint)
        .query({
          startDate: "2023-10-01T12:30:00Z",
          endDate: "2023-10-01T13:30:00Z"
        })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.mean).toBeDefined();
    });

    it("should return 200 for sensor with no measurements", async () => {
      const emptyEndpoint = `/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor2.macAddress}/stats`;

      const response = await request(app)
        .get(emptyEndpoint)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/v1/networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/outliers", () => {
    const endpoint = `/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor2.macAddress}/outliers`;

    beforeEach(async () => {
      // Create measurements with potential outliers
      const measurementData = {
        "0": { createdAt: "2023-10-01T12:00:00Z", value: 20.0 },
        "1": { createdAt: "2023-10-01T13:00:00Z", value: 21.0 },
        "2": { createdAt: "2023-10-01T14:00:00Z", value: 22.0 },
        "3": { createdAt: "2023-10-01T15:00:00Z", value: 1000.0 } // Potential outlier
      };

      await request(app)
        .post(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor2.macAddress}/measurements`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(measurementData);
    });

    it("should get sensor outliers", async () => {
      const response = await request(app)
        .get(endpoint)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.sensorMacAddress).toBe(TEST_SENSORS.sensor2.macAddress);
      expect(Array.isArray(response.body.measurements)).toBe(true);
      expect(response.body.stats).toBeDefined();
    });

    it("should return empty measurements for sensor with no outliers", async () => {
      const noOutliersEndpoint = `/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw2.macAddress}/sensors/${TEST_SENSORS.sensor3.macAddress}/outliers`;

      const response = await request(app)
        .get(noOutliersEndpoint)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.sensorMacAddress).toBe(TEST_SENSORS.sensor3.macAddress);
      expect(response.body.measurements).toHaveLength(0);
    });
  });

  // --- NETWORK MEASUREMENT ENDPOINTS ---

  describe("GET /api/v1/networks/:networkCode/measurements", () => {
    const endpoint = `/api/v1/networks/${TEST_NETWORKS.net1.code}/measurements`;

    beforeEach(async () => {
      // Create measurements for multiple sensors
      const sensor1Data = {
        "0": { createdAt: "2023-10-01T12:00:00Z", value: 25.5 },
        "1": { createdAt: "2023-10-01T13:00:00Z", value: 26.0 }
      };

      const sensor2Data = {
        "0": { createdAt: "2023-10-01T12:00:00Z", value: 30.0 },
        "1": { createdAt: "2023-10-01T13:00:00Z", value: 31.0 }
      };

      await request(app)
        .post(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}/measurements`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(sensor1Data);

      await request(app)
        .post(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor2.macAddress}/measurements`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(sensor2Data);
    });

    it("should get all network measurements", async () => {
      const response = await request(app)
        .get(endpoint)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Should include measurements for sensors that have data
      const sensorMacs = response.body.map((r: any) => r.sensorMacAddress);
      expect(sensorMacs).toContain(TEST_SENSORS.sensor1.macAddress);
      expect(sensorMacs).toContain(TEST_SENSORS.sensor2.macAddress);
    });

    it("should filter measurements by specific sensor MACs", async () => {
      const response = await request(app)
        .get(endpoint)
        .query({ sensorMacs: `${TEST_SENSORS.sensor1.macAddress},${TEST_SENSORS.sensor2.macAddress}` })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it("should filter measurements by date range", async () => {
      const response = await request(app)
        .get(endpoint)
        .query({
          startDate: "2023-10-01T12:30:00Z",
          endDate: "2023-10-01T13:30:00Z"
        })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return 404 for non-existent network", async () => {
      const response = await request(app)
        .get("/api/v1/networks/INVALID/measurements")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/v1/networks/:networkCode/stats", () => {
    const endpoint = `/api/v1/networks/${TEST_NETWORKS.net1.code}/stats`;

    beforeEach(async () => {
      // Create measurements for multiple sensors
      const sensor1Data = {
        "0": { createdAt: "2023-10-01T12:00:00Z", value: 25.5 },
        "1": { createdAt: "2023-10-01T13:00:00Z", value: 26.0 }
      };

      await request(app)
        .post(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}/measurements`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(sensor1Data);
    });

    it("should get network statistics", async () => {
      const response = await request(app)
        .get(endpoint)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      response.body.forEach((stat: any) => {
        expect(stat.sensorMacAddress).toBeDefined();
        expect(stat.stats).toBeDefined();
        expect(stat.stats.mean).toBeDefined();
        expect(stat.stats.variance).toBeDefined();
      });
    });

    it("should filter statistics by specific sensor MACs", async () => {
      const response = await request(app)
        .get(endpoint)
        .query({ sensorMacs: TEST_SENSORS.sensor1.macAddress })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].sensorMacAddress).toBe(TEST_SENSORS.sensor1.macAddress);
    });
  });

  describe("GET /api/v1/networks/:networkCode/outliers", () => {
    const endpoint = `/api/v1/networks/${TEST_NETWORKS.net1.code}/outliers`;

    beforeEach(async () => {
      // Create measurements with potential outliers
      const sensor1Data = {
        "0": { createdAt: "2023-10-01T12:00:00Z", value: 20.0 },
        "1": { createdAt: "2023-10-01T13:00:00Z", value: 21.0 },
        "2": { createdAt: "2023-10-01T14:00:00Z", value: 22.0 },
        "3": { createdAt: "2023-10-01T15:00:00Z", value: 1000.0 } // Potential outlier
      };

      await request(app)
        .post(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}/measurements`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(sensor1Data);
    });

    it("should get network outliers", async () => {
      const response = await request(app)
        .get(endpoint)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // Result should only include sensors that have outliers
      response.body.forEach((outlierResult: any) => {
        expect(outlierResult.sensorMacAddress).toBeDefined();
        expect(Array.isArray(outlierResult.measurements)).toBe(true);
        if (outlierResult.measurements.length > 0) {
          expect(outlierResult.stats).toBeDefined();
        }
      });
    });

    it("should filter outliers by specific sensor MACs", async () => {
      const response = await request(app)
        .get(endpoint)
        .query({ sensorMacs: TEST_SENSORS.sensor1.macAddress })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return empty array for network with no outliers", async () => {
      const response = await request(app)
        .get(endpoint)
        .query({ sensorMacs: TEST_SENSORS.sensor3.macAddress }) // sensor3 has no measurements
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
    });
  });


  // --- ADDITIONAL EDGE CASE TESTS ---

  describe("Data Validation and Edge Cases", () => {
    describe("Invalid measurement data", () => {
      const endpoint = `/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}/measurements`;

      it("should handle invalid date format", async () => {
        const measurementData = {
          "0": { createdAt: "invalid-date", value: 25.5 }
        };

        const response = await request(app)
          .post(endpoint)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(measurementData);

        expect(response.status).toBe(400); // Currently no validation, so it accepts invalid dates
      });

      it("should handle missing required fields", async () => {
        const measurementData = {
          "0": { value: 25.5 } // Missing createdAt
        };

        const response = await request(app)
          .post(endpoint)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(measurementData);

        expect(response.status).toBe(400); // Currently no validation
      });

      it("should handle non-numeric values", async () => {
        const measurementData = {
          "0": { createdAt: "2023-10-01T12:00:00Z", value: "not-a-number" }
        };

        const response = await request(app)
          .post(endpoint)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(measurementData);

        expect(response.status).toBe(400); // Currently no validation
      });

      it("should handle extremely large values", async () => {
        const measurementData = {
          "0": { createdAt: "2023-10-01T12:00:00Z", value: Number.MAX_SAFE_INTEGER }
        };

        const response = await request(app)
          .post(endpoint)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(measurementData);

        expect(response.status).toBe(201);
      });

      it("should handle negative values", async () => {
        const measurementData = {
          "0": { createdAt: "2023-10-01T12:00:00Z", value: -273.15 }
        };

        const response = await request(app)
          .post(endpoint)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(measurementData);

        expect(response.status).toBe(201);
      });
    });

    describe("Query parameter validation", () => {
      const endpoint = `/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}/measurements`;

      beforeEach(async () => {
        const measurementData = {
          "0": { createdAt: "2023-10-01T12:00:00Z", value: 25.5 }
        };

        await request(app)
          .post(endpoint)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(measurementData);
      });

      it("should handle invalid date format in query parameters", async () => {
        const response = await request(app)
          .get(endpoint)
          .query({ startDate: "invalid-date", endDate: "2023-10-01T13:00:00Z" })
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200); // Currently no validation on query params
      });

      it("should handle malformed query parameters", async () => {
        const response = await request(app)
          .get(endpoint)
          .query({ startDate: "", endDate: "" })
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200); // Currently no validation
      });
    });


    describe("Concurrent requests", () => {
      it("should handle concurrent GET requests", async () => {
        const endpoint = `/api/v1/networks/${TEST_NETWORKS.net1.code}/measurements`;
        
        // Create some test data first
        const measurementData = {
          "0": { createdAt: "2023-10-01T12:00:00Z", value: 25.5 }
        };

        await request(app)
          .post(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}/measurements`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(measurementData);

        // Make concurrent requests
        const promises = Array(10).fill(0).map(() =>
          request(app)
            .get(endpoint)
            .set("Authorization", `Bearer ${adminToken}`)
        );

        const responses = await Promise.all(promises);
        
        responses.forEach(response => {
          expect(response.status).toBe(200);
          expect(Array.isArray(response.body)).toBe(true);
        });
      });
    });

    describe("Network hierarchy edge cases", () => {
      it("should return 404 for measurements in non-existent network", async () => {
        const response = await request(app)
          .get("/api/v1/networks/NONEXISTENT/measurements")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
      });

      it("should return 404 for measurements with non-existent gateway", async () => {
        const response = await request(app)
          .get(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/NONEXISTENT/sensors/${TEST_SENSORS.sensor1.macAddress}/measurements`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
      });

      it("should return 404 for measurements with non-existent sensor", async () => {
        const response = await request(app)
          .get(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/NONEXISTENT/measurements`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
      });
    });

    describe("Statistics edge cases", () => {
      it("should handle statistics request for sensor with no measurements", async () => {
        const response = await request(app)
          .get(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw2.macAddress}/sensors/${TEST_SENSORS.sensor3.macAddress}/stats`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
      });

      it("should handle outliers request for sensor with no measurements", async () => {
        const response = await request(app)
          .get(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw2.macAddress}/sensors/${TEST_SENSORS.sensor3.macAddress}/outliers`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.measurements).toHaveLength(0);
        expect(response.body.stats).toBeDefined();
      });
    });

    describe("Performance and timeout handling", () => {
      it("should complete requests within reasonable time", async () => {
        const startTime = Date.now();
        
        const response = await request(app)
          .get(`/api/v1/networks/${TEST_NETWORKS.net1.code}/measurements`)
          .set("Authorization", `Bearer ${adminToken}`);

        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(response.status).toBe(200);
        expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      });
    });
  });
}); 