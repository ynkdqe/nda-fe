// Simple weather/location API helpers for the dashboard workspace
import { requestClient } from '#/api/request';

export interface IpLocation {
  city?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperature?: number;
  windspeed?: number;
  weathercode?: number;
}

// Open-Meteo weather code mapping
export const weatherCodeMap: Record<number, string> = {
  0: 'Trời quang đãng',
  1: 'Có mây nhẹ',
  2: 'Có mây rải rác',
  3: 'Nhiều mây',
  45: 'Sương mù',
  48: 'Sương mù băng giá',
  51: 'Mưa phùn nhẹ',
  53: 'Mưa phùn',
  55: 'Mưa phùn dày đặc',
  56: 'Mưa phùn đóng băng nhẹ',
  57: 'Mưa phùn đóng băng dày đặc',
  61: 'Mưa nhẹ',
  63: 'Mưa vừa',
  65: 'Mưa to',
  66: 'Mưa đóng băng nhẹ',
  67: 'Mưa đóng băng mạnh',
  71: 'Tuyết rơi nhẹ',
  73: 'Tuyết rơi vừa',
  75: 'Tuyết rơi dày',
  77: 'Mưa tuyết hạt nhỏ',
  80: 'Mưa rào nhẹ',
  81: 'Mưa rào vừa',
  82: 'Mưa rào mạnh',
  85: 'Mưa tuyết rào nhẹ',
  86: 'Mưa tuyết rào mạnh',
  95: 'Dông bão',
  96: 'Dông bão kèm mưa đá nhẹ',
  99: 'Dông bão kèm mưa đá mạnh',
};

// Resolve localized description for a weather code using i18n when available
export function resolveWeatherDescription(
  weathercode: number | undefined,
  t?: (key: string, args?: Record<string, any>) => string,
): string {
  const code = weathercode === undefined ? 'unknown' : String(weathercode);
  const key = `page.dashboard.workspace.weather.codes.${code}`;

  if (t) {
    try {
      const translated = t(key);
      // vue-i18n returns the key itself when missing
      if (translated && translated !== key) return translated as string;
    } catch {
      // ignore
    }
  }

  return (
    weatherCodeMap[Number(code)] ||
    (t
      ? (t('page.dashboard.workspace.weather.codes.unknown') as string)
      : 'Thời tiết thay đổi')
  );
}

// Get approximate location by public IP using the project's base request client
export async function getLocationByIp(
  forceRefresh = false,
): Promise<IpLocation> {
  const cacheKey = 'weather:ipLocation';
  if (!forceRefresh) {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const lat = Number(parsed?.latitude);
        const lon = Number(parsed?.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          return {
            city: parsed?.city,
            country: parsed?.country,
            latitude: lat,
            longitude: lon,
          };
        }
      }
    } catch {}
  }

  // Gọi API thông qua requestClient (tự động dùng Base API URL)
  const response = await requestClient.get('/api/location',{
    responseReturn: "body",
  });

  // Bóc tách trường data từ BaseResponse của bạn
  const data = response.data;

  if (!response.success || !data) {
    throw new Error(
      response.message || 'Không nhận được dữ liệu từ API vị trí.',
    );
  }

  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new TypeError('Không xác định được vị trí hiện tại.');
  }
  const result: IpLocation = {
    city: data.city,
    country: data.country,
    latitude,
    longitude,
  };
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ ...result, cachedAt: Date.now() }),
    );
  } catch {}
  return result;
}

// Get current weather from Open-Meteo
export async function getCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<CurrentWeather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Weather request failed: ${res.status}`);
  }
  const data: any = await res.json();
  return data?.current_weather ?? {};
}

// Get current weather with localStorage caching by coordinates
export async function getCachedCurrentWeather(
  latitude: number,
  longitude: number,
  ttlMs = 10 * 60 * 1000, // default 10 minutes
): Promise<CurrentWeather> {
  const key = `weather:current:${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  const now = Date.now();
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const cached = JSON.parse(raw);
      if (
        cached?.data &&
        typeof cached.cachedAt === 'number' &&
        now - cached.cachedAt < ttlMs
      ) {
        return cached.data as CurrentWeather;
      }
    }
  } catch {}

  const data = await getCurrentWeather(latitude, longitude);
  try {
    localStorage.setItem(key, JSON.stringify({ cachedAt: now, data }));
  } catch {}
  return data;
}
