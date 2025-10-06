import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, OneToMany, OneToOne } from "typeorm";
import { SensorDAO } from "./SensorDAO";

@Entity("Measurements")
export class MeasurementsDAO {
  

  @PrimaryColumn({ nullable: false })
  createdAt: Date;

  @PrimaryColumn({ nullable: false })
  sensorMacAddress: string;
  
  @Column({ type: "float", nullable: false })
  value: number;

  @Column({ nullable: false })
  isOutlier: boolean;

  @ManyToOne(() => SensorDAO, (sensor) => sensor.measurements, { nullable: false, onDelete: "CASCADE", onUpdate: "CASCADE" })
  @JoinColumn({ name: "sensorMacAddress", referencedColumnName: "macAddress" })
  sensor: SensorDAO;

}

