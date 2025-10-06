import { AppDataSource } from "@database";
import { Code, Repository } from "typeorm";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { SensorDAO } from "@models/dao/SensorDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { NotFoundError } from "@models/errors/NotFoundError";
import { NetworkRepository } from "@repositories/NetworkRepository";

//class GatewayDAO
export class GatewayRepository {
  private repo: Repository<GatewayDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(GatewayDAO);
  }
  /*
  async getAllGateways(): Promise<GatewayDAO[]> {
    return (await this.repo.find());
  }*/

  async getSingleGatewayByMacAdd(macAddress: string): Promise<GatewayDAO> {
    return findOrThrowNotFound(
      await this.repo.find({ where: { macAddress }, relations: ["network"] }),
      () => true,
      `Gateway with id '${macAddress}' not found`
    );
  }

  async getAllGatewaysByCode(code: string): Promise<GatewayDAO[]> {
    const networkRepo = new NetworkRepository();
    const network = await networkRepo.getSingleNetworkByMacAdd(code);
    console.log("Network found:", network);
    const gw = (await this.repo.find({ where: { code } }))
    return gw;
  }


  async createGateway(
    macAddress: string,
    name: string,
    description: string,
    code: string
  ): Promise<GatewayDAO> {
    throwConflictIfFound(
      await this.repo.find({ where: { macAddress } }),
      () => true,
      `Gateway with macAddress '${macAddress}' already exists`
    );
    // Recupera l'entità Network
    const networkRepo = new NetworkRepository();
    const network = await networkRepo.getSingleNetworkByMacAdd(code);
    await this.repo.save({
      macAddress: macAddress,
      name: name,
      description: description,
      network: network 
    });
    return this.getSingleGatewayByMacAdd(macAddress);
  }
  async updateGateway(
    macAddress:string,
    newMacAddress: string,
    name: string,
    description: string
  ):Promise<GatewayDAO>{
    findOrThrowNotFound(
      await this.repo.find({ where: { macAddress } }),
      () => true,
      `Gateway with macAddress '${macAddress}' not found`
    );
    throwConflictIfFound(
      await this.repo.find({ where: { macAddress: newMacAddress } }),
      () => true,
      `Gateway with macAddress '${newMacAddress}' already exists`
    );
    await this.repo.update({macAddress},
      {
          macAddress : newMacAddress,
          name: name,
          description: description
      }
    )
    return this.getSingleGatewayByMacAdd(newMacAddress);
  }

  async deleteGateway(macAddress: string): Promise<void> {
    findOrThrowNotFound(
      await this.repo.find({ where: { macAddress } }),
      () => true,
      `Gateway with macAddress '${macAddress}' not found`
    );
    await this.repo.remove(await this.getSingleGatewayByMacAdd(macAddress));
  }
}