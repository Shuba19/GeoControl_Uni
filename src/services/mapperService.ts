import { Token as TokenDTO } from "@dto/Token";
import { User as UserDTO } from "@dto/User";
import { Network as NetworkDTO } from "@dto/Network";
import { Gateway as GatewayDTO } from "@dto/Gateway";

import { Sensor as SensorDTO } from "@dto/Sensor";
import {Stats as StatsDTO} from "@dto/Stats";
import {Measurement as MeasurementDTO} from "@dto/Measurement"
import {Measurements as MeasurementsDTO} from "@dto/Measurements"
import { SensorDAO } from "@models/dao/SensorDAO";
import { MeasurementsDAO } from "@models/dao/MeasurementsDAO";
import { UserDAO } from "@models/dao/UserDAO";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import { ErrorDTO } from "@models/dto/ErrorDTO";
import { UserType } from "@models/UserType";




export function createErrorDTO(
  code: number,
  message?: string,
  name?: string
): ErrorDTO {
  return removeNullAttributes({
    code,
    name,
    message
  }) as ErrorDTO;
}

export function createTokenDTO(token: string): TokenDTO {
  return removeNullAttributes({
    token: token
  }) as TokenDTO;
}

//User functions
export function createUserDTO(
  username: string,
  type: UserType,
  password?: string
): UserDTO {
  return removeNullAttributes({
    username,
    type,
    password
  }) as UserDTO;
}

export function mapUserDAOToDTO(userDAO: UserDAO): UserDTO {
  return createUserDTO(userDAO.username, userDAO.type);
}

//Network functions
export function createNetworkDTO(
  code: string,
  name: string,
  description: string,
  gateways?: Array<GatewayDTO>[]
): NetworkDTO {
  return removeNullAttributes({
    code,
    name,
    description,
    gateways
  }) as NetworkDTO;
}

export function mapNetworkDAOToDTO(networkDAO: NetworkDAO): NetworkDTO {
  return createNetworkDTO(
    networkDAO.code,
    networkDAO.name,
    networkDAO.description
  );
}

// Gateway functions
export function createGatewayDTO(
  macAddress: string,
  name: string,
  description: string
): GatewayDTO {
  return removeNullAttributes({
    macAddress,
    name,
    description
  }) as GatewayDTO;
}

export function mapGatewayDAOToDTO(gatewayDAO: GatewayDAO): GatewayDTO {
  return createGatewayDTO(
    gatewayDAO.macAddress,
    gatewayDAO.name,
    gatewayDAO.description
  );
}


//Sensor functions
export function createSensorDTO(
  macAddress: string,
  name: string,
  description: string,
  variable: string,
  unit: string 
): SensorDTO {
  return removeNullAttributes({
    macAddress,
    name,
    description,
    variable,
    unit
  }) as SensorDTO;
}

export function mapSensorDAOToDTO(sensorDAO: SensorDAO): SensorDTO {
  return createSensorDTO(
    sensorDAO.macAddress,
    sensorDAO.name,
    sensorDAO.description,
    sensorDAO.variable,
    sensorDAO.unit
  );
}


//Stats
export function createStatsDTO(
  startDate: Date,
  endDate : Date,
  mean: number,
  variance: number,
  upperThreshold: number,
  lowerThreshold : number
):StatsDTO{  
  return removeNullAttributes({
    startDate,
    endDate,
    mean,
    variance,
    upperThreshold,
    lowerThreshold
  }) as StatsDTO  
}
export function mapStatsDAOtoDTO(startDate,endDate,mean, variance, upperThreshold, lowerThreshold) : StatsDTO
{
  return createStatsDTO(
    startDate,
    endDate,
    mean,
    variance,
    upperThreshold,
    upperThreshold
  )
}
//Single Measurement
export function createMeasurentDTO(
  createdAt: Date,
  value: number,
  isOutlier?: boolean
) :MeasurementDTO {
  return removeNullAttributes({
    createdAt,
    value,
    isOutlier
}) as MeasurementDTO
}
export function mapMeasurementDAOtoDTO(measurementDAO : MeasurementsDAO): MeasurementDTO
{
  return createMeasurentDTO(
   measurementDAO.createdAt,
   measurementDAO.value,
   measurementDAO.isOutlier  
  )
}
//Measurements

export function createMeasurentsDTO(
  sensorMacAddress :string,
  stats? : StatsDTO,
  measurements? : Array<MeasurementDTO>
) : MeasurementsDTO
{
  return removeNullAttributes({
    sensorMacAddress,
    stats,
    measurements
  }) as MeasurementsDTO
}

//Utility functions
function removeNullAttributes<T>(dto: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(dto).filter(
      ([_, value]) =>
        value !== null &&
        value !== undefined &&
        (!Array.isArray(value) || value.length > 0)
    )
  ) as Partial<T>;
}

