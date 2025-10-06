import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as gatewayController from "@controllers/gatewayController";
import { Gateway as GatewayDTO } from "@dto/Gateway";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

jest.mock("@services/authService");
jest.mock("@controllers/gatewayController");

describe("GatewayRoutes Integration", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock autenticazione sempre valida
        (authService.processToken as jest.Mock).mockResolvedValue({ userType: "ADMIN" });
    });

    it("GET /:networkCode/gateways ", async () => {
        const gw: GatewayDTO[] = [
            { macAddress: "gw1", name: "Gateway 1", description: "desc", sensors: [] }
        ];
        (gatewayController.getNetworkGateway as jest.Mock).mockResolvedValue(gw);

        const res = await request(app)
            .get("/api/v1/networks/netCode/gateways")
            .set("Authorization", "Bearer token");

        expect(res.status).toBe(200);
        expect(res.body).toEqual(gw);
        expect(gatewayController.getNetworkGateway).toHaveBeenCalledWith("netCode");
    });

    it("GET /:networkCode/gateways/:gatewayMac- NotFound", async () => {
        (gatewayController.getSingleGatewayByMacAdd as jest.Mock).mockRejectedValue(new NotFoundError("not found"));

        const res = await request(app)
            .get("/api/v1/networks/netCode/gateways/gwX")
            .set("Authorization", "Bearer token");

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/not found/);
    });

    it("POST /api/v1/networks/:networkCode/gateways - 201 Created", async () => {
        (gatewayController.createGateway as jest.Mock).mockResolvedValue(undefined);

        const newGateway = { macAddress: "gw2", name: "Gateway 2", description: "desc", sensors: [] };
        const res = await request(app)
            .post("/api/v1/networks/netCode/gateways")
            .set("Authorization", "Bearer token")
            .send(newGateway);

        expect(res.status).toBe(201);
        expect(gatewayController.createGateway).toHaveBeenCalledWith(newGateway, "netCode");
    });

    it("POST /:networkCode/gateways - 400 Bad Input Request", async () => {
        (gatewayController.createGateway as jest.Mock).mockRejectedValue(new Error("Invalid data"));
        const newGateway = { macAddress: "gw2", name: "Gateway 2",  sensors: [] };
        const res = await request(app)
            .post("/api/v1/networks/netCode/gateways")
            .set("Authorization", "Bearer token")
            .send(newGateway);
        expect(res.status).toBe(400);
    });
    
    it("POST /:networkCode/gateways - 409 duplicated", async () => {
        (gatewayController.createGateway as jest.Mock).mockRejectedValue(new ConflictError("Duplicated"));
        const newGateway = { macAddress: "gw1", name: "Gateway 2", description: "desc", sensors: [] };
        const res = await request(app)
            .post("/api/v1/networks/netCode/gateways")
            .set("Authorization", "Bearer token")
            .send(newGateway);
        expect(res.status).toBe(409);
    });

    it("DELETE /:networkCode/gateways/:gatewayMac - 204 No Record", async () => {
        (gatewayController.deleteGateway as jest.Mock).mockResolvedValue(undefined);

        const res = await request(app)
            .delete("/api/v1/networks/netCode/gateways/gw1")
            .set("Authorization", "Bearer token");

        expect(res.status).toBe(204);
        expect(gatewayController.deleteGateway).toHaveBeenCalledWith("gw1", "netCode");
    });
    it("DELETE /:networkCode/gateways/:gatewayMac - 404 NotFound", async () => {
        (gatewayController.deleteGateway as jest.Mock).mockRejectedValue(new NotFoundError("not found"));

        const res = await request(app)
            .delete("/api/v1/networks/netCode/gateways/gw1")
            .set("Authorization", "Bearer token");

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/not found/i);
    });
    it("PATCH :networkCode/gateways/:gatewayMac - 404 NotFound", async () => {
        (gatewayController.updateGateway as jest.Mock).mockRejectedValue(new NotFoundError("not found"));

        const updateData = { macAddress: "gw1", name: "Updated", description: "desc", sensors: [] };
        const res = await request(app)
            .patch("/api/v1/networks/netCode/gateways/gw1")
            .set("Authorization", "Bearer token")
            .send(updateData);

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/not found/i);
    });
    it("PATCH :networkCode/gateways/:gatewayMac - 409 Conflict", async () => {
        (gatewayController.updateGateway as jest.Mock).mockRejectedValue(new ConflictError("Conflict"));

        const updateData = { macAddress: "gw1", name: "Updated", description: "desc", sensors: [] };
        const res = await request(app)
            .patch("/api/v1/networks/netCode/gateways/gw1")
            .set("Authorization", "Bearer token")
            .send(updateData);

        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/conflict/i);
    });
    it("PATCH :networkCode/gateways/:gatewayMac - Invalid Input Data", async () => {
        (gatewayController.updateGateway as jest.Mock).mockRejectedValue(new Error("Invalid data"));

        const updateData = { macAddress: "gw1", name: "Updated", sensors: [] }; // Missing description
        const res = await request(app)
            .patch("/api/v1/networks/netCode/gateways/gw1")
            .set("Authorization", "Bearer token")
            .send(updateData);

        expect(res.status).toBe(400);
    });
});

