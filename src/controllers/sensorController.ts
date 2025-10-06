import { SensorDAO } from "@models/dao/SensorDAO";
import {Sensor as SensorDTO} from "@dto/Sensor"
import {Gateway as GatewayDTO} from "@dto/Gateway";
import { SensorRepository } from "@repositories/SensorRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import {mapSensorDAOToDTO} from "@services/mapperService";
import { NotFoundError } from "@models/errors/NotFoundError";


export async function getSensorByGatewayMacAddress(macAddressGateway: string, netCode?:string): Promise<SensorDTO[]>
{
    const sensorRepo = new SensorRepository();
    const sensors = await sensorRepo.getSensorByGatewayMacAddress(macAddressGateway);
    const gatewayRepo = new GatewayRepository();
    const gateway = await gatewayRepo.getSingleGatewayByMacAdd(macAddressGateway);
    if (netCode && gateway.network.code !== netCode) {
        throw new NotFoundError(`Gateway with macAddress '${macAddressGateway}' not found in network '${netCode}'`);
    }
    return (sensors).map(mapSensorDAOToDTO)
}
export async function getSingleSensorByMacAddress(macAddress: string, netCode?:string, macAddressGateway?:string): Promise<SensorDTO>
{
    const sensorRepo = new SensorRepository();
    const gatewayRepo = new GatewayRepository();
    const gateway = await gatewayRepo.getSingleGatewayByMacAdd(macAddressGateway);
    if (netCode && macAddressGateway && gateway.network.code !== netCode) {
        throw new NotFoundError(`Gateway with macAddress '${macAddressGateway}' not found in network '${netCode}'`);
    }
    return mapSensorDAOToDTO(await sensorRepo.getSingleSensorByMacAddress(macAddress))
}

export async function createSensor(sensorDTO : SensorDTO, macAddressGateway: string, netCode?:string): Promise<void>{
    const sensorRepo = new SensorRepository();
    const gatewayRepo = new GatewayRepository();
    const gateway = await gatewayRepo.getSingleGatewayByMacAdd(macAddressGateway);
    if (netCode && gateway.network.code !== netCode) {
        throw new NotFoundError(`Gateway with macAddress '${macAddressGateway}' not found in network '${netCode}'`);
    }
    await sensorRepo.createSensor(
        sensorDTO.macAddress,
        macAddressGateway,
        sensorDTO.name,
        sensorDTO.description,
        sensorDTO.variable,
        sensorDTO.unit
    )
}

export async function updateSensor(
    macAddress : string,
    sensorDTO: SensorDTO,
    macAddressGateway?: string,
    netCode?: string
) :Promise<void>
{
    const sensorRepo = new SensorRepository();
    const gatewayRepo = new GatewayRepository();
    const gateway = await gatewayRepo.getSingleGatewayByMacAdd(macAddressGateway);
    if (netCode && macAddressGateway && gateway.network.code !== netCode) {
        throw new NotFoundError(`Gateway with macAddress '${macAddressGateway}' not found in network '${netCode}'`);
    }
    await sensorRepo.updateSensor(
        macAddress,sensorDTO.macAddress,
        sensorDTO.name,
        sensorDTO.description,
        sensorDTO.variable,
        sensorDTO.unit
    )
}

export async function deleteSensor(macAddress: string, netCode?:string, macAddressGateway?:string): Promise<void>{
    
    const sensorRepo = new SensorRepository();
    const gatewayRepo = new GatewayRepository();
    const gateway = await gatewayRepo.getSingleGatewayByMacAdd(macAddressGateway);
    if (netCode && macAddressGateway && gateway.network.code !== netCode) {
        throw new NotFoundError(`Gateway with macAddress '${macAddressGateway}' not found in network '${netCode}'`);
    }
    await sensorRepo.deleteSensor(macAddress);
}