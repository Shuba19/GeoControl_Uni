jest.mock("@repositories/UserRepository");
import { UserRepository } from "@repositories/UserRepository";
import * as authController from "@controllers/authController";
import { UserDAO } from "@models/dao/UserDAO";
import {User as UserDTO} from "@dto/User";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { Token as TokenDTO } from "@models/dto/Token";
import { generateToken } from "@services/authService";
import { createTokenDTO, createUserDTO } from "@services/mapperService";

describe("AuthController Integration Tests", () => {
  const mockUser: UserDAO = {
    username: "user",
    password: "psw",
    type: "admin"
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw error for non-existent user", async () => {
    // Mock del modulo UserRepository
    (UserRepository as jest.MockedClass<typeof UserRepository>).prototype.getUserByUsername = jest.fn().mockRejectedValue(new Error("User not found"));
  
    const userDto: UserDTO = {
      username: "nonexistent",
      password: "anypassword"
    };
  
    await expect(authController.getToken(userDto)).rejects.toThrow("User not found");
  });

  it("should return token for valid user", async () => {
    // Mock per utente valido
    (UserRepository as jest.MockedClass<typeof UserRepository>).prototype.getUserByUsername = jest.fn().mockResolvedValue(mockUser);
  
    const userDto: UserDTO = {
      username: "user",
      password: "psw"
    };
  
    const result = await authController.getToken(userDto);
    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
  });
  it("should throw UnauthorizedError for invalid password", async () => {
    // Mock per utente valido ma password errata
    (UserRepository as jest.MockedClass<typeof UserRepository>).prototype.getUserByUsername = jest.fn().mockResolvedValue(mockUser);
  
    const userDto: UserDTO = {
      username: "user",
      password: "pws"
    };
  
    await expect(authController.getToken(userDto)).rejects.toThrow(UnauthorizedError);
  });
});
