import type { MResult } from '#/models/common';

type Id = number | string;
type NullableString = null | string;

export interface TodoDto {
  assigneeCode?: NullableString;
  assigneeName?: NullableString;
  assigneeUserName?: NullableString;
  code?: NullableString;
  completionDate?: NullableString;
  creationTime?: NullableString;
  creatorName?: NullableString;
  description?: NullableString;
  dueDate?: NullableString;
  employeeCode?: NullableString;
  employeeId?: null | number;
  employeeName?: NullableString;
  id: Id;
  name?: NullableString;
  priority?: NullableString;
  progress?: NullableString;
  source?: NullableString;
  status?: NullableString;
  taskId?: null | number;
  tenantId?: NullableString;
  userId?: NullableString;
  userName?: NullableString;
}

export type TodoListResult = MResult<TodoDto[]>;
