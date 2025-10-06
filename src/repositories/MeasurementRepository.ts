import { AppDataSource } from "@database";
import { Repository, MoreThanOrEqual, Between, LessThanOrEqual } from "typeorm";
import { MeasurementsDAO } from "@dao/MeasurementsDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { SensorRepository } from "./SensorRepository";
import { start } from "repl";
//class MeasurementsDAO
export class MeasurementsRepository {
  private repo: Repository<MeasurementsDAO>;

  constructor() {
    this.repo = AppDataSource.getRepository(MeasurementsDAO);
  }

  getAllMeasurements(): Promise<MeasurementsDAO[]> {
    return this.repo.find();
  }

  async getallMeasurementsBySensorMacAddress(sensorMacAddress:string): Promise<MeasurementsDAO[]> {
    const sRepo = new SensorRepository();
    await sRepo.getSingleSensorByMacAddress(sensorMacAddress);
    return (await this.repo.find({ where: { sensorMacAddress } }));
  }
  async getAllMeasurementsFiltered(sensorMacAddress: string, startDate?: Date, endDate?: Date): Promise<MeasurementsDAO[]> {
    const sRepo = new SensorRepository();
    await sRepo.getSingleSensorByMacAddress(sensorMacAddress);
    const where: any = { sensorMacAddress };
    const isValidDate = (d: any) => d instanceof Date && !isNaN(d.getTime());

    if (isValidDate(startDate) && isValidDate(endDate)) {
      where.createdAt = Between(startDate, endDate);
    } else if (isValidDate(startDate)) {
      where.createdAt = MoreThanOrEqual(startDate);
    } else if (isValidDate(endDate)) {
      where.createdAt = LessThanOrEqual(endDate);
    }
    return this.repo.find({ where });
  }

  async getSingleMeasurementByMacAdd(sensorMacAddress: string, createdAt: string): Promise<MeasurementsDAO> {
    return findOrThrowNotFound(
      await this.repo.find({ where: { sensorMacAddress, createdAt: new Date(createdAt) } }), 
      () => true,
      `Measurement with id '${sensorMacAddress}' not found`
    );
  }

  async deleteMeasurement(sensorMacAddress: string, createdAt:string): Promise<void> {
    const sRepo = new SensorRepository();
    await sRepo.getSingleSensorByMacAddress(sensorMacAddress);
    await this.repo.remove(await this.getSingleMeasurementByMacAdd(sensorMacAddress,createdAt));
  }
  
  async createMeasurement(
    sensorMacAddress: string,
    createdAt: Date,
    value: number,
    isOutlier: boolean
  ): Promise<MeasurementsDAO> {

    throwConflictIfFound(
      await this.repo.find({ where: { sensorMacAddress, createdAt } }),
      () => true,
      `Measurement with macAddress '${sensorMacAddress}' and '${createdAt}' already exists`
    );
    const sRepo = new SensorRepository();
    const sensor =await sRepo.getSingleSensorByMacAddress(sensorMacAddress);
    return this.repo.save({
      sensorMacAddress: sensorMacAddress,
      createdAt: createdAt,
      value: value,
      isOutlier: isOutlier,
      sensor: sensor
    });
  }
}
