import { CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ select: false })
  deletedAt!: Date | null;
}
