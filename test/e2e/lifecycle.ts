import {
  initializeTestDataSource,
  closeTestDataSource
} from "@test/setup/test-datasource";
import { UserRepository } from "@repositories/UserRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import { MeasurementsRepository } from "@repositories/MeasurementRepository";
import { UserType } from "@models/UserType";

export const TEST_USERS = {
  admin: { username: "admin", password: "adminpass", type: UserType.Admin },
  operator: {
    username: "operator",
    password: "operatorpass",
    type: UserType.Operator
  },
  viewer: { username: "viewer", password: "viewerpass", type: UserType.Viewer }
};

export const TEST_NETWORKS = {
  net1: { code: "NET01", name: "Test Network", description: "A test network" },
  net2: { code: "NET02", name: "Another Network", description: "Another test network" }
};

export const TEST_GATEWAYS = {
  gw1: { macAddress : "GW01", name: "Test Gateway 1",description : "Description", networkCode: TEST_NETWORKS.net1.code },
  gw2: { macAddress : "GW02", name: "Test Gateway 2",description : "Description", networkCode: TEST_NETWORKS.net1.code }
}

export const TEST_SENSORS = {
  sensor1: {
    macAddress: "SENSOR01",
    name: "Test Sensor 1",
    description: "Description of Test Sensor 1",
    variable: "temperature",
    unit: "C",
    gatewayMacAddress: TEST_GATEWAYS.gw1.macAddress
  },
  sensor2: {
    macAddress: "SENSOR02",
    name: "Test Sensor 2",
    description: "Description of Test Sensor 2",
    variable: "temperature",
    unit: "F",
    gatewayMacAddress: TEST_GATEWAYS.gw1.macAddress
  },
  sensor3: {
    macAddress: "SENSOR03",
    name: "Test Sensor 3",
    description: "Description of Test Sensor 3",
    variable: "light",
    unit: "Lux",
    gatewayMacAddress: TEST_GATEWAYS.gw2.macAddress
  }
};
export const TEST_MEASUREMENTS = {
  measurement1_1: {
    sensorMacAddress: TEST_SENSORS.sensor1.macAddress,
    value: 22.5,
    createdAt: new Date("2023-10-01T12:00:00Z"),
    isOutlier: false
  },
  measurement1_2: {
    sensorMacAddress: TEST_SENSORS.sensor1.macAddress,
    value: 23.0,
    createdAt: new Date("2023-10-01T12:01:00Z"),
    isOutlier: true
  },
  measurement1_3: {
    sensorMacAddress: TEST_SENSORS.sensor1.macAddress,
    value: 21.8,
    createdAt: new Date("2023-10-01T12:02:00Z"),
    isOutlier: false
  },
  measurement2_1: {
    sensorMacAddress: TEST_SENSORS.sensor2.macAddress,
    value: 45.0,
    createdAt: new Date("2023-10-01T12:05:00Z"),
    isOutlier: true
  },
  measurement2_2: {
    sensorMacAddress: TEST_SENSORS.sensor2.macAddress,
    value: 50.0,
    createdAt: new Date("2023-10-01T12:06:00Z"),
    isOutlier: false
  },
  measurement3_1: {
    sensorMacAddress: TEST_SENSORS.sensor3.macAddress,
    value: 101325,
    createdAt: new Date("2023-10-01T12:10:00Z"),
    isOutlier: true
  },
  measurement3_2: {
    sensorMacAddress: TEST_SENSORS.sensor3.macAddress,
    value: 101300,
    createdAt: new Date("2023-10-01T12:11:00Z"),
    isOutlier: false
  },
  measurement3_3: {
    sensorMacAddress: TEST_SENSORS.sensor3.macAddress,
    value: 101400,
    createdAt: new Date("2023-10-01T12:12:00Z"),
    isOutlier: true
  }
};


export async function beforeAllE2e() {
  await initializeTestDataSource();
  const userRepo = new UserRepository();
  await userRepo.createUser(
    TEST_USERS.admin.username,
    TEST_USERS.admin.password,
    TEST_USERS.admin.type
  );
  await userRepo.createUser(
    TEST_USERS.operator.username,
    TEST_USERS.operator.password,
    TEST_USERS.operator.type
  );
  await userRepo.createUser(
    TEST_USERS.viewer.username,
    TEST_USERS.viewer.password,
    TEST_USERS.viewer.type
  );

  // Create default network for e2e tests
  const networkRepo = new NetworkRepository();
  await networkRepo.createNetwork(
    TEST_NETWORKS.net1.code,
    TEST_NETWORKS.net1.name,
    TEST_NETWORKS.net1.description
  );
  const network = await networkRepo.getAllNetworks();
  const gateRepo = new GatewayRepository();
  for (const gwKey in TEST_GATEWAYS) {
    const gw = TEST_GATEWAYS[gwKey];
    await gateRepo.createGateway(
      gw.macAddress,
      gw.name,
      gw.description,
      gw.networkCode
    );
  }
  for (const sensorKey in TEST_SENSORS) {
    const sensor = TEST_SENSORS[sensorKey];
    await new SensorRepository().createSensor(
      sensor.macAddress,
      sensor.gatewayMacAddress,
      sensor.name,
      sensor.description,
      sensor.variable,
      sensor.unit
    );
  }
}

export async function afterAllE2e() {
  await closeTestDataSource();
}
