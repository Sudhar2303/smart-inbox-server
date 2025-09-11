export const setResponseBody = <T>(
  message: string,
  error: string | null,
  data: T | null = null
) => {
  return {
    message,
    error,
    data,
  };
};
