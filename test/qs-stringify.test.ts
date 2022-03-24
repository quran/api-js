import stringify from '@/utils/qs-stringify';

describe('Stringify Utils', () => {
  describe('stringify', () => {
    it('should return query string', () => {
      const obj = { a: 1, b: 2 };
      expect(stringify(obj)).toEqual('a=1&b=2');
    });

    it('should join array values with commas', () => {
      const obj = { a: [1, 2, 3], b: 2 };
      const separator = encodeURIComponent(',');
      expect(stringify(obj)).toEqual(`a=${obj.a.join(separator)}&b=2`);
    });
  });
});
