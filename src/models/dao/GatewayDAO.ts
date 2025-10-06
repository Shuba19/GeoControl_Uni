import {Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany} from "typeorm";
import { NetworkDAO } from "@models/dao/NetworkDAO";
import { SensorDAO } from "./SensorDAO";

@Entity("gateways")
export class GatewayDAO {
    @PrimaryColumn({nullable: false})
    macAddress: string;

    @Column({nullable: false})
    name: string;

    @Column({nullable: false})
    description: string;

    @Column({nullable: false})
    code: string;
    //code refers to the network code

    @ManyToOne(() => NetworkDAO, (network) => network.code, {nullable: false, onDelete: "CASCADE", onUpdate: "CASCADE"})
    @JoinColumn({name: "code", referencedColumnName: "code"})
    network: NetworkDAO;

    @OneToMany(() => SensorDAO, (sensor) => sensor.gateway)
    sensors: SensorDAO[];
}