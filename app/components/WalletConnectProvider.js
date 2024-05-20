/* eslint-disable react-hooks/exhaustive-deps */
import {WalletAdapterNetwork} from '@solana/wallet-adapter-base';
import { ConnectionProvider , WalletProvider } from '@solana/wallet-adapter-react';
import {WalletModalProvider} from '@solana/wallet-adapter-react-ui';
import { GlowWalletAdapter , PhantomWalletAdapter , SlopeWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';

export const WalletConnectProvider = ({children}) => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => {
    if (network === WalletAdapterNetwork.Devnet) {
      return 'https://icy-crimson-silence.solana-devnet.quiknode.pro/75a5d4fbc202d48602f78b2ce6a1ad01f34a5f8b/'
    }

    return clusterApiUrl(network);
  }, [network]);

  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SlopeWalletAdapter(),
    new GlowWalletAdapter(),
  ], [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
};



