import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";


/*
all url starts with /api/v1/auth
*/
describe("Auth API (e2e)", () => {
    let token: string;
    beforeAll(async () => {
        await beforeAllE2e();
    });
    afterAll(async () => {
        await afterAllE2e();
    });
    it(" authenticate a user ", async () => {
        const response = await request(app)
            .post("/api/v1/auth")
            .send(TEST_USERS.admin);

        expect(response.status).toBe(200);
        expect(response.body.token).toBeDefined();
        token = response.body.token;
    });
    it("should return 401 for invalid credentials", async () => {
        const response = await request(app)
            .post("/api/v1/auth")
            .send({
                username: "UsFake",
                password: "Pws"
            });
        expect(response.status).toBe(404);
    });
});