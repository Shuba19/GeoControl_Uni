import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity("errorDTO")
export class ErrorDTODAO {
    @PrimaryColumn({nullable: false})
    code: number;

    @Column({nullable: false})
    name: string;

    @Column({nullable: false})
    message: string;
}
