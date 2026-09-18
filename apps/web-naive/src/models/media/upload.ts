import type { MResult } from '#/models/common';

/** Response from the standalone upload service (POST /upload?storage=oci). */
export namespace UploadApi {
  export interface Item {
    id: string;
    filename: string;
    mimeType: string;
    url: string;
    objectKey: string;
    size: number;
    width: null | number;
    height: null | number;
    storageType: string;
  }

  export type Result = MResult<Item>;
}
