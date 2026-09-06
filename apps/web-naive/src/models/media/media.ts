import type { MResult } from '#/models/common';

export namespace MediaApi {
  /** Maps MediaDto trả về từ POST /api/media/upload. */
  export interface Item {
    id: string;
    name?: null | string;
    size?: null | number;
    typeFile?: null | string;
    url: string;
  }

  export type UploadResult = MResult<Item>;
}
