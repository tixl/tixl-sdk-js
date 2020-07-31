import axios from 'axios';
import { Block } from '@tixl/tixl-types';

export const getUnspent = async (
  fromTimestamp: number,
  toTimestamp: number,
): Promise<{ blocks: Block[]; earliest: number | null; latest: number | null }> =>
  axios
    .get(process.env.REACT_APP_GATEWAY + `/unspent?fromTimestamp=${fromTimestamp}&toTimestamp=${toTimestamp}`)
    .then(res => res.data);
