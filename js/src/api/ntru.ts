import { Crypto } from '@tixl/tixl-types';

export async function ntruKeyPair(crypto: Crypto) {
  const seed = crypto.randomBytes(32);
  const pair = await crypto.ntru.keyPair(seed);

  return {
    public: crypto.base64.toString(pair.publicKey),
    private: crypto.base64.toString(pair.privateKey),
  };
}
