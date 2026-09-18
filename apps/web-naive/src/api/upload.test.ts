import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { post, notify } = vi.hoisted(() => ({
  post: vi.fn(),
  notify: vi.fn(),
}));

vi.mock('./request', () => ({ requestClient: { post } }));
vi.mock('#/adapter/naive', () => ({ message: { error: notify } }));
vi.mock('#/locales', () => ({ $t: (key: string) => key }));

import { uploadProfileAvatarApi } from './upload';

const imageUrl = 'https://storage.example.com/avatar.png';
const file = new File(['image'], 'avatar.png', { type: 'image/png' });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('VITE_APP_UPLOAD_URL', 'https://upload-dev.anhnd.me/upload');
  post.mockResolvedValue({ success: true, data: { url: imageUrl } });
});

afterEach(() => vi.unstubAllEnvs());

describe('uploadProfileAvatarApi', () => {
  it('sends the file directly to the upload service with OCI storage', async () => {
    await expect(uploadProfileAvatarApi(file)).resolves.toBe(imageUrl);
    const [url, body, config] = post.mock.calls[0]!;
    expect(url).toBe('https://upload-dev.anhnd.me/upload?storage=oci');
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('file')).toBe(file);
    expect(config).toEqual({
      headers: { 'Content-Type': null },
      responseReturn: 'body',
      timeout: 120_000,
    });
  });

  it('uses the configured production endpoint rather than the API base URL', async () => {
    vi.stubEnv('VITE_APP_UPLOAD_URL', 'https://upload.anhnd.me/upload');
    await uploadProfileAvatarApi(file);
    expect(post.mock.calls[0]?.[0]).toBe('https://upload.anhnd.me/upload?storage=oci');
  });

  it.each(['', '/api/media/upload', 'http://upload.example.com/upload', 'https://user:password@upload.example.com/upload'])(
    'fails closed for invalid configuration %s',
    async (endpoint) => {
      vi.stubEnv('VITE_APP_UPLOAD_URL', endpoint);
      await expect(uploadProfileAvatarApi(file)).rejects.toThrow('invalidEndpoint');
      expect(post).not.toHaveBeenCalled();
      expect(notify).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    { success: true, data: null },
    { success: false, data: { url: imageUrl } },
    { success: true, data: { url: '' } },
    { success: true, data: { url: 'javascript:alert(1)' } },
  ])('rejects an invalid upload response', async (response) => {
    post.mockResolvedValue(response);
    await expect(uploadProfileAvatarApi(file)).rejects.toThrow('invalidResponse');
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('propagates request failures without duplicate notifications', async () => {
    const error = new Error('Upload failed');
    post.mockRejectedValue(error);
    await expect(uploadProfileAvatarApi(file)).rejects.toBe(error);
    expect(notify).not.toHaveBeenCalled();
  });
});
