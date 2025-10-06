import { UserRepository } from "@repositories/UserRepository";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";
import { UserType } from "@models/UserType";
import { UserDAO } from "@dao/UserDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

beforeAll(async () => {
  await initializeTestDataSource();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  await TestDataSource.getRepository(UserDAO).clear();
});

describe("UserRepository: SQLite in-memory", () => {
  const repo = new UserRepository();

  it("create user", async () => {
    const user = await repo.createUser("john", "pass123", UserType.Admin);
    expect(user).toMatchObject({
      username: "john",
      password: "pass123",
      type: UserType.Admin
    });

    const found = await repo.getUserByUsername("john");
    expect(found.username).toBe("john");
  });

  it("getAllUsers: returns all users", async () => {
    await repo.createUser("alice", "pw1", UserType.Viewer);
    await repo.createUser("bob", "pw2", UserType.Operator);

    const users = await repo.getAllUsers();
    const usernames = users.map(u => u.username).sort();
    expect(usernames).toEqual(["alice", "bob"]);
  });

  it("getUserByUsername: returns user", async () => {
    await repo.createUser("carol", "pw3", UserType.Admin);
    const user = await repo.getUserByUsername("carol");
    expect(user).toMatchObject({
      username: "carol",
      password: "pw3",
      type: UserType.Admin
    });
  });

  it("getUserByUsername: not found", async () => {
    await expect(repo.getUserByUsername("ghost")).rejects.toThrow(
      NotFoundError
    );
  });

  it("createUser: conflict", async () => {
    await repo.createUser("john", "pass123", UserType.Admin);
    await expect(
      repo.createUser("john", "anotherpass", UserType.Viewer)
    ).rejects.toThrow(ConflictError);
  });

  it("deleteUser: removes user", async () => {
    await repo.createUser("todelete", "pw", UserType.Viewer);
    await repo.deleteUser("todelete");
    await expect(repo.getUserByUsername("todelete")).rejects.toThrow(NotFoundError);
  });

  it("deleteUser: not found", async () => {
    await expect(repo.deleteUser("ghost")).rejects.toThrow(NotFoundError);
  });
});
