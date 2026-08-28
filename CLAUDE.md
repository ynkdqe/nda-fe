# CLAUDE.md

## Mục đích

File này là handoff context cho Claude/Codex và các AI coding agent tiếp tục phát triển repository mà không phải suy đoán lại kiến trúc. Hãy đọc `AGENTS.md` trước; `AGENTS.md` chứa các quy tắc bắt buộc, còn file này mô tả chi tiết repository, workflow và trạng thái hiện tại.

## Tổng quan repository

Repository là Vben Admin monorepo, quản lý bằng `pnpm` workspace và Turbo. Có nhiều app/package, nhưng sản phẩm đang được chỉnh sửa trong các task gần đây là:

```text
apps/web-naive
```

Stack chính:

- Vue 3.5
- TypeScript
- Naive UI
- Vben Admin packages (`@vben/*`)
- VXE Table qua Vben adapter
- Pinia
- Vue Router
- Vite
- Vitest/Playwright có sẵn ở monorepo
- ESLint + Oxlint + Oxfmt

Node/package manager lấy theo config repository; không chuyển sang npm/yarn.

## Các command thường dùng

Từ repository root:

```bash
pnpm install
pnpm dev:naive
pnpm build:naive
pnpm -F @vben/web-naive run typecheck
pnpm -F @vben/web-naive run build
pnpm exec eslint <file-or-directory> --fix
pnpm exec oxfmt <file-or-directory>
pnpm test:unit
```

Không chạy dev server bằng agent nếu command sẽ chạy vô hạn. Khi cần build/test, đặt timeout phù hợp.

`pnpm run format` format/lint gần như toàn monorepo và có thể tác động nhiều file. Không dùng command này cho task hẹp khi working tree đang bẩn. Dùng ESLint/Oxfmt với path cụ thể.

## Alias và import

`apps/web-naive/tsconfig.json` định nghĩa:

```text
#/* -> ./src/*
```

Import convention:

1. Type imports.
2. Vue imports.
3. `@vben/*` imports.
4. Third-party imports như `naive-ui`.
5. `#/*` internal imports.
6. Relative component imports.

Để ESLint tự sắp xếp import khi cần:

```bash
pnpm exec eslint <file> --fix
```

## Bản đồ app `web-naive`

```text
src/
├── adapter/       Vben form, table, Naive adapters
├── api/           HTTP services và request client
├── auth/          SSO/auth helpers
├── components/    Shared app components
├── constants/     Business constants/permissions
├── locales/       Locale setup và resources
├── models/        DTO/types
├── router/        Routes, guards, menu metadata
├── services/      SignalR và services khác
├── store/         Pinia/Vben stores
├── utils/         Utilities
└── views/         Feature pages
```

## API, base request và response pipeline

### Nguồn cấu hình Base URL

File trung tâm:

```text
apps/web-naive/src/api/request.ts
```

Base URL được resolve từ environment/app config:

```ts
const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);
```

`apiURL` được truyền vào `RequestClient`. Mọi service chỉ dùng relative path:

```ts
const PREFIX = '/api/hrms/employee-request-type';
```

Không viết `http://`, `https://`, host hoặc port trong feature service.

### Hai request client hiện có

#### `requestClient`

```ts
export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});
```

Đây là client chuẩn cho API nghiệp vụ. `createRequestClient` đăng ký:

1. Request interceptor cho token và locale.
2. Business-success interceptor cho `success: false`.
3. Default response interceptor của `@vben/request`.
4. Authenticate interceptor cho 401/refresh/logout.
5. Error-message interceptor hiển thị Naive UI message.

Tất cả CRUD HR/Identity/SMS mới nên dùng client này.

#### `baseRequestClient`

```ts
export const baseRequestClient = new RequestClient({ baseURL: apiURL });
```

Đây là client tối giản, không đi qua chuỗi interceptor nghiệp vụ nói trên. Trong code hiện tại nó được dùng cho logout cookie-based:

```ts
export async function logoutApi() {
  return baseRequestClient.post('/auth/logout', {
    withCredentials: true,
  });
}
```

Không dùng `baseRequestClient` cho CRUD mới chỉ vì tên có chữ “base”. Nó không phải client mặc định; `requestClient` mới là client mặc định.

### Request interceptor

Token được lấy theo thứ tự:

```text
useAccessStore().accessToken
persisted token info.access_token
```

Nếu token sắp hết hạn và request không phải `/connect/token`, client refresh trước khi gửi. Biến module-level:

```ts
let refreshTokenPromise: null | Promise<string> = null;
```

đảm bảo các request đồng thời dùng chung một refresh operation.

Header request nghiệp vụ:

```http
Authorization: Bearer <access-token>
Accept-Language: <preferences.app.locale>
```

`/connect/token` không nhận Authorization từ interceptor.

Login dùng form-urlencoded:

```ts
requestClient.post('/connect/token', body, {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    ...(data.tenant ? { 'x-tenant-id': data.tenant } : {}),
  },
  responseReturn: 'body',
});
```

Đây là ngoại lệ auth. Không copy `x-tenant-id` vào từng CRUD service. Nếu tenant phải có trên API nghiệp vụ, xác nhận backend contract và thêm ở tầng request chung hoặc convention tenant hiện có.

### Refresh và re-authentication

Refresh token lấy từ access store hoặc persisted token info. Sau refresh, token mới được lưu lại cùng expiration, refresh token, tenant và metadata liên quan.

Nếu refresh thất bại:

- Xóa token persisted.
- Hiển thị login-expired modal nếu app được cấu hình như vậy; hoặc
- Gọi auth store logout.

Không tự triển khai refresh logic trong feature service/component.

### `responseReturn` của `@vben/request`

Default trên `requestClient` là:

```ts
responseReturn: 'data';
```

Quy tắc dùng trong dự án:

| Giá trị | Kết quả mong đợi | Khi dùng |
| --- | --- | --- |
| `'data'` | Payload data đã được interceptor trích xuất | Endpoint chỉ cần data đơn giản, ví dụ access codes |
| `'body'` | Toàn bộ JSON response body | MResult CRUD, pagination, message, success, dataExtend, error |
| `'raw'` | HTTP response thô | Chỉ khi cần status/header/blob; phải xác nhận signature của RequestClient |

Ví dụ endpoint đơn giản có thể dùng default:

```ts
return requestClient.get<string[]>('/auth/codes');
```

Ví dụ CRUD bắt buộc dùng body:

```ts
return requestClient.get<EmployeeRequestTypeApi.ListResult>(PREFIX, {
  params,
  responseReturn: 'body',
});
```

Nếu quên `'body'` trên list `MResult`, component có thể chỉ nhận `data` và mất `total/current/pageSize/message`.

### Base response model

Định nghĩa chính xác tại:

```text
apps/web-naive/src/models/common/response.ts
```

```ts
export interface MValidationError {
  members?: null | string[];
  message?: null | string;
}

export interface MError<TData = unknown> {
  code?: null | string;
  data?: null | TData;
  details?: null | string;
  message?: null | string;
  validationErrors?: null | MValidationError[];
}

export interface MResult<TData, TDataExtend = unknown, TErrorData = unknown> {
  current?: null | number;
  data?: null | TData;
  dataExtend?: null | TDataExtend;
  error?: null | MError<TErrorData>;
  message?: null | string;
  pageSize?: null | number;
  success: boolean;
  total?: null | number;
}
```

Type mapping:

```ts
type ListResult = MResult<Item[]>;
type DetailResult = MResult<Item>;
type MutationResult = MResult<unknown>;
```

Không tự tạo một response wrapper khác cho module mới nếu backend vẫn trả cùng contract.

### Business error dù HTTP 2xx

Interceptor đọc:

```ts
response.data.success;
```

Nếu bằng `false`, interceptor throw `Error` trước khi component chạy success flow. Message được chọn theo thứ tự:

1. Các message duy nhất trong `error.validationErrors`.
2. `error.details`.
3. `error.message`.
4. `result.message`.
5. Fallback.

Sau đó error message interceptor gọi:

```ts
message.error(errorMessage);
```

Hệ quả cho component:

```ts
try {
  await updateApi(...);
  message.success('Cập nhật thành công');
  drawerApi.close();
  await gridApi.query();
} finally {
  drawerApi.setState({ confirmLoading: false });
}
```

Không viết:

```ts
try {
  await updateApi(...);
} catch {
  // nuốt lỗi
}
message.success('Thành công');
```

vì sẽ hiển thị success sai sau lỗi backend.

### Mẫu API service đầy đủ

```ts
import type { ResourceApi } from '#/models/hr/resource';

import { requestClient } from '#/api/request';

const PREFIX = '/api/hrms/resource';

export function getResourceListApi(params: ResourceApi.ListParams) {
  return requestClient.get<ResourceApi.ListResult>(PREFIX, {
    params,
    responseReturn: 'body',
  });
}

export function getResourceByIdApi(id: number) {
  return requestClient.get<ResourceApi.DetailResult>(`${PREFIX}/${id}`, {
    responseReturn: 'body',
  });
}

export function createResourceApi(data: ResourceApi.CreateInput) {
  return requestClient.post<ResourceApi.MutationResult>(PREFIX, data, {
    responseReturn: 'body',
  });
}

export function updateResourceApi(id: number, data: ResourceApi.UpdateInput) {
  return requestClient.put<ResourceApi.MutationResult>(
    `${PREFIX}/${id}`,
    data,
    {
      responseReturn: 'body',
    },
  );
}

export function deleteResourceApi(id: number) {
  return requestClient.delete<ResourceApi.MutationResult>(`${PREFIX}/${id}`, {
    responseReturn: 'body',
  });
}

export function deleteManyResourcesApi(ids: number[]) {
  return requestClient.post<ResourceApi.MutationResult>(
    `${PREFIX}/delete-many`,
    { ids },
    { responseReturn: 'body' },
  );
}
```

Body thực tế của `delete-many` phải được integration test; `{ ids }` hiện là contract FE đang dùng cho Employee Request nhưng chưa xác nhận với backend.

### API layer boundaries

- Vue component gọi exported service từ `#/api`.
- Service gọi `requestClient`.
- Model nằm trong `#/models`.
- Component không gọi Axios/fetch/RequestClient trực tiếp.
- Component không thêm Authorization/token.
- Service không hiển thị success notification.
- Global interceptor hiển thị backend error; page hiển thị success sau promise resolve.
- Không retry mutation tùy tiện vì có thể tạo dữ liệu trùng.

## Quy tắc đồng bộ DTO backend sang model frontend

Đây là yêu cầu bắt buộc, không phải khuyến nghị.

### Nguyên tắc một contract phải có một model rõ ràng

Khi backend expose một DTO mà FE sử dụng, phải tạo TypeScript contract tương ứng trong `src/models`. Ví dụ backend có:

```text
EmployeeDto
EmployeeCreateDto
EmployeeUpdateDto
EmployeeDetailDto
EmployeeListResultDto
```

FE phải biểu diễn đủ các vai trò đó. Có thể giữ nguyên tên DTO hoặc dùng convention của repository:

```ts
export namespace EmployeeApi {
  // Maps EmployeeDto used in list rows.
  export interface Item {}

  // Maps EmployeeDetailDto.
  export interface Detail {}

  // Maps EmployeeCreateDto.
  export interface CreateInput {}

  // Maps EmployeeUpdateDto.
  export interface UpdateInput {}

  // Maps the backend paginated wrapper.
  export type ListResult = MResult<Item[]>;
  export type DetailResult = MResult<Detail>;
}
```

Tên `Item`, `Detail`, `CreateInput`, `UpdateInput` được phép vì đây là convention hiện tại, nhưng agent phải biết rõ mỗi type map tới DTO BE nào. Không dùng một interface khổng lồ cho tất cả list/detail/create/update nếu backend contract khác nhau.

### Checklist khi đọc contract backend

Với mỗi endpoint, xác định và model hóa:

1. Query/path parameters.
2. Request body DTO.
3. Response data DTO.
4. Response wrapper (`MResult`, pagination, `dataExtend`).
5. Nested/navigation DTO.
6. Enum/code values.
7. Field nullable và optional.
8. Concurrency fields như `concurrencyStamp`, `rowVersion`, `entityVersion`.
9. Audit/read-only fields chỉ có ở response.
10. Collection element type và key type (`number`, GUID `string`, v.v.).

### Nullability và optionality

Không coi `?` và `null` là giống nhau:

```ts
name: string;                    // luôn xuất hiện, không null
surname: null | string;          // luôn có key, có thể null
icon?: string;                   // key có thể không xuất hiện
note?: null | string;            // có thể thiếu hoặc null
```

Phải dựa vào OpenAPI, backend DTO hoặc sample response đã được xác nhận. Không tự biến mọi field thành optional để tránh lỗi TypeScript.

### Transport model và UI model

API DTO và form model có mục đích khác nhau:

```ts
interface EmployeeUpdateInput {
  organizationUnitIds: string[];
  roleNames: string[];
}

interface EmployeeFormModel {
  organizationUnits: string[];
  roles: string[];
}
```

Nếu tên/shape khác nhau, phải có mapping rõ trong form/page. Không thêm label, selected option object hoặc UI state vào API payload interface.

Date/time từ JSON nên giữ `string` trong transport model. Chỉ parse sang `Date`, timestamp hoặc dayjs object tại UI boundary nếu component cần.

### Nested DTO và navigation

Nếu backend trả:

```ts
employeeRequestType?: EmployeeRequestTypeDto | null;
```

FE phải reuse `EmployeeRequestTypeApi.Item` hoặc tạo nested interface đúng contract. Không dùng:

```ts
employeeRequestType?: any;
```

Component vẫn phải chịu được navigation `null` và resolve fallback bằng ID/options khi có thể.

### Create và update payload

Create/update phải chỉ chứa field backend cho phép. Không gửi các field response-only như:

```text
isDeleted
creationTime
creatorId
lastModificationTime
tenantId
```

trừ khi backend DTO create/update thực sự yêu cầu.

Update phải giữ các field concurrency nếu backend yêu cầu. Ví dụ form Identity User không hiển thị `concurrencyStamp`, nhưng vẫn lưu trong state và gửi lại khi PUT.

### Enum và code

Model/payload gửi code backend, không gửi label UI:

```ts
unit: 'Day' | 'Hour';
```

UI có thể hiển thị `Ngày`/`Giờ`, nhưng payload vẫn phải là `Day`/`Hour`.

### Không biết contract thì làm gì

Ưu tiên theo thứ tự:

1. Đọc OpenAPI/Swagger.
2. Đọc backend DTO/source nếu repository cho phép.
3. Đọc sample request/response đã được người dùng cung cấp.
4. Kiểm tra module FE tương tự đã integration.
5. Nếu vẫn thiếu thông tin quan trọng, hỏi người dùng.

Không tự đoán field rồi tuyên bố contract đã hoàn thiện.

### Review checklist trước khi hoàn thành

- Mọi endpoint mới đều dùng typed params/body/result.
- Không có DTO khai báo ad-hoc trong Vue component.
- Không dùng `any` hoặc `Record<string, any>` để né contract mới.
- List/detail/create/update được tách khi shape khác nhau.
- Nullability đúng với backend.
- Không gửi field read-only.
- Concurrency fields không bị làm mất.
- Nested DTO được typed.
- Enum/code gửi đúng giá trị backend.
- Barrel exports đã cập nhật.

## Kiến trúc CRUD và module mẫu

Mẫu cũ ổn định:

```text
views/hr/contract-types/
views/hr/workshifts/
views/hr/holidays/
```

Mẫu mới Employee Request:

```text
views/employee-requests/
├── request-center/
│   └── index.vue
├── shared/
│   ├── EmployeeRequestPolicyUnitSelect.vue
│   ├── EmployeeRequestReasonSelect.vue
│   ├── EmployeeRequestTypeSelect.vue
│   └── PaidStatusBadge.vue
├── employee-request-types/
│   ├── index.vue
│   └── EmployeeRequestTypeForm.vue
├── employee-request-reasons/
│   ├── index.vue
│   └── EmployeeRequestReasonForm.vue
└── employee-request-policies/
    ├── index.vue
    └── EmployeeRequestPolicyForm.vue
```

Page pattern:

```ts
const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });
const [Drawer, drawerApi] = useVbenDrawer({ connectedComponent: Form });
```

Grid query pattern:

```ts
query: async ({ page }, formValues) => {
  const response = await getListApi({
    current: page.currentPage,
    pageSize: page.pageSize,
  });

  return {
    items: response.data ?? [],
    total: response.total ?? 0,
  };
};
```

Mutation pattern:

```ts
drawerApi.setState({ confirmLoading: true });
try {
  await mutationApi(...);
  message.success('... thành công');
  drawerApi.close();
  await gridApi.query();
} finally {
  drawerApi.setState({ confirmLoading: false });
}
```

Delete pattern:

- `NPopconfirm`.
- Confirmation có tên record.
- `deletingId` để khóa thao tác và hiển thị loading.
- Chỉ reload sau API success.
- Backend error do request interceptor hiển thị.

## Employee Request: API và models

API services:

```text
src/api/employee-requests/employee-request-type.ts
src/api/employee-requests/employee-request-reason.ts
src/api/employee-requests/employee-request-policy.ts
```

Models:

```text
src/models/employee-requests/employee-request-type/
src/models/employee-requests/employee-request-reason/
src/models/employee-requests/employee-request-policy/
```

Barrel exports của module:

```text
src/api/employee-requests/index.ts
src/models/employee-requests/index.ts
```

API module tiếp tục được export từ:

```text
src/api/index.ts
```

Không export Employee Request qua barrel `hr/index.ts` vì hai module đã được tách riêng.

### Type API

Prefix:

```text
/api/hrms/employee-request-type
```

Methods:

```text
GET    /
GET    /{id}
POST   /
PUT    /{id}
DELETE /{id}
POST   /delete-many
```

Contract chính:

```ts
interface Item {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  displayOrder: number;
  tenantId?: string | null;
  isDeleted: boolean;
}
```

UI:

- Filter keyword.
- Sort current page theo `displayOrder`, sau đó `id`.
- Không render `isDeleted`.
- Icon preview bằng `IconifyIcon`.
- Default displayOrder lấy max trên page hiện tại + 1.
- Form trim string; optional empty string gửi `null`.

### Reason API

Prefix:

```text
/api/hrms/employee-request-reason
```

Reason không có field `paid`. Không thêm `paid` vào model/form/payload.

UI:

- Filter keyword/type/isActive.
- API query vẫn truyền `employeeRequestTypeId` và `isActive`.
- Có client fallback filter trên page được tải nếu backend chưa hỗ trợ.
- Type name resolve bằng navigation object trước, sau đó `Map` từ danh sách Type.
- Không hiển thị raw ID nếu có thể resolve tên.

### Policy API

Prefix:

```text
/api/hrms/employee-request-policy
```

Policy fields:

```ts
employeeRequestTypeId: number;
employeeRequestReasonId: number;
paid: boolean;
maxTime: number;
unit?: string | null;
```

UI:

- Type và Reason được preload một lần, rồi tạo `Map` lookup O(1).
- Không gọi API theo từng row.
- Reason select disabled khi chưa có Type.
- Reason select lọc theo Type và active reason.
- Khi đổi Type, reason không hợp lệ được clear.
- `maxTime` hỗ trợ decimal và phải > 0.
- Unit chuẩn là `Day`/`Hour`, label là Ngày/Giờ.
- Nếu backend có legacy unit, select thêm option runtime để không làm mất dữ liệu.
- Duplicate Type + Reason chỉ cảnh báo FE, không thay backend unique constraint.

## Shared select design

Các select không tự fetch dữ liệu. Parent page tải options và truyền qua props. Lý do:

- Tránh API request lặp khi mở form.
- Tránh N+1.
- Dễ tạo `Map` dùng chung cho grid và form.

Nếu cần remote/paginated select trong tương lai, nên tạo composable/cache layer theo convention mới, không nhét fetch lặp vào từng row/component.

Hiện option list tải với `pageSize: 100`. Đây là giới hạn đã biết, không phải giải pháp vô hạn.

## Routing/menu hiện tại

File:

```text
src/router/routes/modules/hr.ts
```

Employee Request không nằm trong menu Nhân sự. Đây là module top-level riêng, ngang cấp với Nhân sự:

```text
Nhân sự                       /hr
└── ...

Đơn từ                        /employee-requests
├── Danh sách đơn từ          /employee-requests/requests
└── Cấu hình đơn từ           /employee-requests/configuration
    ├── Loại đơn              /employee-requests/types
    ├── Lý do                 /employee-requests/reasons
    └── Chính sách            /employee-requests/policies
```

Route module:

```text
src/router/routes/modules/employee-request.ts
```

Top-level menu dùng `order: 15`, hiện nằm giữa Nhân sự (`order: 10`) và Identity (`order: 20`). `hr.ts` không còn chứa route Đơn từ.

Locale của menu dùng namespace:

```text
page.employeeRequest.title
page.employeeRequest.requests
page.employeeRequest.configuration
page.employeeRequest.types
page.employeeRequest.reasons
page.employeeRequest.policies
```

Source FE của Employee Request đã được tách hoàn toàn ngang cấp với HR:

```text
src/views/employee-requests/
  request-center/
  shared/
  employee-request-types/
  employee-request-reasons/
  employee-request-policies/
src/api/employee-requests/
src/models/employee-requests/
```

Backend vẫn dùng `/api/hrms/employee-request-*`. Không đổi backend prefix khi refactor thư mục FE.

Locale keys nằm trong `page.hr` của ba file locale Việt/Anh/Trung.

Permission constants:

```text
src/constants/employee-request.ts
```

```ts
manageTypes: 'EmployeeRequests.ManageTypes';
manageReasons: 'EmployeeRequests.ManageReasons';
managePolicies: 'EmployeeRequests.ManagePolicies';
```

### Trạng thái permission tạm thời

Trong `employee-request.ts`, `authority` của ba route cấu hình đang comment. Parent top-level cũng chưa gắn `authority`. Đây là trạng thái chủ ý để menu không bị mất khi backend chưa trả permission.

Trong view:

- `/employee-requests/types`: action không check permission.
- `/employee-requests/reasons`: action không check permission.
- `/employee-requests/policies`: hiện vẫn dùng permission guard `ManagePolicies`.

Không tự chuẩn hóa ba màn hình thành cùng một trạng thái nếu chưa có yêu cầu. Agent tiếp theo phải đọc code thực tế trước khi sửa.

## Trang `/employee-requests/requests`

Trang đơn từ riêng nằm tại:

```text
src/views/employee-requests/request-center/index.vue
```

Hiện là UI mock theo yêu cầu trước:

- Tab Đơn của tôi.
- Tab Đơn cần phê duyệt.
- Filter loại đơn, trạng thái, từ ngày/đến ngày.
- Nút tạo mới chưa nối API.

Không triển khai create/approve request trong task cấu hình nếu người dùng không yêu cầu.

## Identity user edit đã có

Các file:

```text
src/api/identity/index.ts
src/views/identity/users/index.vue
src/views/identity/users/UserForm.vue
```

Edit flow:

```text
GET /api/identity/users/detail/{id}
PUT /api/identity/users/update/{id}
```

Mapping quan trọng:

- `roles` response -> form roles -> payload `roleNames`.
- `organizationUnitIds` response -> form organization units -> payload IDs.
- `concurrencyStamp` không hiển thị nhưng phải giữ và gửi khi update.

Không làm mất `concurrencyStamp` khi refactor form user.

## Chrome 109 / Windows Server 2008

Target thực tế có Chrome 109. Lỗi đã từng gặp:

```text
e.toSorted is not a function
```

Không sử dụng `Array.prototype.toSorted()`. Dùng copy + mutable sort:

```ts
const sorted = [...items].sort(compareFn);
```

Rule `unicorn/no-array-sort` đã tắt trong ESLint/Oxlint để cho phép cách tương thích này.

Khi thêm API JavaScript mới như `findLast`, `toReversed`, `with`, `Object.groupBy`, v.v., kiểm tra compatibility Chrome 109 hoặc dùng cách tương thích.

## Iconify/CDN context

Ứng dụng dùng Iconify và có thể gọi `https://api.iconify.design/...` khi icon chưa có local data.

`carbon:workspace` đã được register local trong `src/main.ts` để tránh request CDN cụ thể đó.

Các collection/icon khác có thể vẫn gọi CDN. Nếu người dùng yêu cầu loại bỏ toàn bộ:

1. Audit icon names đang dùng.
2. Tạo local registry tập trung.
3. Chỉ bundle icon cần thiết.
4. Không import toàn collection nếu không cần.
5. Đo/kiểm tra bundle sau thay đổi.

## Validation baseline hiện tại

Lần gần nhất:

```bash
pnpm -F @vben/web-naive run build
```

đã pass, transform 8268 modules và tạo `apps/web-naive/dist.zip`.

Lệnh:

```bash
pnpm -F @vben/web-naive run typecheck
```

fail do 7 lỗi tồn tại sẵn ngoài Employee Request, tại:

```text
src/components/OrganizationTable.vue
src/layouts/basic.vue
src/views/_core/profile/base-setting.vue
src/views/identity/organizations/index.vue
src/views/sms/admin-notifications/index.vue
src/views/sms/messages/index.vue
```

Không kết luận module mới lỗi chỉ vì full type-check fail. Đọc output và đối chiếu path.

Diagnostics từng Employee Request component đã pass sau ESLint fix.

## Blocker chưa xác nhận

Không khẳng định API đã chạy vì chưa có integration test backend. Các điểm phải xác nhận khi nối backend:

1. EmployeeRequestType có expose đủ CRUD hay chưa.
2. Body chính xác của `/delete-many` có phải `{ ids }` hay raw array.
3. Backend có xử lý `employeeRequestTypeId`, `employeeRequestReasonId`, `isActive` trong list query hay không.
4. Permission codes đã được backend đăng ký/cấp hay chưa.
5. Unique constraint Policy Type + Reason và message trả về.
6. Backend có trả navigation `employeeRequestType` trong Reason hay không.
7. Tổng số Type/Reason có vượt giới hạn options `pageSize: 100` hay không.

## Workflow đề xuất cho task tiếp theo

1. Chạy `git --no-optional-locks status --short` để hiểu working tree.
2. Đọc `AGENTS.md` và file feature liên quan.
3. Tìm module tương tự bằng grep/find, không đoán path.
4. Đọc model -> API -> page -> form -> route trước khi sửa.
5. Thực hiện thay đổi tối thiểu, đúng scope.
6. Chạy ESLint fix theo path Vue/TS đã sửa.
7. Chạy diagnostics đúng file.
8. Chạy type-check/build nếu thay đổi ảnh hưởng compile/runtime.
9. Báo rõ lệnh nào pass/fail và lỗi nào tồn tại sẵn.

## Những điều không nên làm

- Không thay Vben grid bằng table framework khác.
- Không thay connected drawer bằng thư viện modal mới.
- Không thêm React Query/TanStack Query chỉ cho module này; app hiện không dùng nó cho HR CRUD.
- Không gọi `fetch`/Axios trực tiếp trong component.
- Không hardcode token/tenant/base URL.
- Không tạo N+1 request để resolve Type/Reason.
- Không đưa `paid` vào EmployeeRequestReason.
- Không gửi label `Ngày`/`Giờ` vào `unit`; gửi `Day`/`Hour`.
- Không giả success khi backend trả lỗi.
- Không sửa backend trong repository/task FE.
- Không format toàn repo hoặc revert file không thuộc task.

## Yêu cầu báo cáo cuối task

Khi hoàn thành một task đáng kể, trả về:

- File tạo mới.
- File sửa.
- Route/menu/API/model/component thay đổi.
- Permission nào được dùng hoặc đang tạm bỏ.
- Validation đã chạy và kết quả từng lệnh.
- Blocker backend hoặc assumption chưa kiểm chứng.

Không nói “đã hoạt động” nếu chỉ build thành công mà chưa test với API thật.
