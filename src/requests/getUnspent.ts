import axios from 'axios';
import { Block, SigPublicKey } from '@tixl/tixl-types';

export const getUnspent = async (signature: SigPublicKey): Promise<{ blocks: Block[] }> =>
  axios.get(process.env.REACT_APP_GATEWAY + `/unspent?signature=${signature}`).then((res) => res.data);
