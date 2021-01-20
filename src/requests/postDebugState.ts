import axios from 'axios';

import { RootState } from '../redux';
import { getGatewayUrl } from '../helpers/env';

export async function postDebugState(state: RootState) {
  return axios
    .post(getGatewayUrl() + '/dumpState', {
      state,
    })
    .then((res) => {
      if (res && res.data) {
        return res.data;
      }

      return undefined;
    });
}
