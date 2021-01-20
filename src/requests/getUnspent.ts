import axios from 'axios';
import { Block, SigPublicKey } from '@tixl/tixl-types';

import { getGatewayUrl } from '../helpers/env';

export const getUnspent = async (signature: SigPublicKey): Promise<{ blocks: Block[] }> =>
  axios.get(getGatewayUrl() + `/unspent?signature=${signature}`).then((res) => res.data);
