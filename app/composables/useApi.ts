export function useApi() {
  const config = useRuntimeConfig();
  const baseURL = import.meta.server
    ? config.apiBaseUrl
    : config.public.apiBaseUrl;

  return {
    baseURL,
    fetch: (path: string, opts?: Parameters<typeof $fetch>[1]) =>
      $fetch(path, { baseURL, ...opts }),
  };
}
