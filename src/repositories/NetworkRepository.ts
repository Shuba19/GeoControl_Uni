import { AppDataSource } from "@database";
import { Repository, In } from "typeorm";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
//class NetworkDAO
export class NetworkRepository {
  private repo: Repository<NetworkDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(NetworkDAO);
  }

  getAllNetworks(): Promise<NetworkDAO[]> {
    return this.repo.find();
  }

  async getSingleNetworkByMacAdd(code: string): Promise<NetworkDAO> {
    return findOrThrowNotFound(
      await this.repo.find({ where: { code } }),
      () => true,
      `Network with id '${code}' not found`
    );
  }
  async deleteNetwork(code: string): Promise<void> {
    const foundArr = await this.repo.find({ where: { code } });
    const found = findOrThrowNotFound(
      foundArr,
      () => true,
      `Network with code '${code}' not found`
    );
    await this.repo.remove(found);
  }

  async createNetwork(
    code: string,
    name: string,
    description: string
  ): Promise<NetworkDAO> {
    throwConflictIfFound(
      await this.repo.find({ where: { code } }),
      () => true,
      `Network with id '${code}' already exists`
    );
    return this.repo.save({
      code: code,
      name: name,
      description: description
    });
  }

  async updateNetwork(
    code: string,
    newCode: string,
    name?: string,
    description?: string
  ): Promise<NetworkDAO> {
    if (code !== newCode) {
      const found = await this.repo.find({ where: { code: newCode } });
      // Only throw if another network (not the one being updated) has the new code
      if (found.length > 0 && found[0].code !== code) {
        throwConflictIfFound(
          found,
          () => true,
          `Network with code '${newCode}' already exists`
        );
      }
    }
    await this.repo.update({ code }, {
      code: newCode,
      name,
      description
    });
    return this.getSingleNetworkByMacAdd(newCode);
  }

}


