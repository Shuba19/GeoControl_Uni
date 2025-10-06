import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToOne, OneToMany } from "typeorm";
import { GatewayDAO } from "./GatewayDAO";
import { MeasurementsDAO } from "./MeasurementsDAO";

@Entity("sensors")
export class SensorDAO {
    @PrimaryColumn({ nullable: false })
    macAddress: string;

    @Column({ nullable: false })
    macAddressGateway: string;

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: false })
    description: string;

    @Column({ nullable: false })
    variable: string;

    @Column({ nullable: false })
    unit: string;

    @ManyToOne(() => GatewayDAO, (gateway) => gateway.sensors, { nullable: false, onDelete: "CASCADE" , onUpdate: "CASCADE"})
    @JoinColumn({ name: "macAddressGateway", referencedColumnName: "macAddress" })
    gateway: GatewayDAO;

    @OneToMany(() => MeasurementsDAO, (measurements) => measurements.sensor)
    measurements: MeasurementsDAO;
}