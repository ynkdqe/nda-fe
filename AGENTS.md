# AGENTS.md

## Phạm vi

Tài liệu này áp dụng cho toàn bộ repository. Đây là monorepo Vben Admin dùng `pnpm` và Turbo. Ứng dụng đang được phát triển chính là:

```text
apps/web-naive
```

Mọi coding agent phải đọc file này trước khi sửa code. Nếu một thư mục con có `AGENTS.md` riêng trong tương lai, file gần code nhất được ưu tiên cho phần scope tương ứng.

## Nguyên tắc bắt buộc

1. Không tự ý thay đổi kiến trúc, UI framework, API abstraction hoặc state management hiện có.
2. Không sửa module không liên quan chỉ để làm sạch lint/type-check toàn dự án.
3. Không ghi đè, revert hoặc format hàng loạt các thay đổi đang có của người dùng.
4. Trước khi sửa một module, đọc ít nhất một module tương tự đang hoạt động.
5. Dùng component, adapter, hook và convention có sẵn trước khi tạo abstraction mới.
6. Không thêm dependency nếu Vue, Naive UI, Vben hoặc utility hiện tại đã đáp ứng.
7. Không hardcode base URL, access token, tenant hoặc role.
8. Không gọi HTTP trực tiếp trong Vue component khi đã có `requestClient` và service layer.
9. Không dùng mock data trong production flow trừ khi người dùng yêu cầu rõ ràng.
10. Không tuyên bố API hoạt động nếu chưa chạy integration test với backend.
11. Không commit, tạo branch hoặc sửa lịch sử Git nếu người dùng chưa yêu cầu.
12. Không dùng `Array.prototype.toSorted()` vì ứng dụng phải tương thích Chrome 109 trên Windows Server 2008. Dùng `[...items].sort(...)`.

## Công nghệ và cấu trúc

- Vue 3, TypeScript, `<script setup>`.
- Naive UI là UI framework của `apps/web-naive`.
- Vben Admin cung cấp layout, drawer, modal, form và grid adapters.
- Pinia/Vben stores được dùng cho auth và application state.
- `pnpm` workspace và Turbo quản lý monorepo.
- Alias trong app: `#/*` trỏ tới `apps/web-naive/src/*`.

Các thư mục quan trọng:

```text
apps/web-naive/src/api/          API service modules
apps/web-naive/src/models/       DTO, payload, response types
apps/web-naive/src/views/        Vue pages và form components
apps/web-naive/src/router/       Route/menu definitions
apps/web-naive/src/locales/      Locale resources
apps/web-naive/src/constants/    Business constants và permission codes
apps/web-naive/src/adapter/      Vben adapters cho form/table/Naive UI
apps/web-naive/src/store/        App stores
```

## API, base request và response

### Base URL

Client được tạo tại:

```text
apps/web-naive/src/api/request.ts
```

Base URL được lấy từ cấu hình ứng dụng:

```ts
const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);
```

Service chỉ khai báo path tương đối như `/api/hrms/...`; không hardcode protocol, domain hoặc port.

### `requestClient` và `baseRequestClient`

Client mặc định cho API nghiệp vụ:

```ts
import { requestClient } from '#/api/request';
```

`requestClient` được tạo bằng `createRequestClient(apiURL, { responseReturn: 'data' })` và có đầy đủ interceptor:

- Lấy access token từ `useAccessStore` hoặc persisted token info.
- Chủ động refresh token khi token sắp hết hạn.
- Dùng một `refreshTokenPromise` chung để tránh refresh đồng thời.
- Thêm `Authorization: Bearer <token>` cho request thường.
- Không thêm Authorization cho `/connect/token`.
- Thêm `Accept-Language` theo locale hiện tại.
- Xử lý HTTP 2xx nhưng body có `success: false` như một lỗi.
- Xử lý 401/refresh/logout qua authenticate interceptor.
- Hiển thị lỗi cuối cùng bằng Naive UI `message.error`.

Client tối giản:

```ts
import { baseRequestClient } from '#/api/request';
```

`baseRequestClient` chỉ được tạo bằng:

```ts
new RequestClient({ baseURL: apiURL });
```

Nó không có chuỗi interceptor nghiệp vụ của `requestClient`. Hiện client này được dùng cho trường hợp đặc biệt như:

```ts
baseRequestClient.post('/auth/logout', { withCredentials: true });
```

Không dùng `baseRequestClient` cho CRUD nghiệp vụ mới nếu không có lý do rõ ràng. Mặc định luôn dùng `requestClient`.

### Header và tenant

Không tự thêm Authorization trong từng service. Login `/connect/token` là ngoại lệ có `Content-Type: application/x-www-form-urlencoded` và có thể thêm `x-tenant-id` từ tenant người dùng nhập.

Không hardcode tenant. Nếu API nghiệp vụ cần tenant header, trước tiên kiểm tra interceptor/token storage hiện có và triển khai ở tầng chung theo convention, không lặp trong từng service.

### `responseReturn`

Default của `requestClient` là:

```ts
responseReturn: 'data';
```

Hiểu theo convention của `@vben/request`:

- `'data'`: trả phần data đã được response interceptor trích xuất; phù hợp endpoint chỉ cần payload.
- `'body'`: trả toàn bộ response body JSON; bắt buộc khi cần `success`, `message`, `current`, `pageSize`, `total`, `dataExtend` hoặc `error`.
- `'raw'`: trả response HTTP thô; chỉ dùng khi thực sự cần header/status/blob và phải kiểm tra API của `RequestClient` trước.

CRUD HR dùng wrapper `MResult`, vì vậy list/detail/mutation thường đặt:

```ts
requestClient.get<Result>(url, {
  params,
  responseReturn: 'body',
});
```

### Base response `MResult`

Định nghĩa thật nằm tại:

```text
apps/web-naive/src/models/common/response.ts
```

```ts
interface MValidationError {
  members?: null | string[];
  message?: null | string;
}

interface MError<TData = unknown> {
  code?: null | string;
  data?: null | TData;
  details?: null | string;
  message?: null | string;
  validationErrors?: null | MValidationError[];
}

interface MResult<TData, TDataExtend = unknown, TErrorData = unknown> {
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

List response dùng `MResult<Item[]>`; detail dùng `MResult<Item>`; mutation có thể dùng `MResult<unknown>` nếu backend không có payload ổn định.

### Business error và notification

`requestClient` kiểm tra `response.data.success`. Nếu giá trị là `false`, client throw error dù HTTP status là 2xx. Message được ưu tiên theo thứ tự:

1. Các `error.validationErrors[].message` duy nhất.
2. `error.details`.
3. `error.message`.
4. `result.message`.
5. Fallback message.

Do interceptor đã hiển thị lỗi backend, component không được catch rồi hiển thị success. Chỉ gọi `message.success` sau khi promise API resolve thành công. Dùng `try/finally` để reset loading; chỉ dùng `catch` khi cần xử lý UX bổ sung và không nuốt lỗi.

### Mẫu service CRUD

```ts
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
```

Service naming dùng hậu tố `Api`. Export service qua barrel của đúng module, ví dụ `src/api/hr/index.ts` cho HR hoặc `src/api/employee-requests/index.ts` cho Employee Request; sau đó export module từ `src/api/index.ts` và import ở component qua `#/api`.

## Model và DTO

Đặt model theo đúng module/resource, ví dụ:

```text
apps/web-naive/src/models/hr/<resource>/
apps/web-naive/src/models/employee-requests/<resource>/
```

### Bắt buộc ánh xạ DTO từ backend

Mỗi DTO/request/response contract được backend expose và FE sử dụng phải có TypeScript model tương ứng trong `src/models`. Không khai báo tạm DTO trực tiếp trong Vue component hoặc dùng `Record<string, any>` để bỏ qua contract.

Ví dụ backend có:

```text
EmployeeDto
EmployeeCreateDto
EmployeeUpdateDto
EmployeeDetailDto
EmployeeListResultDto
```

FE phải có các model tương ứng về vai trò, ví dụ:

```ts
export namespace EmployeeApi {
  export interface EmployeeDto {}
  export interface EmployeeCreateDto {}
  export interface EmployeeUpdateDto {}
  export interface EmployeeDetailDto {}
  export type EmployeeListResultDto = MResult<EmployeeDto[]>;
}
```

Có thể dùng tên convention ngắn hơn như `Item`, `CreateInput`, `UpdateInput`, `DetailResult` nếu module hiện tại đã dùng convention đó, nhưng phải bảo đảm quan hệ ánh xạ rõ ràng một-một với DTO BE và không làm mất field/ý nghĩa contract.

Quy tắc ánh xạ bắt buộc:

- Giữ đúng tên field JSON mà API gửi/nhận; không tự đổi tên nếu không có adapter mapping rõ ràng.
- Giữ đúng kiểu dữ liệu: `string`, `number`, `boolean`, array, object, enum/code.
- Phản ánh đúng nullability: field BE nullable dùng `null`; field có thể không xuất hiện mới dùng optional `?`; nếu vừa có thể thiếu vừa null thì khai báo cả hai.
- Tách riêng list item, detail DTO, create payload và update payload khi BE định nghĩa khác nhau.
- Nếu update cần `id`, `concurrencyStamp`, `rowVersion` hoặc field chống concurrent update, model FE phải giữ và gửi lại đúng contract.
- Navigation object/nested DTO phải có interface riêng hoặc reuse model tương ứng; không dùng `any`.
- Enum/code từ BE phải có union/enum/constants tương ứng; không gửi label hiển thị thay cho code.
- Date/time từ JSON thường biểu diễn bằng `string` trong transport model; chỉ chuyển sang `Date` ở UI adapter khi thực sự cần.
- Không tự thêm field UI-only vào API DTO. Form state riêng phải có `FormModel` riêng.
- Không gửi field read-only/audit như `isDeleted`, `creationTime`, `creatorId` nếu create/update contract không có.
- Khi chưa biết chính xác contract, phải kiểm tra OpenAPI/backend DTO/sample response hoặc hỏi lại; không tự đoán rồi coi là đúng.

Dùng namespace theo convention:

```ts
export namespace EmployeeRequestTypeApi {
  export interface Item {}
  export interface ListParams {}
  export interface CreateInput {}
  export interface UpdateInput extends CreateInput {}
  export type ListResult = MResult<Item[]>;
}
```

Quy tắc payload:

- API service phải nhận/trả model từ `src/models`; không khai báo payload ad-hoc trong component.
- Khai báo type rõ ràng; tránh `Record<string, any>` cho service mới.
- Không gửi `isDeleted` từ form create/update.
- Không cho người dùng sửa `id`.
- Trim text trước khi gửi.
- Chuyển chuỗi tùy chọn rỗng thành `null` nếu contract cho phép.
- Không giả định navigation object luôn có trong response.

## CRUD page convention

Mẫu chuẩn để tham khảo:

```text
apps/web-naive/src/views/hr/contract-types/index.vue
apps/web-naive/src/views/hr/contract-types/ContractTypeForm.vue
apps/web-naive/src/views/hr/workshifts/index.vue
apps/web-naive/src/views/hr/workshifts/WorkShiftForm.vue
apps/web-naive/src/views/employee-requests/employee-request-types/
apps/web-naive/src/views/employee-requests/employee-request-reasons/
apps/web-naive/src/views/employee-requests/employee-request-policies/
```

List page:

- Dùng `Page`.
- Dùng `useVbenVxeGrid` với `VbenFormProps` và `VxeGridProps`.
- Server pagination nằm trong `proxyConfig.ajax.query`.
- Trả `{ items, total }` cho grid proxy.
- Reload sau mutation bằng `await gridApi.query()`.
- Toolbar create dùng `NButton` và `IconifyIcon`.
- Edit gọi detail API trước khi mở drawer nếu endpoint có sẵn.
- Delete dùng `NPopconfirm` và loading theo record để tránh double submit.
- Không xóa record khỏi UI trước khi backend xác nhận thành công.

Form page:

- Dùng connected drawer qua `useVbenDrawer`.
- Dùng `NForm`, `FormInst`, `FormRules`.
- Form một cột trên mobile; dùng grid responsive khi cần.
- `onOpenChange` đọc dữ liệu bằng `drawerApi.getData()` và restore validation.
- Parent page bật loading mutation bằng:

```ts
drawerApi.setState({ confirmLoading: true });
```

và luôn reset trong `finally`.

## Permission

Không kiểm tra role string. Permission route dùng `meta.authority`; action dùng `useAccess().hasAccessByCodes(...)` khi permission được bật.

Permission Employee Request được cô lập tại:

```text
apps/web-naive/src/constants/employee-request.ts
```

```ts
EmployeeRequests.ManageTypes;
EmployeeRequests.ManageReasons;
EmployeeRequests.ManagePolicies;
```

Trạng thái tạm thời hiện tại:

- Action tại `/employee-requests/types` không check permission.
- Action tại `/employee-requests/reasons` không check permission.
- Action tại `/employee-requests/policies` vẫn check `ManagePolicies` trừ khi code sau này thay đổi.
- `meta.authority` của ba route cấu hình hiện đang được comment trong `employee-request.ts`, vì permission backend/môi trường chưa sẵn sàng.
- Menu top-level Employee Request hiện không gắn `authority` để không biến mất ở môi trường chưa có permission.

Không tự bật lại permission nếu người dùng chưa yêu cầu. Khi bật lại, kiểm tra cả route/menu, button, handler và form submit.

## Routing và menu

Route HR nằm tại:

```text
apps/web-naive/src/router/routes/modules/hr.ts
```

Employee Request là menu cấp cao riêng, ngang cấp với Nhân sự, và nằm tại:

```text
apps/web-naive/src/router/routes/modules/employee-request.ts
```

Không đưa route Employee Request trở lại `hr.ts` nếu người dùng chưa yêu cầu. Route hiện tại:

```text
/employee-requests
  /employee-requests/requests
  /employee-requests/configuration
    /employee-requests/types
    /employee-requests/reasons
    /employee-requests/policies
```

Source Employee Request được tách thành module ngang cấp với HR:

```text
apps/web-naive/src/views/employee-requests/
  request-center/
  shared/
  employee-request-types/
  employee-request-reasons/
  employee-request-policies/
apps/web-naive/src/api/employee-requests/
apps/web-naive/src/models/employee-requests/
```

Backend vẫn dùng prefix `/api/hrms/...`; không chuyển API path backend chỉ vì đã tách cấu trúc source FE.

Tên menu phải lấy từ locale. HR dùng `$t('page.hr....')`; Employee Request dùng `$t('page.employeeRequest....')`. Khi thêm key, cập nhật đồng thời:

```text
vi-VN/page.json
en-US/page.json
zh-CN/page.json
```

Không hardcode title menu trong route nếu module đang dùng locale.

## Module Employee Request hiện tại

### API prefixes

```text
/api/hrms/employee-request-type
/api/hrms/employee-request-reason
/api/hrms/employee-request-policy
```

Mỗi service đã có list/detail/create/update/delete/delete-many.

### Type

- Table: STT, icon, name, description, displayOrder, actions.
- Filter keyword.
- Sort FE theo `displayOrder`, sau đó `id`.
- Form validate name <= 100, description <= 500, icon <= 50, displayOrder là integer >= 0.
- Action permission đang tạm bỏ.

### Reason

- Không có field `paid`.
- Filter keyword/type/isActive.
- Resolve type name từ navigation object hoặc `typeMap`.
- Client filter chỉ áp dụng trên page đã tải nếu backend bỏ qua query.
- Action permission đang tạm bỏ.

### Policy

- `paid` chỉ nằm ở Policy.
- Reason phụ thuộc Type và phải reset nếu không hợp lệ.
- `maxTime` là decimal và phải > 0.
- Unit gửi code `Day`/`Hour`; phải giữ được legacy value khi edit.
- Resolve Type/Reason bằng `Map`, không gọi API trong vòng lặp.
- Cảnh báo duplicate Type + Reason ở FE; backend vẫn enforce unique.

Shared components:

```text
EmployeeRequestTypeSelect.vue
EmployeeRequestReasonSelect.vue
EmployeeRequestPolicyUnitSelect.vue
PaidStatusBadge.vue
```

Các select nhận options từ page để tránh request lặp và N+1.

## Giới hạn/backend blocker đã biết

- Chưa integration test các Employee Request endpoint với backend.
- EmployeeRequestType có thể chưa expose đầy đủ CRUD. Nếu vậy, báo đúng câu:

  `FE EmployeeRequestType đã hoàn thiện theo contract nhưng đang bị block bởi API backend.`

- Shape thực tế của body `delete-many` chưa được xác nhận integration.
- Type/Reason options hiện tải `pageSize: 100`; cần options endpoint hoặc remote select nếu dữ liệu vượt giới hạn.
- Filter Type/Status/Reason được truyền lên API và có client fallback trên page hiện tại; fallback không đại diện toàn bộ database.
- Permission backend Employee Request có thể chưa tồn tại/được cấp.

## Tương thích trình duyệt

Ứng dụng cần chạy trên Chrome 109 do Windows Server 2008. Không dùng API JavaScript mới chưa có trên Chrome 109, đặc biệt:

```ts
array.toSorted();
```

Dùng:

```ts
[...array].sort(compareFn);
```

ESLint/Oxlint đã tắt rule ép dùng immutable sort tại:

```text
eslint.config.mjs
oxlint.config.ts
```

Khi dùng API web/JS mới, kiểm tra Chrome 109 trước.

## Icon

Dự án dùng `IconifyIcon`. Một số icon có thể gọi `api.iconify.design` nếu chưa bundle local. `carbon:workspace` đã được đăng ký local trong `apps/web-naive/src/main.ts`.

Không import cả collection lớn chỉ để dùng một icon. Nếu cần loại bỏ CDN request, đăng ký đúng icon cần dùng trong registry local hoặc dùng icon package đã bundle, sau khi kiểm tra bundle size.

## Formatting và lint

Không chạy formatter toàn repository một cách tùy tiện vì working tree có nhiều thay đổi ngoài task.

Ưu tiên theo phạm vi:

```bash
pnpm exec eslint <paths...> --fix
pnpm exec oxfmt <paths...>
```

Lưu ý: `oxfmt` không phải lúc nào cũng sửa đầy đủ rule xuống dòng Vue template; chạy ESLint `--fix` trên Vue files sau cùng.

Không dùng Prettier: binary `prettier` không được cài trực tiếp trong workspace.

## Validation

Bắt đầu bằng diagnostics/lint đúng file đã sửa, sau đó:

```bash
pnpm -F @vben/web-naive run typecheck
pnpm -F @vben/web-naive run build
```

Build gần nhất đã pass. Type-check toàn app hiện có lỗi tồn tại sẵn ngoài Employee Request tại:

```text
src/components/OrganizationTable.vue
src/layouts/basic.vue
src/views/_core/profile/base-setting.vue
src/views/identity/organizations/index.vue
src/views/sms/admin-notifications/index.vue
src/views/sms/messages/index.vue
```

Không sửa các lỗi trên trừ khi task yêu cầu. Khi báo cáo, phân biệt lỗi mới với lỗi tồn tại sẵn.

Unit tests toàn repo:

```bash
pnpm test:unit
```

Chỉ chạy khi phù hợp với scope và có đủ thời gian; không tuyên bố test pass nếu chưa chạy.

## Git safety

Working tree có thể chứa nhiều thay đổi của người dùng. Trước và sau task, kiểm tra:

```bash
git --no-optional-locks status --short
```

Không dùng `git checkout`, `git restore`, `git reset`, `git clean` hoặc mass-format để hoàn nguyên file mà chưa xác nhận thay đổi thuộc về ai.

## Cách báo cáo khi hoàn thành

Báo cáo ngắn gọn nhưng phải có:

1. File tạo mới.
2. File đã sửa.
3. Hành vi thay đổi.
4. API/permission/route liên quan.
5. Lệnh validation đã chạy và kết quả thật.
6. Blocker hoặc giả định chưa kiểm chứng.
