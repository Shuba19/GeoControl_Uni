import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { SensorDAO } from "@dao/SensorDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { NotFoundError } from "@models/errors/NotFoundError";
import { GatewayRepository } from "./GatewayRepository";
export class SensorRepository {
  private repo: Repository<SensorDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(SensorDAO);
  }
  /*
  getAllSensors(): Promise<SensorDAO[]> {
    return this.repo.find();
  }*/

  async getSensorByGatewayMacAddress(macAddressGateway:string): Promise<SensorDAO[]>{
    const sens = await this.repo.find({where : {macAddressGateway}, relations: ["gateway"]});
    return sens;
  }
  

  async getSingleSensorByMacAddress(macAddress: string): Promise<SensorDAO> {
    return findOrThrowNotFound(
      await this.repo.find({ where: { macAddress } }),
      () => true,
      `Sensor with id '${macAddress}' not found`
    );
  }

  async getAllSensorsByGatewayMacAddress(macAddressGateway: string): Promise<SensorDAO[]> {
    const gwrepo = new GatewayRepository();
    await gwrepo.getSingleGatewayByMacAdd(macAddressGateway);
    return await this.repo.find({ where: { macAddressGateway }, relations: ["gateway"] });
  }

  async createSensor(
    macAddress: string,
    macAddressGateway: string,
    name: string,
    description: string,
    variable: string,
    unit: string
  ): Promise<SensorDAO> {
    throwConflictIfFound(
      await this.repo.find({ where: { macAddress } }),
      () => true,
      `Sensor with macAddress '${macAddress}' already exists`
    );
    const gateRepo = new GatewayRepository();
    const gateway = await gateRepo.getSingleGatewayByMacAdd(macAddressGateway);
    await this.repo.save({
      macAddress: macAddress,
      macAddressGateway: macAddressGateway,
      name: name,
      description: description,
      variable: variable,
      unit: unit,
      gateway: gateway
    });
    return this.getSingleSensorByMacAddress(macAddress);
  }

  async deleteSensor(macAddress: string): Promise<void> {
    findOrThrowNotFound(
      await this.repo.find({ where: { macAddress } }),
      () => true,
      `Sensor with id '${macAddress}' not found`
    );
    await this.repo.remove(await this.getSingleSensorByMacAddress(macAddress));
  }

  async updateSensor(
    macAddress: string,
    newMacAddress: string,
    name: string,
    description: string,
    variable: string,
    unit: string
  ): Promise<SensorDAO> {
    findOrThrowNotFound(
      await this.repo.find({ where: { macAddress } }),
      () => true,
      `Sensor with macAddress '${macAddress}' not found`
    );
    if( macAddress !== newMacAddress)
    {
    throwConflictIfFound(
      await this.repo.find({ where: { macAddress: newMacAddress } }),
      () => true,
      `Sensor with macAddress '${newMacAddress}' already exists`
    );
    }
    await this.repo.update({macAddress},
      {
          macAddress : newMacAddress,
          name: name,
          description: description,
          variable: variable,
          unit: unit
      }
    )
    return this.getSingleSensorByMacAddress(newMacAddress);
  }
}
