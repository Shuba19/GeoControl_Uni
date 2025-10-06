import request from "supertest";
import { app } from "@app";
import * as authController from "@controllers/authController";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";
import { NotFoundError } from "@models/errors/NotFoundError";

jest.mock("@controllers/authController");

describe("Authentication Routes Integration", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    it("POST /api/v1/auth - auth user correctly", async () => {
        const user = { username: "admin", password: "password" };
        const mockToken = { token: "mock-jwt-token" };
        
        
        (authController.getToken as jest.Mock).mockResolvedValue(mockToken);

        const response = await request(app)
            .post("/api/v1/auth")
            .send(user);

        expect(response.status).toBe(200);
        expect(response.body.token).toBe(mockToken.token);
        expect(authController.getToken).toHaveBeenCalledWith(user);
    });

    it("POST /api/v1/auth - 404 wrong credentials", async () => {
        const user = { username: "usr", password: "pws" };
        
        (authController.getToken as jest.Mock).mockRejectedValue(new NotFoundError("  credentials"));

        const response = await request(app)
            .post("/api/v1/auth")
            .send(user);

        expect(response.status).toBe(404);
    });
});