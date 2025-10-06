import { MeasurementsRepository } from "@repositories/MeasurementRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import { Measurement as MeasurementDTO } from "@dto/Measurement";
import { Measurements as MeasurementsDTO } from "@dto/Measurements";
import { mapMeasurementDAOtoDTO } from "@services/mapperService";
import { Stats as StatsDTO } from "@dto/Stats";
import AppError from "@models/errors/AppError";
import { NotFoundError } from "@models/errors/NotFoundError";
import { create } from "domain";

const calculateStats = (measurements: MeasurementDTO[]): StatsDTO => {
  if (measurements.length == 0) {
    return {
      startDate:null,
    endDate: null,
    mean: 0,
    variance: 0,
    upperThreshold: 0,
    lowerThreshold: 0
    }as StatsDTO;
  }
  const values = measurements.map(m => m.value);
  let sum = 0;
  for (const value of values) {
    sum += value;
  }
  const mean = sum / values.length;

  
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  const upperThreshold = mean + 2 * stdDev;
  const lowerThreshold = mean - 2 * stdDev;
  
  const dates = measurements.map(m => new Date(m.createdAt));
  const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  return {
    startDate,
    endDate,
    mean,
    variance,
    upperThreshold,
    lowerThreshold
  } as StatsDTO;
};

const flagOutliers = (measurements: MeasurementDTO[], stats: StatsDTO): MeasurementDTO[] => {
  return measurements.map(m => ({
    ...m,
    isOutlier: m.value > stats.upperThreshold || m.value < stats.lowerThreshold
  }));
};

const getOutliers = (measurements: MeasurementDTO[], stats: StatsDTO): MeasurementDTO[] => {
  return measurements.filter(m => 
    m.value > stats.upperThreshold || m.value < stats.lowerThreshold
  );
};
export async function getSensorMeasurements(
  networkCode: string,
  gatewayMac: string,
  sensorMac: string,
  startDate?: string,
  endDate?: string
): Promise<MeasurementsDTO> {
  const gatewayRepo = new GatewayRepository();
  const sensorRepo = new SensorRepository();
  const networkRepo = new NetworkRepository();
  await networkRepo.getSingleNetworkByMacAdd(networkCode);
  const gateway = await gatewayRepo.getSingleGatewayByMacAdd(gatewayMac);
  if (gateway.code !== networkCode) {
    throw new NotFoundError(`Gateway ${gatewayMac} does not belong to network ${networkCode}`);
  }

  const sensor = await sensorRepo.getSingleSensorByMacAddress(sensorMac);
  if (sensor.macAddressGateway !== gatewayMac) {
    throw new NotFoundError(`Sensor ${sensorMac} does not belong to gateway ${gatewayMac}`);
  }
  
  const measurementRepo = new MeasurementsRepository();
  const measurements = await measurementRepo.getAllMeasurementsFiltered(sensorMac, new Date(startDate), new Date(endDate));
  const measurementDTOs = measurements.map(m => ({
    createdAt: m.createdAt,
    value: m.value,
    isOutlier: m.isOutlier
  }));
  
  if (measurementDTOs.length > 0) {
    const stats = calculateStats(measurementDTOs);
    const updatedMeasurements = flagOutliers(measurementDTOs, stats);
    return {
      sensorMacAddress: sensorMac,
      stats,
      measurements: updatedMeasurements
    };
  }
  const Stats: StatsDTO = {
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    mean: 0,
    variance: 0,
    upperThreshold: 0,
    lowerThreshold: 0
  };
  
  return {
    sensorMacAddress: sensorMac,
    measurements: measurementDTOs,
    stats: Stats
  };
}

export async function getSensorStats(
  networkCode: string,
  gatewayMac: string,
  sensorMac: string,
  startDate?: string,
  endDate?: string
): Promise<StatsDTO> {
  const measurementsData = await getSensorMeasurements(networkCode, gatewayMac, sensorMac, startDate, endDate);
  
  if (!measurementsData.stats) {
    throw new NotFoundError(`No measurements found for sensor ${sensorMac} to calculate statistics`);
  }
  
  return measurementsData.stats;
}

export async function getSensorOutliers(
  networkCode: string,
  gatewayMac: string,
  sensorMac: string,
  startDate?: string,
  endDate?: string
): Promise<MeasurementsDTO> {
  const measurementsData = await getSensorMeasurements(networkCode, gatewayMac, sensorMac, startDate, endDate);
  
  if (!measurementsData.stats || !measurementsData.measurements) {
    return {
      sensorMacAddress: sensorMac,
      measurements: []
    };
  }
  
  const outliers = getOutliers(measurementsData.measurements, measurementsData.stats);
  
  return {
    sensorMacAddress: sensorMac,
    stats: measurementsData.stats,
    measurements: outliers
  };
}

export async function createSensorMeasurement(
  networkCode: string,
  gatewayMac: string,
  sensorMac: string,
  measurementData: { createdAt: string; value: number }
): Promise<void> {
  const gatewayRepo = new GatewayRepository();
  const sensorRepo = new SensorRepository();
  const measurementRepo = new MeasurementsRepository();  
  const gateway = await gatewayRepo.getSingleGatewayByMacAdd(gatewayMac);
  if (gateway.code !== networkCode) {
    throw new NotFoundError(`Gateway ${gatewayMac} does not belong to network ${networkCode}`);
  }

  const sensor = await sensorRepo.getSingleSensorByMacAddress(sensorMac);
  if (sensor.macAddressGateway !== gatewayMac) {
    throw new NotFoundError(`Sensor ${sensorMac} does not belong to gateway ${gatewayMac}`);
  } 
  
  const existingMeasurements = await measurementRepo.getallMeasurementsBySensorMacAddress(sensorMac);
  const existingMeasurementDTOs = existingMeasurements.map(m => ({
    createdAt: m.createdAt,
    value: m.value,
    isOutlier: m.isOutlier
  }));
  
  let isOutlier = false;
  
  if (existingMeasurementDTOs.length > 0) {
    const stats = calculateStats(existingMeasurementDTOs);
    isOutlier = measurementData.value > stats.upperThreshold || measurementData.value < stats.lowerThreshold;
  }
  
  await measurementRepo.createMeasurement(
    sensorMac,
    new Date(measurementData.createdAt),
    measurementData.value,
    isOutlier
  );
  
  
}

export async function getNetworkMeasurements(networkCode: string,
  sensorMacs?: string[],
  startDate?: string,
  endDate?: string
): Promise<MeasurementsDTO[]> {
  const networkRepo = new NetworkRepository();
  await networkRepo.getSingleNetworkByMacAdd(networkCode);
  
  const gatewayRepo = new GatewayRepository();
  const gateways = await gatewayRepo.getAllGatewaysByCode(networkCode);
  
  const sensorRepo = new SensorRepository();
  const allSensors = [];
  if(sensorMacs) {
    for (const sensorMac of sensorMacs) {

    const sensor = await sensorRepo.getSingleSensorByMacAddress(sensorMac);
    const s_gw = await gatewayRepo.getSingleGatewayByMacAdd(sensor.macAddressGateway);
    if(s_gw.code == networkCode) {
      allSensors.push(sensor);
    }
    
  }
  }else {
  for (const gateway of gateways) {
    const sensors = await sensorRepo.getSensorByGatewayMacAddress(gateway.macAddress);
    allSensors.push(...sensors);
  }}
  
  const measurementRepo = new MeasurementsRepository();
  const results: MeasurementsDTO[] = [];
  
  for (const sensor of allSensors) {
    const measurements = await measurementRepo.getAllMeasurementsFiltered(sensor.macAddress, new Date(startDate), new Date(endDate));
    
    const measurementDTOs = measurements.map(m => ({
      createdAt: m.createdAt,
      value: m.value,
      isOutlier: m.isOutlier
    }));
    const stats = calculateStats(measurementDTOs);
    stats.startDate = startDate ? new Date(startDate) : stats.startDate;
    stats.endDate = endDate ? new Date(endDate) : stats.endDate;
    if (measurementDTOs.length > 0) {
      const updatedMeasurements = flagOutliers(measurementDTOs, stats);
      
      results.push({
        sensorMacAddress: sensor.macAddress,
        stats,
        measurements: updatedMeasurements
      });
    } else {
      results.push({
        sensorMacAddress: sensor.macAddress,
        measurements: [],
        stats
      });
    }
  }
  
  return results;
}

export async function getNetworkStats(networkCode: string,
  sensorMacs?: string[],
  startDate?: string,
  endDate?: string
): Promise<{ sensorMacAddress: string; stats: StatsDTO }[]> {
  const networkMeasurements = await getNetworkMeasurements(networkCode,sensorMacs, startDate, endDate);
  
  const sensorStats = networkMeasurements
    .filter(m => m.stats !== undefined)
    .map(m => ({
      sensorMacAddress: m.sensorMacAddress,
      stats: m.stats!
    }));
  
  return sensorStats;
}

export async function getNetworkOutliers(networkCode: string,
  sensorMacs?: string[],
  startDate?: string,
  endDate?: string
): Promise<MeasurementsDTO[]> {
  const networkMeasurements = await getNetworkMeasurements(networkCode,sensorMacs, startDate, endDate);
  
  const sensorsWithOutliers = networkMeasurements.map(m => {
    if (!m.stats || !m.measurements) {
      return {
        sensorMacAddress: m.sensorMacAddress,
        measurements: []
      };
    }
    
    const outliers = getOutliers(m.measurements, m.stats);
    
    return {
      sensorMacAddress: m.sensorMacAddress,
      stats: m.stats,
      measurements: outliers
    };
  });
  
  return sensorsWithOutliers;
}
