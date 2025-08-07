import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(
  ...handlers,
  rest.get('*', (_req, res, ctx) => {
    return res(ctx.status(404), ctx.json({ status: 404, error: 'Not found' }));
  })
);
