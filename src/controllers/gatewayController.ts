import {Gateway as GatewayDTO} from "@dto/Gateway";
import { GatewayDAO } from "@models/dao/GatewayDAO";
import {Sensor as SensorDTO} from "@dto/Sensor"
import {GatewayRepository} from "@repositories/GatewayRepository"
import { SensorRepository } from "@repositories/SensorRepository";
import {mapGatewayDAOToDTO,mapSensorDAOToDTO} from "@services/mapperService";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { NotFound } from "express-openapi-validator/dist/openapi.validator";
import { NotFoundError } from "@models/errors/NotFoundError";

export async function RetrieveAssociatedSensors(macAddress : string): Promise<SensorDTO[]>
{
    const sensorRepo = new SensorRepository()
    const sensors = (await sensorRepo.getSensorByGatewayMacAddress(macAddress)).map(mapSensorDAOToDTO)
    return sensors
}
/*
export async function getAllGateways(): Promise<GatewayDTO[]>
{
    const gateRepo = new GatewayRepository();
    const gateDTO = (await gateRepo.getAllGateways()).map(mapGatewayDAOToDTO)
    for(const gw of gateDTO)
    {
        gw.sensors = await RetrieveAssociatedSensors(gw.macAddress)
    }
    return gateDTO
}*/
export async function getNetworkGateway(code:string): Promise<GatewayDTO[]>{
    const gateRepo = new GatewayRepository();
    const gateDTO = (await gateRepo.getAllGatewaysByCode(code)).map(mapGatewayDAOToDTO)
    for(const gw of gateDTO)
    {
            gw.sensors = await RetrieveAssociatedSensors(gw.macAddress)
    }
    return gateDTO
}
export async function getSingleGatewayByMacAdd(macAddress: string, code?:string): Promise<GatewayDTO>
{
    const netRepo = new NetworkRepository();
    const network = await netRepo.getSingleNetworkByMacAdd(code);
    const gateRepo = new GatewayRepository();
    const gateDTO = mapGatewayDAOToDTO(await gateRepo.getSingleGatewayByMacAdd(macAddress))
    const sens = await RetrieveAssociatedSensors(gateDTO.macAddress);
    gateDTO.sensors = await RetrieveAssociatedSensors(gateDTO.macAddress);
    return gateDTO
}

export async function createGateway(gatewayDTO : GatewayDTO, code:string): Promise<void>{
    const gateRepo = new GatewayRepository();
    await gateRepo.createGateway(
        gatewayDTO.macAddress,
        gatewayDTO.name,
        gatewayDTO.description,
        code
    )
}

export async function updateGateway(
    macAddress : string,
    gatewayDTO: GatewayDTO,
    code?:string
) :Promise<void>
{
    const gateRepo = new GatewayRepository();
    const existingGateway = await gateRepo.getSingleGatewayByMacAdd(macAddress);
    if(code && existingGateway.network.code !== code){
        throw new NotFoundError(`Gateway with macAddress '${macAddress}' not found in network '${code}'`);
    }
    await gateRepo.updateGateway(macAddress,gatewayDTO.macAddress, gatewayDTO.name,gatewayDTO.description)
}

export async function deleteGateway(macAddress: string, code?:string): Promise<void>{
    const gateRepo = new GatewayRepository();
    const existingGateway = await gateRepo.getSingleGatewayByMacAdd(macAddress);
    if(code && existingGateway.network.code !== code){
        throw new NotFoundError(`Gateway with macAddress '${macAddress}' not found in network '${code}'`);
    }
    await gateRepo.deleteGateway(macAddress);
}