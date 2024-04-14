import { useEthereum } from './components/Context'

import { Connect } from './components/Connect'
import { Account } from './components/Account'
import { NetworkSwitcher } from './components/NetworkSwitcher'
import { Balance } from './components/Balance'
import { BlockNumber } from './components/BlockNumber'
import { ReadContract } from './components/ReadContract'
import { SendTransaction } from './components/SendTransaction'
import { SendTransactionPrepared } from './components/SendTransactionPrepared'
import { SignMessage } from './components/SignMessage'
import { SignTypedData } from './components/SignTypedData'
import { Token } from './components/Token'
import { WatchContractEvents } from './components/WatchContractEvents'
import { WatchPendingTransactions } from './components/WatchPendingTransactions'
import { WriteContract } from './components/WriteContract'
import { WriteContractPrepared } from './components/WriteContractPrepared'
import {Web3Provider, Provider, Signer, L1Signer, L1VoidSigner, types, utils} from 'zksync-ethers';
import {ethers} from 'ethers';

const sepolia = 'sepolia'

export function App() {
    const { account } = useEthereum();

    async function withdrawETH() {
        // Browser wallet should be connected to zkSync Era Sepolia network
        const browserProvider = new Web3Provider((window as any).ethereum);
        const provider = Provider.getDefaultProvider(types.Network.Sepolia);
        const ethProvider = ethers.getDefaultProvider(sepolia);
        const signer = Signer.from(
            browserProvider.getSigner(),
            provider
        );
        const voidSigner = new L1VoidSigner(await signer.getAddress(), ethProvider, provider);


        const signerL1 = L1Signer.from(
            browserProvider.getSigner(),
            Provider.getDefaultProvider(types.Network.Sepolia)
        );

        const tokenL1 = "0x5C221E77624690fff6dd741493D735a17716c26B";
        const gas = await signerL1.estimateGasDeposit({
            token: tokenL1,
            amount: 10_000_000,
        });
        console.log(`Gas: ${gas}`);

        console.log(`L2 balance before withdrawal: ${await voidSigner.getBalance()}`);
        console.log(`L1 balance before withdrawal: ${await voidSigner.getBalanceL1()}`);

        await signer.withdraw({
            token: utils.ETH_ADDRESS,
            to: await signer.getAddress(),
            amount: ethers.utils.parseEther('0.001')
        });

        console.log(`L2 balance after withdrawal: ${await voidSigner.getBalance()}`);
        console.log(`L1 balance after withdrawal: ${await voidSigner.getBalanceL1()}`);
    }

    return (
        <>
            <h1>zkSync + ethers v5 + Vite</h1>

            <Connect />

            {account.isConnected && (
                <>
                    <hr />
                    <h2>Network</h2>
                    <p>
                        <strong>Make sure to connect your wallet to zkSync Testnet for full functionality</strong>
                        <br />
                        or update to a different contract address
                    </p>
                    <NetworkSwitcher />
                    <br />
                    <hr />
                    <h2>Account</h2>
                    <Account />
                    <br />
                    <hr />
                    <h2>Balance</h2>
                    <Balance />
                    <br />
                    <hr />
                    <h2>Block Number</h2>
                    <BlockNumber />
                    <br />
                    <hr />
                    <h2>Read Contract</h2>
                    <ReadContract />
                    <br />
                    <hr />
                    <h2>Send Transaction</h2>
                    <SendTransaction />
                    <br />
                    <hr />
                    <h2>Send Transaction (Prepared)</h2>
                    <SendTransactionPrepared />
                    <br />
                    <hr />
                    <h2>Sign Message</h2>
                    <SignMessage />
                    <br />
                    <hr />
                    <h2>Sign Typed Data</h2>
                    <SignTypedData />
                    <br />
                    <hr />
                    <h2>Token</h2>
                    <Token />
                    <br />
                    <hr />
                    <h2>Watch Contract Events</h2>
                    <WatchContractEvents />
                    <br />
                    <hr />
                    <h2>Watch Pending Transactions</h2>
                    <WatchPendingTransactions />
                    <br />
                    <hr />
                    <h2>Write Contract</h2>
                    <WriteContract />
                    <br />
                    <hr />
                    <h2>Write Contract (Prepared)</h2>
                    <WriteContractPrepared />
                </>
            )}
        </>
    )
}
