import * as userController from "@controllers/userController";
import { UserDAO } from "@dao/UserDAO";
import { UserType } from "@models/UserType";
import { UserRepository } from "@repositories/UserRepository";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";
import AppError from "@models/errors/AppError";

jest.mock("@repositories/UserRepository");

describe("UserController integration", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  //Get user by username controller test
  it("getUser: mapperService integration", async () => {
    const fakeUserDAO: UserDAO = {
      username: "testuser",
      password: "secret",
      type: UserType.Operator
    };

    const expectedDTO = {
      username: fakeUserDAO.username,
      type: fakeUserDAO.type
    };

    (UserRepository as jest.Mock).mockImplementation(() => ({
      getUserByUsername: jest.fn().mockResolvedValue(fakeUserDAO)
    }));

    const result = await userController.getUser("testuser");

    expect(result).toEqual({
      username: expectedDTO.username,
      type: expectedDTO.type

    });
    expect(result).not.toHaveProperty("password");
  });

  //Get all users controller test
  it("getAllUsers: returns mapped users", async () => {
    const fakeUsers: UserDAO[] = [
      { username: "admin", password: "aaaaaaaaa", type: UserType.Admin },
      { username: "operator", password: "bbbbbbbbbb", type: UserType.Operator },
      { username: "viewer", password: "ccccccccc", type: UserType.Viewer }
    ];

    const expectedDTOs = fakeUsers.map(u => ({
      username: u.username,
      type: u.type
    }));

    (UserRepository as jest.Mock).mockImplementation(() => ({
      getAllUsers: jest.fn().mockResolvedValue(fakeUsers)
    }));

    const result = await userController.getAllUsers();

    expect(result).toEqual(expectedDTOs.map(u => ({
      username: u.username,
      type: u.type
    })));

    expect(result.every(u => !("password" in u))).toBe(true);
  });

  //Create user controller test
  it("createUser: calls repository with correct args", async () => {
    const mockCreateUser = jest.fn().mockResolvedValue(undefined);

    (UserRepository as jest.Mock).mockImplementation(() => ({
      createUser: mockCreateUser
    }));

    const userDTO = { username: "newuser", password: "pw", type: UserType.Viewer };
    await userController.createUser(userDTO);

    expect(mockCreateUser).toHaveBeenCalledWith("newuser", "pw", UserType.Viewer);
  });

  //Delete user controller test
  it("deleteUser: calls repository with correct username", async () => {
    const mockDeleteUser = jest.fn().mockResolvedValue(undefined);

    (UserRepository as jest.Mock).mockImplementation(() => ({
      deleteUser: mockDeleteUser
    }));

    await userController.deleteUser("todelete");
    expect(mockDeleteUser).toHaveBeenCalledWith("todelete");
  });

  // --- ERROR TESTS ---

  // Get all users
  it("getAllUsers: throws UnauthorizedError (401)", async () => {
    (UserRepository as jest.Mock).mockImplementation(() => ({
      getAllUsers: jest.fn().mockRejectedValue(new UnauthorizedError("Unauthorized"))
    }));
    await expect(userController.getAllUsers()).rejects.toThrow(UnauthorizedError);
  });

  it("getAllUsers: throws InsufficientRightsError (403)", async () => {
    (UserRepository as jest.Mock).mockImplementation(() => ({
      getAllUsers: jest.fn().mockRejectedValue(new InsufficientRightsError("Forbidden"))
    }));
    await expect(userController.getAllUsers()).rejects.toThrow(InsufficientRightsError);
  });

  it("getAllUsers: throws AppError (500)", async () => {
    (UserRepository as jest.Mock).mockImplementation(() => ({
      getAllUsers: jest.fn().mockRejectedValue(new AppError("Internal", 500))
    }));
    await expect(userController.getAllUsers()).rejects.toThrow(AppError);
  });

  // Create user
  it("createUser: throws AppError (400)", async () => {
    (UserRepository as jest.Mock).mockImplementation(() => ({
      createUser: jest.fn().mockRejectedValue(new AppError("Bad Request", 400))
    }));
    await expect(userController.createUser({ username: "", password: "", type: undefined })).rejects.toThrow(AppError);
  });

  it("createUser: throws UnauthorizedError (401)", async () => {
    (UserRepository as jest.Mock).mockImplementation(() => ({
      createUser: jest.fn().mockRejectedValue(new UnauthorizedError("Unauthorized"))
    }));
    await expect(userController.createUser({ username: "x", password: "x", type: undefined })).rejects.toThrow(UnauthorizedError);
  });

  it("createUser: throws InsufficientRightsError (403)", async () => {
    (UserRepository as jest.Mock).mockImplementation(() => ({
      createUser: jest.fn().mockRejectedValue(new InsufficientRightsError("Forbidden"))
    }));
    await expect(userController.createUser({ username: "x", password: "x", type: undefined })).rejects.toThrow(InsufficientRightsError);
  });

  it("createUser: throws ConflictError (409)", async () => {
    (UserRepository as jest.Mock).mockImplementation(() => ({
      createUser: jest.fn().mockRejectedValue(new ConflictError("Conflict"))
    }));
    await expect(userController.createUser({ username: "admin", password: "pw", type: undefined })).rejects.toThrow(ConflictError);
  });

  it("createUser: throws AppError (500)", async () => {
    (UserRepository as jest.Mock).mockImplementation(() => ({
      createUser: jest.fn().mockRejectedValue(new AppError("Internal", 500))
    }));
    await expect(userController.createUser({ username: "x", password: "x", type: undefined })).rejects.toThrow(AppError);
  });

  // Get user by username
  it("getUser: throws UnauthorizedError (401)", async () => {
    (UserRepository as jest.Mock).mockImplementation(() => ({
      getUserByUsername: jest.fn().mockRejectedValue(new UnauthorizedError("Unauthorized"))
    }));
    await expect(userController.getUser("testuser")).rejects.toThrow(UnauthorizedError);
  });

  it("getUser: throws InsufficientRightsError (403)", async () => {
    (UserRepository as jest.Mock).mockImplementation(() => ({
      getUserByUsername: jest.fn().mockRejectedValue(new InsufficientRightsError("Forbidden"))
    }));
    await expect(userController.getUser("testuser")).rejects.toThrow(InsufficientRightsError);
  });

  it("getUser: throws NotFoundError (404)", async () => {
    (UserRepository as jest.Mock).mockImplementation(() => ({
      getUserByUsername: jest.fn().mockRejectedValue(new NotFoundError("Not found"))
    }));
    await expect(userController.getUser("notfound")).rejects.toThrow(NotFoundError);
  });

  it("getUser: throws AppError (500)", async () => {
    (UserRepository as jest.Mock).mockImplementation(() => ({
      getUserByUsername: jest.fn().mockRejectedValue(new AppError("Internal", 500))
    }));
    await expect(userController.getUser("testuser")).rejects.toThrow(AppError);
  });

  // Delete user
  it("deleteUser: throws UnauthorizedError (401)", async () => {
    (UserRepository as jest.Mock).mockImplementation(() => ({
      deleteUser: jest.fn().mockRejectedValue(new UnauthorizedError("Unauthorized"))
    }));
    await expect(userController.deleteUser("testuser")).rejects.toThrow(UnauthorizedError);
  });

  it("deleteUser: throws InsufficientRightsError (403)", async () => {
    (UserRepository as jest.Mock).mockImplementation(() => ({
      deleteUser: jest.fn().mockRejectedValue(new InsufficientRightsError("Forbidden"))
    }));
    await expect(userController.deleteUser("testuser")).rejects.toThrow(InsufficientRightsError);
  });

  it("deleteUser: throws NotFoundError (404)", async () => {
    (UserRepository as jest.Mock).mockImplementation(() => ({
      deleteUser: jest.fn().mockRejectedValue(new NotFoundError("Not found"))
    }));
    await expect(userController.deleteUser("notfound")).rejects.toThrow(NotFoundError);
  });

  it("deleteUser: throws AppError (500)", async () => {
    (UserRepository as jest.Mock).mockImplementation(() => ({
      deleteUser: jest.fn().mockRejectedValue(new AppError("Internal", 500))
    }));
    await expect(userController.deleteUser("testuser")).rejects.toThrow(AppError);
  });  
});

