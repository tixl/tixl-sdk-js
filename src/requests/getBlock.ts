import axios from 'axios';
import buildQueryString from 'build-query-string';
import { Block, fromBlockObject, Signature } from '@tixl/tixl-types';

export const getBlock = (signature: Signature, txh = ''): Promise<Block | undefined> =>
  axios
    .get(process.env.REACT_APP_GATEWAY + '/block?' + buildQueryString({ signature, txh }))
    .then((res) => {
      if (!res.data || !res.data.block) return;

      return fromBlockObject(res.data.block);
    })
    .catch((err) => {
      if (!err.response) {
        console.error('gateway is unresponsive');
      } else if (err.response.status !== 404) {
        console.log('err', err);
      }

      return undefined;
    });
