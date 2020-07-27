import JSBI from 'jsbi';
import { Blockchain, Crypto, KeySet, AssetSymbol, BlockchainTx } from '@tixl/tixl-types';

import { decryptSender } from './api/encryption';
import { createWithdrawalBlock } from './api/withdraw';
import { searchFunds } from './api/funds';
import { workingCopy } from './utils';

export async function withdrawTx(
  crypto: Crypto,
  keySet: KeySet,
  blockchain: Blockchain,
  amount: string | number | bigint,
  extAddress: string,
  symbol: AssetSymbol,
) {
  const blockchainCopy = workingCopy(blockchain);
  const prev = workingCopy(blockchainCopy.leaf());

  if (!prev) throw 'no leaf for chain found';

  await decryptSender(crypto, prev, keySet.aes);

  const newBalance = JSBI.subtract(JSBI.BigInt(prev.senderBalance), JSBI.BigInt(amount.toString()));
  console.log('withdrawal new balance', newBalance);

  const withdrawFromwallet = await createWithdrawalBlock(
    crypto,
    prev,
    blockchainCopy.publicSig,
    extAddress,
    amount,
    newBalance.toString(),
    symbol,
    keySet.sig.privateKey,
    keySet.aes,
  );

  blockchainCopy.addBlock(withdrawFromwallet.block);

  return {
    blockchain: blockchainCopy,
    tx: withdrawFromwallet.tx,
    receiveBlock: withdrawFromwallet.block,
  };
}

export async function withdraw(
  crypto: Crypto,
  keySet: KeySet,
  accountChain: Blockchain,
  amount: string | number | bigint,
  address: string,
  symbol: AssetSymbol,
  loader: Record<string, Blockchain | undefined>,
): Promise<BlockchainTx[] | false> {
  // gather list of stealthchains with sufficient amounts
  const stealthchains = await searchFunds(crypto, accountChain, keySet, amount, symbol, loader);

  if (!stealthchains) return false;

  // create withdraw blocks on all these stealthchains
  return Promise.all(
    stealthchains.map(async (fund) => {
      return withdrawTx(crypto, fund.keySet, fund.stealthChain, fund.amount, address, symbol);
    }),
  );
}
