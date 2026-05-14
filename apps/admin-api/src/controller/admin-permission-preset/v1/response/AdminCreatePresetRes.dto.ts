import { ApiProperty } from '@nestjs/swagger';

import { Exclude, Expose } from 'class-transformer';

export class AdminCreatePresetRes {
  @Exclude() private readonly _id: number;

  constructor(id: number) {
    this._id = id;
  }

  @Expose()
  @ApiProperty({ type: 'integer', description: '생성된 프리셋 ID' })
  get id(): number {
    return this._id;
  }

  static of(id: number): AdminCreatePresetRes {
    return new AdminCreatePresetRes(id);
  }
}
