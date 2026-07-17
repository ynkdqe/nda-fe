<script lang="ts" setup>
import type { DataTableColumns, SelectOption } from 'naive-ui';

import type { LocationApi } from '#/api';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NForm,
  NFormItem,
  NInputNumber,
  NSelect,
  NSpace,
  NTabPane,
  NTabs,
} from 'naive-ui';

import { getLocationApi, validateLocationApi } from '#/api';
import { $t } from '#/locales';

type LocationVendor = 'Geoapify' | 'Google' | 'Goong' | 'Mapbox';

interface Coordinates {
  latitude: null | number;
  longitude: null | number;
  vendor: LocationVendor;
}

const vendorOptions: SelectOption[] = [
  { label: 'Goong', value: 'Goong' },
  { label: 'Google', value: 'Google' },
  { label: 'Mapbox', value: 'Mapbox' },
  { label: 'Geoapify', value: 'Geoapify' },
];

const coordinateForm = reactive<Coordinates>({
  latitude: null,
  longitude: null,
  vendor: 'Goong',
});

const distanceForm = reactive<{
  allowedDistance: null | number;
  defaultLatitude: null | number;
  defaultLongitude: null | number;
  targetLatitude: null | number;
  targetLongitude: null | number;
}>({
  allowedDistance: null,
  defaultLatitude: null,
  defaultLongitude: null,
  targetLatitude: null,
  targetLongitude: null,
});

const coordinateError = ref('');
const locationLoading = ref(false);
const locationResults = ref<LocationApi.LocationItem[]>([]);
const locationColumns = computed<DataTableColumns<LocationApi.LocationItem>>(
  () => [
    {
      key: 'index',
      render: (_row, index) => index + 1,
      title: '#',
      width: 60,
    },
    {
      key: 'address',
      minWidth: 320,
      title: $t('demos.location.table.address'),
    },
    {
      key: 'lat',
      title: $t('demos.location.table.latitude'),
      width: 160,
    },
    {
      key: 'long',
      title: $t('demos.location.table.longitude'),
      width: 160,
    },
  ],
);
const distanceError = ref('');
const validationLoading = ref(false);
const validationMessage = ref('');
const validationResult = ref<LocationApi.ValidationResult | null>(null);

function isValidLatitude(value: null | number): value is number {
  return value !== null && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: null | number): value is number {
  return (
    value !== null && Number.isFinite(value) && value >= -180 && value <= 180
  );
}

function validateCoordinates(latitude: null | number, longitude: null | number) {
  if (latitude === null || longitude === null) {
    return $t('demos.location.validation.requiredCoordinates');
  }
  if (!isValidLatitude(latitude)) {
    return $t('demos.location.validation.invalidLatitude');
  }
  if (!isValidLongitude(longitude)) {
    return $t('demos.location.validation.invalidLongitude');
  }
  return '';
}

async function handleCheckCoordinates() {
  coordinateError.value = validateCoordinates(
    coordinateForm.latitude,
    coordinateForm.longitude,
  );
  locationResults.value = [];

  if (coordinateError.value) {
    return;
  }

  locationLoading.value = true;
  try {
    const response = await getLocationApi({
      lat: coordinateForm.latitude as number,
      lon: coordinateForm.longitude as number,
      vendor: coordinateForm.vendor.toLowerCase(),
    });

    if (!response.success) {
      coordinateError.value =
        response.message || $t('demos.location.errors.requestFailed');
      return;
    }

    locationResults.value = response.data ?? [];
  } catch (error) {
    coordinateError.value =
      error instanceof Error
        ? error.message
        : $t('demos.location.errors.requestFailed');
  } finally {
    locationLoading.value = false;
  }
}

async function handleCheckDistance() {
  validationResult.value = null;
  validationMessage.value = '';

  const defaultCoordinateError = validateCoordinates(
    distanceForm.defaultLatitude,
    distanceForm.defaultLongitude,
  );
  if (defaultCoordinateError) {
    distanceError.value = defaultCoordinateError;
    return;
  }

  const targetCoordinateError = validateCoordinates(
    distanceForm.targetLatitude,
    distanceForm.targetLongitude,
  );
  if (targetCoordinateError) {
    distanceError.value = targetCoordinateError;
    return;
  }

  if (
    distanceForm.allowedDistance === null ||
    !Number.isFinite(distanceForm.allowedDistance) ||
    distanceForm.allowedDistance < 0
  ) {
    distanceError.value = $t('demos.location.validation.invalidDistance');
    return;
  }

  distanceError.value = '';
  validationLoading.value = true;

  try {
    const response = await validateLocationApi({
      allowedDistance: distanceForm.allowedDistance,
      defaultLat: String(distanceForm.defaultLatitude),
      defaultLong: String(distanceForm.defaultLongitude),
      lat: String(distanceForm.targetLatitude),
      long: String(distanceForm.targetLongitude),
    });

    if (!response.success || !response.data) {
      distanceError.value =
        response.message || $t('demos.location.errors.validationFailed');
      return;
    }

    validationResult.value = response.data;
    validationMessage.value = response.message ?? '';
  } catch (error) {
    distanceError.value =
      error instanceof Error
        ? error.message
        : $t('demos.location.errors.validationFailed');
  } finally {
    validationLoading.value = false;
  }
}
</script>

<template>
  <Page
    :description="$t('demos.location.description')"
    :title="$t('demos.location.title')"
  >
    <NCard>
      <NTabs type="line" animated>
        <NTabPane
          name="coordinates"
          :tab="$t('demos.location.tabs.coordinates')"
        >
          <NForm label-placement="top" class="max-w-[760px]">
            <NFormItem :label="$t('demos.location.vendor')" required>
              <NSelect
                v-model:value="coordinateForm.vendor"
                :options="vendorOptions"
                :placeholder="$t('demos.location.placeholders.vendor')"
              />
            </NFormItem>

            <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
              <NFormItem :label="$t('demos.location.latitude')" required>
                <NInputNumber
                  v-model:value="coordinateForm.latitude"
                  :max="90"
                  :min="-90"
                  :placeholder="$t('demos.location.placeholders.latitude')"
                  class="w-full"
                  clearable
                />
              </NFormItem>
              <NFormItem :label="$t('demos.location.longitude')" required>
                <NInputNumber
                  v-model:value="coordinateForm.longitude"
                  :max="180"
                  :min="-180"
                  :placeholder="$t('demos.location.placeholders.longitude')"
                  class="w-full"
                  clearable
                />
              </NFormItem>
            </div>

            <NSpace>
              <NButton
                type="primary"
                :loading="locationLoading"
                @click="handleCheckCoordinates"
              >
                <template #icon>
                  <IconifyIcon icon="lucide:map-pin-check" />
                </template>
                {{ $t('demos.location.check') }}
              </NButton>
            </NSpace>
          </NForm>

          <NAlert
            v-if="coordinateError"
            class="mt-4 max-w-[760px]"
            type="error"
            :title="$t('demos.location.result.invalidCoordinates')"
          >
            {{ coordinateError }}
          </NAlert>
          <div class="mt-4">
            <NDataTable
              :columns="locationColumns"
              :data="locationResults"
              :loading="locationLoading"
              :pagination="false"
              :scroll-x="700"
              :single-line="false"
            />
          </div>
        </NTabPane>

        <NTabPane name="distance" :tab="$t('demos.location.tabs.distance')">
          <NForm label-placement="top" class="max-w-[760px]">
            <h3 class="mb-3 font-semibold">
              {{ $t('demos.location.defaultLocation') }}
            </h3>
            <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
              <NFormItem :label="$t('demos.location.latitude')" required>
                <NInputNumber
                  v-model:value="distanceForm.defaultLatitude"
                  :max="90"
                  :min="-90"
                  :placeholder="$t('demos.location.placeholders.latitude')"
                  class="w-full"
                  clearable
                />
              </NFormItem>
              <NFormItem :label="$t('demos.location.longitude')" required>
                <NInputNumber
                  v-model:value="distanceForm.defaultLongitude"
                  :max="180"
                  :min="-180"
                  :placeholder="$t('demos.location.placeholders.longitude')"
                  class="w-full"
                  clearable
                />
              </NFormItem>
            </div>

            <NFormItem :label="$t('demos.location.allowedDistance')" required>
              <NInputNumber
                v-model:value="distanceForm.allowedDistance"
                :min="0"
                :placeholder="$t('demos.location.placeholders.allowedDistance')"
                class="w-full"
                clearable
              >
                <template #suffix>m</template>
              </NInputNumber>
            </NFormItem>

            <h3 class="mb-3 font-semibold">
              {{ $t('demos.location.targetLocation') }}
            </h3>
            <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
              <NFormItem :label="$t('demos.location.latitude')" required>
                <NInputNumber
                  v-model:value="distanceForm.targetLatitude"
                  :max="90"
                  :min="-90"
                  :placeholder="$t('demos.location.placeholders.latitude')"
                  class="w-full"
                  clearable
                />
              </NFormItem>
              <NFormItem :label="$t('demos.location.longitude')" required>
                <NInputNumber
                  v-model:value="distanceForm.targetLongitude"
                  :max="180"
                  :min="-180"
                  :placeholder="$t('demos.location.placeholders.longitude')"
                  class="w-full"
                  clearable
                />
              </NFormItem>
            </div>

            <NButton
              type="primary"
              :loading="validationLoading"
              @click="handleCheckDistance"
            >
              <template #icon>
                <IconifyIcon icon="lucide:ruler" />
              </template>
              {{ $t('demos.location.submit') }}
            </NButton>
          </NForm>

          <NAlert
            v-if="distanceError"
            class="mt-4 max-w-[760px]"
            type="error"
            :title="$t('demos.location.result.invalidData')"
          >
            {{ distanceError }}
          </NAlert>
          <div v-else-if="validationResult" class="mt-4 max-w-[760px]">
            <NAlert
              class="mb-4"
              :type="validationResult.isValid ? 'success' : 'warning'"
              :title="
                $t(
                  validationResult.isValid
                    ? 'demos.location.result.validLocation'
                    : 'demos.location.result.invalidLocation',
                )
              "
            >
              {{ validationMessage || '-' }}
            </NAlert>

            <NDescriptions bordered :column="2" label-placement="left">
              <NDescriptionsItem
                :label="$t('demos.location.result.defaultLatitude')"
              >
                {{ validationResult.defaultLat }}
              </NDescriptionsItem>
              <NDescriptionsItem
                :label="$t('demos.location.result.defaultLongitude')"
              >
                {{ validationResult.defaultLong }}
              </NDescriptionsItem>
              <NDescriptionsItem
                :label="$t('demos.location.result.targetLatitude')"
              >
                {{ validationResult.lat }}
              </NDescriptionsItem>
              <NDescriptionsItem
                :label="$t('demos.location.result.targetLongitude')"
              >
                {{ validationResult.long }}
              </NDescriptionsItem>
              <NDescriptionsItem
                :label="$t('demos.location.result.isValid')"
                :span="2"
              >
                {{
                  $t(
                    validationResult.isValid
                      ? 'demos.location.result.yes'
                      : 'demos.location.result.no',
                  )
                }}
              </NDescriptionsItem>
            </NDescriptions>
          </div>
        </NTabPane>
      </NTabs>
    </NCard>
  </Page>
</template>
