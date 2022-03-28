import { quran } from '../src/index';

type ApiName = keyof typeof quran['v4'];
type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any
  ? A
  : never;

type ApiFunctionParams<
  T extends ApiName,
  Func extends keyof typeof quran['v4'][T]
> = ArgumentTypes<
  // @ts-ignore
  typeof quran['v4'][T][Func]
>;

// type ApiFunctionReturn<
//   T extends ApiName,
//   Func extends keyof typeof quran['v4'][T]
// > = ReturnType<
//   // @ts-ignore
//   typeof quran['v4'][T][Func]
// >;

type Params<T extends ApiName> = {
  [FunctionName in keyof typeof quran['v4'][T]]:
    | ApiFunctionParams<T, FunctionName>
    | {
        expect?: { array?: boolean };
        params?: ApiFunctionParams<T, FunctionName> | boolean;
        rejectParams?: ApiFunctionParams<T, FunctionName>;
        cases?:
          | ApiFunctionParams<T, FunctionName>[]
          | Record<string, ApiFunctionParams<T, FunctionName>>;
        customCases?: (method: typeof quran['v4'][T][FunctionName]) => void;
      };
};

const isObject = (obj: any) =>
  obj && typeof obj === 'object' && !Array.isArray(obj);

export const createApiTest = <T extends ApiName>(
  key: T,
  params: Params<T> = {} as any
) => {
  const title = key[0].toUpperCase() + key.slice(1);
  const api = quran.v4[key];

  return describe(`${title} API`, () => {
    Object.keys(api).forEach((functionKey) => {
      const method = (api as any)[functionKey as ApiName] as Function;
      const options = (params as any)[functionKey] || {};

      let args: any[] | undefined = [];
      if (Array.isArray(options)) args = options;
      else if (Array.isArray(options.params)) args = options.params;
      else if (options.params === false) args = undefined;

      const rejectArgs = options.rejectParams || [];
      const cases = options.cases || [];
      const expectOptions = options.expect || {};
      const customCases = options.customCases || null;

      const expectArray =
        (functionKey.includes('All') && expectOptions.array !== false) ||
        expectOptions.array === true;

      describe(`${functionKey}()`, () => {
        if (args !== undefined) {
          it(`should return response`, async () => {
            const response = await method(...(args as any[]));
            if (expectArray) expect(response).toBeInstanceOf(Array);
            expect(response).toBeDefined();
          });
        }

        if (rejectArgs.length) {
          it(`should throw with invalid params`, async () => {
            await expect(method(...rejectArgs)).rejects.toThrowError();
          });
        }

        if (cases) {
          if (Array.isArray(cases) && cases.length)
            cases.forEach((caseArgs, idx) => {
              it(`case ${idx}`, async () => {
                const response = await method(...caseArgs);
                if (expectArray) expect(response).toBeInstanceOf(Array);
                expect(response).toBeDefined();
              });
            });

          if (isObject(cases)) {
            Object.keys(cases).forEach((caseKey) => {
              it(caseKey, async () => {
                const response = await method(...cases[caseKey]);
                if (expectArray) expect(response).toBeInstanceOf(Array);
                expect(response).toBeDefined();
              });
            });
          }
        }

        if (customCases) {
          describe('Custom Cases', () => {
            customCases(method);
          });
        }
      });
    });
  });
};
