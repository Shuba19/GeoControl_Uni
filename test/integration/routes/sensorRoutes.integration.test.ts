import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as sensorController from "@controllers/sensorController";
import { Sensor as SensorDTO } from "@dto/Sensor";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";
import AppError from "@models/errors/AppError";


jest.mock("@services/authService");
jest.mock("@controllers/sensorController");

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
describe("GatewayRoutes Integration", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock autenticazione sempre valida
        (authService.processToken as jest.Mock).mockResolvedValue({ userType: "ADMIN" });
    });
    it("GET /:networkCode/gateways/:gatewayMac/sensors ", async () => {
        const sensors: SensorDTO[] = [
            { macAddress: "sensor1", name: "Sensor 1", description: "desc", variable: "temperature",unit: "celsius" }
        ];
        (sensorController.getSensorByGatewayMacAddress as jest.Mock).mockResolvedValue(sensors);

        const res = await request(app)
            .get("/api/v1/networks/netCode/gateways/gw1/sensors")
            .set("Authorization", "Bearer token");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(sensors);
        expect(sensorController.getSensorByGatewayMacAddress).toHaveBeenCalledWith("gw1", "netCode");
    });
    it("GET /:networkCode/gateways/:gatewayMac/sensors/:sensorMac - NotFound", async () => {
        (sensorController.getSingleSensorByMacAddress as jest.Mock).mockRejectedValue(new NotFoundError("not found"));

        const res = await request(app)
            .get("/api/v1/networks/netCode/gateways/gw1/sensors/sensorX")
            .set("Authorization", "Bearer token");

        expect(res.status).toBe(404);
    });
    it("GET /:networkCode/gateways/:gatewayMac/sensors/:sensorMac ", async () => {
        const sensor: SensorDTO = { macAddress: "sensor1", name: "Sensor 1", description: "desc", variable: "temperature", unit: "celsius" };
        (sensorController.getSingleSensorByMacAddress as jest.Mock).mockResolvedValue(sensor);

        const res = await request(app)
            .get("/api/v1/networks/netCode/gateways/gw1/sensors/sensor1")
            .set("Authorization", "Bearer token");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(sensor);
        expect(sensorController.getSingleSensorByMacAddress).toHaveBeenCalledWith("sensor1",  "netCode","gw1");
    });
    it("GET /:networkCode/gateways/:gatewayMac/sensors/:sensorMac - no auth", async () => {
        (authService.processToken as jest.Mock).mockImplementation(() => {
            throw new AppError("Unauthorized: No token provided", 401);
        });
        const res = await request(app)
            .get("/api/v1/networks/netCode/gateways/gw1/sensors/sensor1");
        expect(res.status).toBe(401);
    });
        
        
    it("POST /api/v1/networks/:networkCode/gateways/:gatewayMac/sensors - 201", async () => {
        const newSensor: SensorDTO = { macAddress: "sensor2", name: "Sensor 2", description: "desc", variable: "humidity", unit: "percent" };
        (sensorController.createSensor as jest.Mock).mockResolvedValue(undefined);

        const res = await request(app)
            .post("/api/v1/networks/netCode/gateways/gw1/sensors")
            .set("Authorization", "Bearer token")
            .send(newSensor);

        expect(res.status).toBe(201);
        expect(sensorController.createSensor).toHaveBeenCalledWith(newSensor, "gw1", "netCode");
    });
    it("POST /:networkCode/gateways/:gatewayMac/sensors - 400", async () => {
        (sensorController.createSensor as jest.Mock).mockRejectedValue(new AppError("Invalid input data", 400));
        const newSensor: SensorDTO = { macAddress: "sensor2", name: "Sensor 2", description: "desc", variable: "humidity" };
        const res = await request(app)
            .post("/api/v1/networks/netCode/gateways/gw1/sensors")
            .set("Authorization", "Bearer token")
            .send(newSensor);
        expect(res.status).toBe(400);
    });
    it("POST /:networkCode/gateways/:gatewayMac/sensors - 409", async () => {
        (sensorController.createSensor as jest.Mock).mockRejectedValue(new ConflictError("Sensor already exists"));
        const newSensor: SensorDTO = { macAddress: "sensor2", name: "Sensor 2", description: "desc", variable: "humidity", unit: "percent" };
        const res = await request(app)
            .post("/api/v1/networks/netCode/gateways/gw1/sensors")
            .set("Authorization", "Bearer token")
            .send(newSensor);
        expect(res.status).toBe(409);
    });
    it("PATCH /:networkCode/gateways/:gatewayMac/sensors/:sensorMac - 204", async () => {
        const updatedSensor: SensorDTO = { macAddress: "sensor1", name: "Updated Sensor", description: "Updated desc", variable: "pressure", unit: "pascal" };
        (sensorController.updateSensor as jest.Mock).mockResolvedValue(undefined);

        const res = await request(app)
            .patch("/api/v1/networks/netCode/gateways/gw1/sensors/sensor1")
            .set("Authorization", "Bearer token")
            .send(updatedSensor);

        expect(res.status).toBe(204);
        expect(sensorController.updateSensor).toHaveBeenCalledWith("sensor1", updatedSensor, "gw1", "netCode");
    });
    it("PATCH /:networkCode/gateways/:gatewayMac/sensors/:sensorMac - 404", async () => {
        (sensorController.updateSensor as jest.Mock).mockRejectedValue(new NotFoundError("Sensor not found"));

        const updatedSensor: SensorDTO = { macAddress: "sensor1", name: "Updated Sensor", description: "Updated desc", variable: "pressure", unit: "pascal" };
        const res = await request(app)
            .patch("/api/v1/networks/netCode/gateways/gw1/sensors/sensorX")
            .set("Authorization", "Bearer token")
            .send(updatedSensor);

        expect(res.status).toBe(404);
    });
    it("PATCH /:networkCode/gateways/:gatewayMac/sensors/:sensorMac - 400", async () => {
        (sensorController.updateSensor as jest.Mock).mockRejectedValue(new AppError("Invalid input data", 400));

        const updatedSensor: SensorDTO = { macAddress: "sensor1", name: "Updated Sensor", description: "Updated desc", variable: "pressure" };
        const res = await request(app)
            .patch("/api/v1/networks/netCode/gateways/gw1/sensors/sensor1")
            .set("Authorization", "Bearer token")
            .send(updatedSensor);

        expect(res.status).toBe(400);
    });
    it("DELETE /:networkCode/gateways/:gatewayMac/sensors/:sensorMac - 204", async () => {
        (sensorController.deleteSensor as jest.Mock).mockResolvedValue(undefined);

        const res = await request(app)
            .delete("/api/v1/networks/netCode/gateways/gw1/sensors/sensor1")
            .set("Authorization", "Bearer token");

        expect(res.status).toBe(204);
        expect(sensorController.deleteSensor).toHaveBeenCalledWith("sensor1","netCode", "gw1");
    });
    it("DELETE /:networkCode/gateways/:gatewayMac/sensors/:sensorMac - 404", async () => {
        (sensorController.deleteSensor as jest.Mock).mockRejectedValue(new NotFoundError("Sensor not found"));

        const res = await request(app)
            .delete("/api/v1/networks/netCode/gateways/gw1/sensors/sensorX")
            .set("Authorization", "Bearer token");
        expect(res.status).toBe(404);
    });
});