import { describe, expect, it } from 'vitest';
import fetch from 'cross-fetch';
import { quran } from '../src';

describe('Custom fetcher', () => {
  it('should fail with no fetch', () => {
    // @ts-expect-error - we are testing this
    globalThis.fetch = undefined;

    expect(() => quran.v4.chapters.findAll()).rejects.toThrowError(
      /global fetch/
    );
  });

  it('should not fail if you pass a fetchFn', () => {
    // @ts-expect-error - we are testing this
    globalThis.fetch = undefined;

    expect(
      quran.v4.chapters.findById('1', {
        fetchFn: (url) => {
          return fetch(url).then((res) => res.json());
        },
      })
    ).resolves.not.toThrow();
  });
});
