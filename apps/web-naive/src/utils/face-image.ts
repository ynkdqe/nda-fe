/**
 * Xử lý ảnh khuôn mặt phía trình duyệt trước khi gửi chấm công:
 * crop/thu nhỏ bằng canvas rồi nén JPEG (~90%), mục tiêu <= 500KB.
 * Không gửi ảnh gốc từ camera (vài MB) lên server.
 */

/** Cạnh dài tối đa sau khi resize (px). */
const MAX_SIDE = 800;
/** Dung lượng mục tiêu sau khi nén. */
const TARGET_BYTES = 500 * 1024;
/** Giới hạn cứng của backend. */
export const FACE_IMAGE_MAX_BYTES = 1024 * 1024;
/** Giới hạn file chọn từ thiết bị trước khi xử lý. */
export const FACE_SOURCE_MAX_BYTES = 15 * 1024 * 1024;

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Encode failed'))),
      'image/jpeg',
      quality,
    );
  });
}

async function encodeJpeg(
  source: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
) {
  const scale = Math.min(1, MAX_SIDE / Math.max(sw, sh));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  // Bắt đầu 90%, giảm dần nếu vẫn vượt mục tiêu
  let quality = 0.9;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > TARGET_BYTES && quality > 0.6) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, quality);
  }
  if (blob.size > FACE_IMAGE_MAX_BYTES) throw new Error('Image too large');
  return blob;
}

/**
 * Chụp 1 khung hình từ video camera, crop vùng giữa tỉ lệ 3:4 (khớp khung oval hướng dẫn).
 */
export function captureFaceFromVideo(video: HTMLVideoElement) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) throw new Error('Camera not ready');

  let cw = vw;
  let ch = (vw * 4) / 3;
  if (ch > vh) {
    ch = vh;
    cw = (vh * 3) / 4;
  }
  return encodeJpeg(video, (vw - cw) / 2, (vh - ch) / 2, cw, ch);
}

/** Ảnh chọn từ thiết bị: giữ nguyên khung hình, chỉ thu nhỏ + nén. */
export async function resizeFaceImageFile(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error('Invalid image dimensions');
    }
    return await encodeJpeg(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

const DEVICE_ID_KEY = 'nda.faceid.deviceId';

/** ID thiết bị ổn định (lưu localStorage) để HR hậu kiểm lượt chấm công. */
export function getFaceDeviceId() {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return undefined;
  }
}
