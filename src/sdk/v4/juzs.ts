import { Juz } from '@/types';
import { fetcher } from './_fetcher';

const Juzs = {
  async findAll() {
    const { juzs } = await fetcher<{ juzs: Juz[] }>('/juzs');
    return juzs;
  },
};

export default Juzs;
