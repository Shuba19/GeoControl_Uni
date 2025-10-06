import { Network as NetworkDTO } from "@dto/Network";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { mapGatewayDAOToDTO, mapNetworkDAOToDTO } from "@services/mapperService";
import {getNetworkGateway, RetrieveAssociatedSensors} from "./gatewayController";

export async function getAllNetworks(): Promise<NetworkDTO[]> {
  const networkRepo = new NetworkRepository();
  const nets = (await networkRepo.getAllNetworks()).map(mapNetworkDAOToDTO);
  for (const net of nets) {
    net.gateways = await getNetworkGateway(net.code);
    // Remove gateways if empty or undefined
    if (!net.gateways || net.gateways.length === 0) {
      delete net.gateways;
    }
  }
  return nets;
}

export async function getSingleNetworkByMacAdd(code: string): Promise<NetworkDTO> {
  const networkRepo = new NetworkRepository();
  const netDTO = mapNetworkDAOToDTO(await networkRepo.getSingleNetworkByMacAdd(code));
  netDTO.gateways = (await getNetworkGateway(code));
  // Remove gateways if empty or undefined
  if (!netDTO.gateways || netDTO.gateways.length === 0) {
    delete netDTO.gateways;
  }
  return netDTO;
}

export async function createNetwork(networkDto: NetworkDTO): Promise<void> {
  const networkRepo = new NetworkRepository();
  await networkRepo.createNetwork(
    networkDto.code,
    networkDto.name,
    networkDto.description
  );
}

export async function updateNetwork(
  code: string,
  networkDto: NetworkDTO
): Promise<void> {
  const networkRepo = new NetworkRepository();
  await networkRepo.updateNetwork(
    code,
    networkDto.code,
    networkDto.name,
    networkDto.description
  );
}

export async function deleteNetwork(code: string): Promise<void> {
  const networkRepo = new NetworkRepository();
  await networkRepo.deleteNetwork(code);
}
