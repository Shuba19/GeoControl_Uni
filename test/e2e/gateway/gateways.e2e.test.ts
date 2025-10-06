import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS, TEST_GATEWAYS } from "@test/e2e/lifecycle";
import { TEST_NETWORKS} from "@test/e2e/lifecycle"


/*
all url starts with /api/v1/
GET
/networks/{networkCode}/gateways

POST
/networks/{networkCode}/gateways

GET
/networks/{networkCode}/gateways/{gatewayMac}

PATCH
/networks/{networkCode}/gateways/{gatewayMac}

DELETE
/networks/{networkCode}/gateways/{gatewayMac}
*/

describe("Gateway API (e2e)", () => {
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
    it("GET /networks/{networkCode}/gateways - return all gateways of a network", async () => {
        const response = await request(app)
            .get("/api/v1/networks/"+TEST_NETWORKS.net1.code+"/gateways")
            .set("Authorization", `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
    });
    it("POST /networks/{networkCode}/gateways - create new gateway", async () => {
        const response= await request(app)
            .post("/api/v1/networks/"+TEST_NETWORKS.net1.code+"/gateways")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                macAddress: "AA:BB:CC:DD:EE:FF",
                name: "Test Gateway",
                description: "This is a test gateway"
            });
        expect(response.status).toBe(201);
    });
    it("GET /networks/{networkCode}/gateways/{gatewayMac} - get a single gateway", async () => {
        const response = await request(app)
            .get("/api/v1/networks/"+TEST_NETWORKS.net1.code+"/gateways/AA:BB:CC:DD:EE:FF")
            .set("Authorization", `Bearer ${adminToken}`);
        expect(response.status).toBe(200);
    });
    
    it("PATCH /networks/{networkCode}/gateways/{gatewayMac} - update a gateway", async () => {
        const response = await request(app)
            .patch("/api/v1/networks/"+TEST_NETWORKS.net1.code+"/gateways/"+TEST_GATEWAYS.gw1.macAddress)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                macAddress: "mac:Modified:01",
                name: "Gate MODE:02",
                description: "il gate è stato moddato"
            });
        expect(response.status).toBe(204);
    });
    // viewer access tests
    it("GET /networks/{networkCode}/gateways - viewer access ", async () => {
        const response = await request(app)
            .get("/api/v1/networks/"+TEST_NETWORKS.net1.code+"/gateways")
            .set("Authorization", `Bearer ${viewerToken}`);
        expect(response.status).toBe(200);
    });
    // failure test
    it("POST /networks/{networkCode}/gateways - viewer access should fail", async () => {
        const response = await request(app)
            .post("/api/v1/networks/"+TEST_NETWORKS.net1.code+"/gateways")
            .set("Authorization", `Bearer ${viewerToken}`)
            .send({
                macAddress: "AA:BB:CC:DD:EE:FF",
                name: "Test Gateway",
                description: "This is a test gateway"
            });
        expect(response.status).toBe(403);
    });
    it("GET /networks/{networkCode}/gateways/{gatewayMac} - viewer access", async () => {
        const response = await request(app)
            .get("/api/v1/networks/FalseCode/gateways/AA:BB:CC:DD:EE:FF")
            .set("Authorization", `Bearer ${viewerToken}`);
        expect(response.status).toBe(404);
    });

    it("PATCH /networks/{networkCode}/gateways/{gatewayMac} - viewer access negated", async () => {
        const response = await request(app)
            .patch("/api/v1/networks/"+TEST_NETWORKS.net1.code+"/gateways/AA:BB:CC:DD:EE:FF")
            .set("Authorization", `Bearer ${viewerToken}`)
            .send({
                macAddress: "AA:BB:CC:DD:EE:FF",
                name: "Gate MODE:02",
                description: "il gate è stato moddato"
            });
        expect(response.status).toBe(403);
    });
    it("DELETE /networks/{networkCode}/gateways/{gatewayMac} - Network doesn't Exist", async () => {
        const response = await request(app)
            .delete("/api/v1/networks/FalseCode/gateways/AA:BB:CC:DD:EE:FF")
            .set("Authorization", `Bearer ${adminToken}`);
        expect(response.status).toBe(404);
    });
    it("POST /networks/{networkCode}/gateways - Network doesn't exist", async () => {
        const response = await request(app)
            .post("/api/v1/networks/FalseCode/gateways")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                macAddress: "gw:mac",
                name: "gw_false",
                description: "gw_desc"
            });
        expect(response.status).toBe(404);
    });
    it("Update /networks/{networkCode}/gateways/{gatewayMac} - Network doesn't exist", async () => {
        const response = await request(app)
            .patch("/api/v1/networks/FalseCode/gateways/"+ TEST_GATEWAYS.gw2.macAddress)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                macAddress:  TEST_GATEWAYS.gw2.macAddress,
                name: "Updated Gateway",
                description: "Updated Desc"
        });
    });
    it("DELETE /networks/{networkCode}/gateways/{gatewayMac} - viewer access negated", async () => {
        const response = await request(app)
            .delete("/api/v1/networks/"+TEST_NETWORKS.net1.code+"/gateways/AA:BB:CC:DD:EE:FF")
            .set("Authorization", `Bearer ${viewerToken}`);
        expect(response.status).toBe(403);
    }
    );
    //duplicate gateway tests
    it("POST /networks/{networkCode}/gateways - create a duplicate gateway", async () => {
        const response = await request(app)
            .post("/api/v1/networks/"+TEST_NETWORKS.net1.code+"/gateways")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                macAddress: "AA:BB:CC:DD:EE:FF",
                name: "Duplicate Gateway",
                description: "This is a duplicate gateway"
            });
        expect(response.status).toBe(409);
    }
    );

    it("GET /networks/{networkCode}/gateways/{gatewayMac} - GET A right gate with wrong network", async () => {
        const response = await request(app)
            .get("/api/v1/networks/FakeCode/gateways/AA:BB:CC:DD:EE:FF")
            .set("Authorization", `Bearer ${adminToken}`);
        expect(response.status).toBe(404);
    });
    it("GET /networks/{networkCode}/gateways/{gatewayMac} - GET with non related Net", async () => {
        const response = await request(app)
            .get("/api/v1/networks/"+TEST_NETWORKS.net2.code+"/gateways/"+ TEST_GATEWAYS.gw1.macAddress)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(response.status).toBe(404);
    });
    //unauthorized access tests
    it("GET /networks/{networkCode}/gateways - unauthorized access", async () => {
        const response = await request(app)
            .get("/api/v1/networks/"+TEST_NETWORKS.net1.code+"/gateways");
        expect(response.status).toBe(401);
    });

    //bad create request
    it("POST /networks/{networkCode}/gateways - bad create request", async () => {
        const response = await request(app)
            .post("/api/v1/networks/"+TEST_NETWORKS.net1.code+"/gateways")
            .set("Authorization", `Bearer ${operatorToken}`)
            .send({
                macAddress: "AA:BB:CC:DD:",
                name: "Bad Gateway"
                // missing description
            });
        expect(response.status).toBe(400);
    });
    //viewer POST request
    it("POST /networks/{networkCode}/gateways - viewer POST request should fail", async () => {
        const response = await request(app)
            .post("/api/v1/networks/"+TEST_NETWORKS.net1.code+"/gateways")
            .set("Authorization", `Bearer ${viewerToken}`)
            .send({
                macAddress: "AA:BB:CC:DD:EE:FF",
                name: "Test Gateway",
                description: "This is a test gateway"
            });
        expect(response.status).toBe(403);
    });
    //get Request without authentication
    it("GET /networks/{networkCode}/gateways - get request without authentication", async () => {
        const response = await request(app)
            .get("/api/v1/networks/"+TEST_NETWORKS.net1.code+"/gateways");
        expect(response.status).toBe(401);
    });
    //delete request without authentication
    it("DELETE /networks/{networkCode}/gateways/{gatewayMac} - delete request without authentication", async () => {
        const response = await request(app)
            .delete("/api/v1/networks/"+TEST_NETWORKS.net1.code+"/gateways/AA:BB:CC:DD:EE:FF");
        expect(response.status).toBe(401);
    });
    //delete non existing gateway
    it("DELETE /networks/{networkCode}/gateways/{gatewayMac} - delete non existing gateway", async () => {
        const response = await request(app)
            .delete("/api/v1/networks/"+TEST_NETWORKS.net1.code+"/gateways/NonEXISTING")
            .set("Authorization", `Bearer ${adminToken}`);
        expect(response.status).toBe(404);
    });
    //invalid input for create gateway
    it("POST /networks/{networkCode}/gateways - invalid input for create gateway", async () => {
        const response = await request(app)
            .post("/api/v1/networks/"+TEST_NETWORKS.net1.code+"/gateways")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                macAddress: "INVALID_MAC",
                name: "Invalid Gateway"
            });
        expect(response.status).toBe(400);
    });
    //invalid input for update gateway
    it("PATCH /networks/{networkCode}/gateways/{gatewayMac} - invalid input for update gateway", async () => {
        const response = await request(app)
            .patch("/api/v1/networks/"+TEST_NETWORKS.net1.code+"/gateways/AA:BB:CC:DD:EE:FF")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                name: "Invalid Update Gateway",
                // missing description
            });
        expect(response.status).toBe(400);
    });
    

    //Last DELETE (TRUE)
    
    it("DELETE /networks/{networkCode}/gateways/{gatewayMac} - delete a gateway", async () => {
        const response = await request(app)
            .delete("/api/v1/networks/"+TEST_NETWORKS.net1.code+"/gateways/AA:BB:CC:DD:EE:FF")
            .set("Authorization", `Bearer ${adminToken}`);
        expect(response.status).toBe(204);
    });
});