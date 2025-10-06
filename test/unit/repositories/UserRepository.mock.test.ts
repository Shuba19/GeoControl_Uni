import { UserRepository } from "@repositories/UserRepository";
import { UserDAO } from "@dao/UserDAO";
import { UserType } from "@models/UserType";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";

const mockFind = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: () => ({
      find: mockFind,
      save: mockSave,
      remove: mockRemove
    })
  }
}));

describe("UserRepository: mocked database", () => {
  const repo = new UserRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("create user", async () => {
    mockFind.mockResolvedValue([]);
    const savedUser = new UserDAO();
    savedUser.username = "john";
    savedUser.password = "pass123";
    savedUser.type = UserType.Admin;
    mockSave.mockResolvedValue(savedUser);

    const result = await repo.createUser("john", "pass123", UserType.Admin);

    expect(result).toBeInstanceOf(UserDAO);
    expect(result.username).toBe("john");
    expect(result.password).toBe("pass123");
    expect(result.type).toBe(UserType.Admin);
    expect(mockSave).toHaveBeenCalledWith({
      username: "john",
      password: "pass123",
      type: UserType.Admin
    });
  });

  it("create user: conflict", async () => {
    const existingUser = new UserDAO();
    existingUser.username = "john";
    existingUser.password = "pass123";
    existingUser.type = UserType.Admin;
    mockFind.mockResolvedValue([existingUser]);

    await expect(
      repo.createUser("john", "another", UserType.Viewer)
    ).rejects.toThrow(ConflictError);
  });

  it("getAllUsers: returns all users", async () => {
    const user1 = new UserDAO();
    user1.username = "alice";
    user1.password = "pw1";
    user1.type = UserType.Viewer;

    const user2 = new UserDAO();
    user2.username = "bob";
    user2.password = "pw2";
    user2.type = UserType.Operator;

    mockFind.mockResolvedValue([user1, user2]);

    const users = await repo.getAllUsers();
    expect(users).toEqual([user1, user2]);
    expect(mockFind).toHaveBeenCalled();
  });

  it("find user by username", async () => {
    const foundUser = new UserDAO();
    foundUser.username = "john";
    foundUser.password = "pass123";
    foundUser.type = UserType.Operator;

    mockFind.mockResolvedValue([foundUser]);

    const result = await repo.getUserByUsername("john");
    expect(result).toBe(foundUser);
    expect(result.type).toBe(UserType.Operator);
  });

  it("find user by username: not found", async () => {
    mockFind.mockResolvedValue([]);

    await expect(repo.getUserByUsername("ghost")).rejects.toThrow(
      NotFoundError
    );
  });

  it("delete user", async () => {
    const user = new UserDAO();
    user.username = "john";
    user.password = "pass123";
    user.type = UserType.Admin;

    mockFind.mockResolvedValue([user]);
    mockRemove.mockResolvedValue(undefined);

    await repo.deleteUser("john");

    expect(mockRemove).toHaveBeenCalledWith(user);
  });

  it("delete user: not found", async () => {
    mockFind.mockResolvedValue([]);

    await expect(repo.deleteUser("ghost")).rejects.toThrow(NotFoundError);
  });
});
