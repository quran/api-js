export const removeBeginningSlash = (url: string) => {
  return url.startsWith('/') ? url.slice(1) : url;
};

export function mergeApiOptions<T>(defaults: T, overrides?: Partial<T>): T {
  return Object.assign({}, defaults, overrides);
}
