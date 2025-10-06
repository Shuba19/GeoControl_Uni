import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS, TEST_GATEWAYS, TEST_SENSORS } from "@test/e2e/lifecycle";
import { TEST_NETWORKS} from "@test/e2e/lifecycle"
import e from "express";

/*
all url starts with /api/v1/

GET
/networks/{networkCode}/gateways/{gatewayMac}/sensors

POST
/networks/{networkCode}/gateways/{gatewayMac}/sensors

GET
/networks/{networkCode}/gateways/{gatewayMac}/sensors/{sensorMac}

PATCH
/networks/{networkCode}/gateways/{gatewayMac}/sensors/{sensorMac}

DELETE
/networks/{networkCode}/gateways/{gatewayMac}/sensors/{sensorMac}

*/

describe("Sensor API (e2e)", () => {
    let adminToken: string;
    let operatorToken: string;
    let viewerToken: string;
    beforeAll(async () => {
        await beforeAllE2e();
        adminToken = generateToken(TEST_USERS.admin);
        operatorToken = generateToken(TEST_USERS.operator);
        viewerToken = generateToken(TEST_USERS.viewer);
    }
    );
    afterAll(async () => {
        await afterAllE2e();
    });
    it("GET /networks/{networkCode}/gateways/{gatewayMac}/sensors - return all sensors of a gateway", async () => {
        const response = await request(app)
            .get(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
    });

    it("Get /networks/{networkCode}/gateways/{gatewayMac}/sensors - no auth", async () => {
        const response = await request(app)
            .get(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors`);
        expect(response.status).toBe(401);
    });
    it("Get /networks/{networkCode}/gateways/{gatewayMac}/sensors - fake gw", async () => {
        const response = await request(app)
            .get(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/fakeGW/sensors`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(response.status).toBe(404);
    }
    );
    it("Get /networks/{networkCode}/gateways/{gatewayMac}/sensors - fake net", async () => {
        const response = await request(app)
            .get(`/api/v1/networks/fakeNet/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(response.status).toBe(404);
    });
    it("Get /networks/{networkCode}/gateways/{gatewayMac}/sensors - gw and net are not related", async () => {
        const response = await request(app)
            .get(`/api/v1/networks/${TEST_NETWORKS.net2.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(response.status).toBe(404);
    });
    //specific sensor
    it("GET /networks/{networkCode}/gateways/{gatewayMac}/sensors/{sensorMac} - return a specific sensor", async () => {
        const response = await request(app)
            .get(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}`)
            .set("Authorization", `Bearer ${adminToken}`);
            expect(response.status).toBe(200);
    });
    it("GET /networks/{networkCode}/gateways/{gatewayMac}/sensors/{sensorMac} - no auth", async () => {
        const response = await request(app)
            .get(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}`);
        expect(response.status).toBe(401);
    });
    it("GET /networks/{networkCode}/gateways/{gatewayMac}/sensors/{sensorMac} - fake sensor", async () => {
        const response = await request(app)
            .get(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/fakeSensor`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(response.status).toBe(404);
    });
    it("GET /networks/{networkCode}/gateways/{gatewayMac}/sensors/{sensorMac} - fake gw", async () => {
        const response = await request(app)
            .get(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/fakeGW/sensors/${TEST_SENSORS.sensor1.macAddress}`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(response.status).toBe(404);
    });
    it("GET /networks/{networkCode}/gateways/{gatewayMac}/sensors/{sensorMac} - fake net", async () => {
        const response = await request(app)
            .get(`/api/v1/networks/fakeNet/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(response.status).toBe(404);
    });
    it("POST /networks/{networkCode}/gateways/{gatewayMac}/sensors - create a new sensor", async () => {
        const newSensor = {
            macAddress: "new:mac:address",
            name: "New Sensor",
            description: "new_sens",
            variable: "temperature",
            unit: "Celsius"
        };
        const response = await request(app)
            .post(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors`)
            .set("Authorization", `Bearer ${operatorToken}`)
            .send(newSensor);
        expect(response.status).toBe(201);
    });
    it("POST /networks/{networkCode}/gateways/{gatewayMac}/sensors - no auth", async () => {
        const newSensor = {
            macAddress: "new:mac:address",
            name: "New Sensor",
            description: "new_sens",
            variable: "temperature",
            unit: "Celsius"
        };
        const response = await request(app)
            .post(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors`)
            .send(newSensor);
        expect(response.status).toBe(401);
    });
    it("POST /networks/{networkCode}/gateways/{gatewayMac}/sensors - invalid data", async () => {
        const newSensor = {
            macAddress: "new:mac:address",
            name: "New Sensor",
            description: "new_sens",
            variable: "temperature"
            // missing unit
        };
        const response = await request(app)
            .post(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors`)
            .set("Authorization", `Bearer ${operatorToken}`)
            .send(newSensor);
        expect(response.status).toBe(400);
    });
    it("POST /networks/{networkCode}/gateways/{gatewayMac}/sensors - fake gw", async () => {
        const newSensor = {
            macAddress: "new:mac:address",
            name: "New Sensor",
            description: "new_sens",
            variable: "temperature",
            unit: "Celsius"
        };
        const response = await request(app)
            .post(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/fakeGW/sensors`)
            .set("Authorization", `Bearer ${operatorToken}`)
            .send(newSensor);
        expect(response.status).toBe(404);
    });
    it("POST /networks/{networkCode}/gateways/{gatewayMac}/sensors - fake net", async () => {
        const newSensor = {
            macAddress: "new:mac:address",
            name: "New Sensor",
            description: "new_sens",
            variable: "temperature",
            unit: "Celsius"
        };
        const response = await request(app)
            .post(`/api/v1/networks/fakeNet/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors`)
            .set("Authorization", `Bearer ${operatorToken}`)
            .send(newSensor);
        expect(response.status).toBe(404);
    });
    it("POST /networks/{networkCode}/gateways/{gatewayMac}/sensors - duplicated mac", async () => {
        const newSensor = {
            macAddress: TEST_SENSORS.sensor1.macAddress, // using an existing sensor's MAC
            name: "Duplicate Sensor",
            description: "duplicate_sens",
            variable: "temperature",
            unit: "Celsius"
        };
        const response = await request(app)
            .post(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors`)
            .set("Authorization", `Bearer ${operatorToken}`)
            .send(newSensor);
        expect(response.status).toBe(409); // Conflict due to duplicate MAC
    });
    it("POST /networks/{networkCode}/gateways/{gatewayMac}/sensors - insufficient rights", async () => {
        const newSensor = {
            macAddress: "new:mac:address",
            name: "New Sensor",
            description: "new_sens",
            variable: "temperature",
            unit: "Celsius"
        };
        const response = await request(app)
            .post(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors`)
            .set("Authorization", `Bearer ${viewerToken}`)
            .send(newSensor);
        expect(response.status).toBe(403);
    });
    //patch
    it("PATCH /networks/{networkCode}/gateways/{gatewayMac}/sensors/{sensorMac} - update a sensor", async () => {
        const updatedSensor = {
            macAddress: TEST_SENSORS.sensor1.macAddress,
            name: "Updated Sensor",
            description: "updated_sens",
            variable: "humidity",
            unit: "Percent"
        };
        const response = await request(app)
            .patch(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}`)
            .set("Authorization", `Bearer ${operatorToken}`)
            .send(updatedSensor);
        expect(response.status).toBe(204);
    });
    it("PATCH /networks/{networkCode}/gateways/{gatewayMac}/sensors/{sensorMac} - no auth", async () => {
        const updatedSensor = {
            macAddress: TEST_SENSORS.sensor1.macAddress,
            name: "Updated Sensor",
            description: "updated_sens",
            variable: "humidity",
            unit: "Percent"
        };
        const response = await request(app)
            .patch(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}`)
            .send(updatedSensor);
        expect(response.status).toBe(401);
    });
    it("PATCH /networks/{networkCode}/gateways/{gatewayMac}/sensors/{sensorMac} - fake sensor", async () => {
        const updatedSensor = {
            macAddress: "fake:mac:address",
            name: "Updated Sensor",
            description: "updated_sens",
            variable: "humidity",
            unit: "Percent"
        };
        const response = await request(app)
            .patch(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/fakeSensor`)
            .set("Authorization", `Bearer ${operatorToken}`)
            .send(updatedSensor);
        expect(response.status).toBe(404);
    });
    it("PATCH /networks/{networkCode}/gateways/{gatewayMac}/sensors/{sensorMac} - fake gw", async () => {
        const updatedSensor = {
            macAddress: TEST_SENSORS.sensor1.macAddress,
            name: "Updated Sensor",
            description: "updated_sens",
            variable: "humidity",
            unit: "Percent"
        };
        const response = await request(app)
            .patch(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/fakeGW/sensors/${TEST_SENSORS.sensor1.macAddress}`)
            .set("Authorization", `Bearer ${operatorToken}`)
            .send(updatedSensor);
        expect(response.status).toBe(404);
    });
    it("PATCH /networks/{networkCode}/gateways/{gatewayMac}/sensors/{sensorMac} - fake net", async () => {
        const updatedSensor = {
            macAddress: TEST_SENSORS.sensor1.macAddress,
            name: "Updated Sensor",
            description: "updated_sens",
            variable: "humidity",
            unit: "Percent"
        };
        const response = await request(app)
            .patch(`/api/v1/networks/fakeNet/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}`)
            .set("Authorization", `Bearer ${operatorToken}`)
            .send(updatedSensor);
        expect(response.status).toBe(404);
    });
    it("PATCH /networks/{networkCode}/gateways/{gatewayMac}/sensors/{sensorMac} - invalid data", async () => {
        const updatedSensor = {
            macAddress: TEST_SENSORS.sensor1.macAddress,
            name: "Updated Sensor",
            description: "updated_sens",
            variable: "humidity"
            // missing unit
        };
        const response = await request(app)
            .patch(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}`)
            .set("Authorization", `Bearer ${operatorToken}`)
            .send(updatedSensor);
        expect(response.status).toBe(400);
    });
    it("PATCH /networks/{networkCode}/gateways/{gatewayMac}/sensors/{sensorMac} - duplicated mac", async () => {
        const updatedSensor = {
            macAddress: TEST_SENSORS.sensor1.macAddress, // using an existing sensor's MAC
            name: "Updated Sensor",
            description: "updated_sens",
            variable: "humidity",
            unit: "Percent"
        };
        const response = await request(app)
            .patch(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor2.macAddress}`)
            .set("Authorization", `Bearer ${operatorToken}`)
            .send(updatedSensor);
        expect(response.status).toBe(409); // Conflict due to duplicate MAC
    });
    //delete
    it("DELETE /networks/{networkCode}/gateways/{gatewayMac}/sensors/{sensorMac} - delete a sensor", async () => {
        const response = await request(app)
            .delete(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}`)
            .set("Authorization", `Bearer ${operatorToken}`);
        expect(response.status).toBe(204);
    });
    it("DELETE /networks/{networkCode}/gateways/{gatewayMac}/sensors/{sensorMac} - no auth", async () => {
        const response = await request(app)
            .delete(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}`);
        expect(response.status).toBe(401);
    });
    it("DELETE /networks/{networkCode}/gateways/{gatewayMac}/sensors/{sensorMac} - fake sensor", async () => {
        const response = await request(app)
            .delete(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/fakeSensor`)
            .set("Authorization", `Bearer ${operatorToken}`);
        expect(response.status).toBe(404);
    });
    it("DELETE /networks/{networkCode}/gateways/{gatewayMac}/sensors/{sensorMac} - fake gw", async () => {
        const response = await request(app)
            .delete(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/fakeGW/sensors/${TEST_SENSORS.sensor1.macAddress}`)
            .set("Authorization", `Bearer ${operatorToken}`);
        expect(response.status).toBe(404);
    });
    it("DELETE /networks/{networkCode}/gateways/{gatewayMac}/sensors/{sensorMac} - fake net", async () => {
        const response = await request(app)
            .delete(`/api/v1/networks/fakeNet/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}`)
            .set("Authorization", `Bearer ${operatorToken}`);
        expect(response.status).toBe(404);
    });
    it("DELETE /networks/{networkCode}/gateways/{gatewayMac}/sensors/{sensorMac} - insufficient rights", async () => {
        const response = await request(app)
            .delete(`/api/v1/networks/${TEST_NETWORKS.net1.code}/gateways/${TEST_GATEWAYS.gw1.macAddress}/sensors/${TEST_SENSORS.sensor1.macAddress}`)
            .set("Authorization", `Bearer ${viewerToken}`);
        expect(response.status).toBe(403);
    });
});
