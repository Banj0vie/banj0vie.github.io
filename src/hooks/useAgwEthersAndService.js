import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useGlobalWalletSignerClient, useLoginWithAbstract, useAbstractClient } from '@abstract-foundation/agw-react';
import { transformEIP1193Provider } from '@abstract-foundation/agw-client';
import { abstractTestnet } from 'viem/chains';
import ContractService from '../services/contractService';
import { useAccount, useDisconnect } from 'wagmi';
import { createPublicClient, http } from 'viem';

export function useAgwEthersAndService() {
    const signerClient = useGlobalWalletSignerClient();
    const { login } = useLoginWithAbstract();
    const { address: wagmiAddress, isConnected, isConnecting, error } = useAccount();
    const { disconnect } = useDisconnect();
    const { data: agwClient } = useAbstractClient();

    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [account, setAccount] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [contractService, setContractService] = useState(null);
    const [hasProfile, setHasProfile] = useState(false);

    const isWalletReady = !!(isConnected && account && contractService);
    
    useEffect(() => {
        const setup = async () => {
            // Initialize AGW-only service ASAP for early writes/reads
            if (agwClient && !contractService) {
                const publicClient = createPublicClient({
                    chain: abstractTestnet,
                    transport: http(), // or http('https://your-rpc')
                  })
                const svc = new ContractService(publicClient, agwClient);
                setContractService(svc);
                try {
                    if (account) {
                        const has = await svc.hasProfile(account);
                        setHasProfile(has);
                    }
                } catch {}
            }

            // Hydrate ethers provider/signer when signerClient is ready
            try {
                if (!signerClient) return;
                const eip1193 = transformEIP1193Provider({
                    provider: signerClient.transport.value,
                    chain: abstractTestnet,
                });
                const nextProvider = new ethers.BrowserProvider(eip1193);
                const nextSigner = await nextProvider.getSigner();
                const [network, address] = await Promise.all([
                    nextProvider.getNetwork(),
                    nextSigner.getAddress(),
                ]);
                setProvider(nextProvider);
                setSigner(nextSigner);
                setAccount(address || wagmiAddress || null);
                setChainId(network.chainId.toString());
                // Upgrade to full service with ethers runner
                const publicClient = createPublicClient({
                    chain: abstractTestnet,
                    transport: http(), // or http('https://your-rpc')
                  })
                const fullSvc = new ContractService(publicClient, agwClient);
                setContractService(fullSvc);
                try {
                    const has = account ? await fullSvc.hasProfile(account) : false;
                    setHasProfile(has);
                } catch (error) {
                    console.warn('Failed to check profile status:', error);
                    setHasProfile(false);
                }
            } catch (e) {
                // ignore until wallet connects
            }
        };
        setup();
    }, [signerClient, wagmiAddress, agwClient, account, contractService]);

    // Fallback: if wagmi has an address but signer/provider not yet set, surface account early
    useEffect(() => {
        if (wagmiAddress && !account) {
            setAccount(wagmiAddress);
        }
    }, [wagmiAddress, account]);

    // Function to refresh profile status
    const refreshProfileStatus = async () => {
        if (contractService && account) {
            try {
                console.log('🔄 useAgwEthersAndService: Refreshing profile status for account:', account);
                const has = await contractService.hasProfile(account);
                console.log('🔍 useAgwEthersAndService: Profile status result:', has);
                setHasProfile(has);
                console.log('✅ useAgwEthersAndService: hasProfile state updated to:', has);
                return has;
            } catch (error) {
                console.warn('Failed to refresh profile status:', error);
                setHasProfile(false);
                return false;
            }
        }
        return false;
    };

    return {
        provider,
        signer,
        account,
        chainId,
        isConnected,
        isWalletReady,
        isConnecting,
        error,
        connect: login,
        disconnect,
        contractService,
        hasProfile,
        refreshProfileStatus,
    };
}


