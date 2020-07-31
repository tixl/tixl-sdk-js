import axios from 'axios';

import { RootState } from '../redux';

export async function postDebugState(state: RootState) {
  return axios
    .post(process.env.REACT_APP_GATEWAY + '/dumpState', {
      state,
    })
    .then((res) => {
      if (res && res.data) {
        return res.data;
      }

      return undefined;
    });
}
