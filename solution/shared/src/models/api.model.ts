export type ResponseDto<T> = {
  data: T;
  totalRecords: number;
  totalPages: number;
};
