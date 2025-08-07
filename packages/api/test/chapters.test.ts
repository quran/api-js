import { createApiTest } from './utils';

createApiTest('chapters', {
  findAll: {},
  findById: {
    params: ['1'],
    rejectParams: ['0' as any],
  },
  findInfoById: {
    params: ['1'],
    rejectParams: ['0' as any],
  },
});
