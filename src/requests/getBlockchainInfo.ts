import axios from 'axios';
import buildQueryString from 'build-query-string';
import { AssetSymbol, Signature } from '@tixl/tixl-types';

import { getGatewayUrl } from '../helpers/env';

export interface BlockchainInfo {
  publicSig: string;
  publicNtru: string;
  assetSymbol: AssetSymbol;
}

export const getBlockchainInfo = (signature: Signature): Promise<BlockchainInfo | undefined> =>
  axios
    .get(getGatewayUrl() + '/blockchaininfo?' + buildQueryString({ signature }))
    .then((res) => {
      if (!res.data || !res.data.info) return;

      return res.data.info;
    })
    .catch((err) => {
      if (!err.response) {
        console.error('gateway is unresponsive');
      } else if (err.response.status !== 404) {
        console.log('err', err);
      }

      return undefined;
    });
