import axios from 'axios';

import { getGatewayUrl } from '../helpers/env';

export function getStarttime(): Promise<number | undefined> {
  return axios
    .get(getGatewayUrl() + '/starttime')
    .then((res) => {
      if (!res.data || !res.data.startTime) return undefined;

      return res.data.startTime;
    })
    .catch((err) => {
      if (!err.response) {
        console.error('gateway is unresponsive');
      } else if (err.response.status !== 404) {
        console.log('err', err);
      }

      return undefined;
    });
}
