import {useEthereum} from './components/Context'

import {Connect} from './components/Connect'
import {Account} from './components/Account'
import {NetworkSwitcher} from './components/NetworkSwitcher'
import {Balance} from './components/Balance'
import {BlockNumber} from './components/BlockNumber'
import {ReadContract} from './components/ReadContract'
import {SendTransaction} from './components/SendTransaction'
import {SendTransactionPrepared} from './components/SendTransactionPrepared'
import {SignMessage} from './components/SignMessage'
import {SignTypedData} from './components/SignTypedData'
import {Token} from './components/Token'
import {WatchContractEvents} from './components/WatchContractEvents'
import {WatchPendingTransactions} from './components/WatchPendingTransactions'
import {WriteContract} from './components/WriteContract'
import {WriteContractPrepared} from './components/WriteContractPrepared'
import {L1Signer, L1VoidSigner, Provider, types, utils, BrowserProvider, Signer, Wallet} from 'zksync-ethers';
import {ethers} from 'ethers';

const tokenL1 = '0x56E69Fa1BB0d1402c89E3A4E3417882DeA6B14Be';
const token = '0x6a4Fb925583F7D4dF82de62d98107468aE846FD1';
const sepolia = 'sepolia'; // or URL to custom RPC provider
const receiver = '0x81E9D85b65E9CC8618D85A1110e4b1DF63fA30d9';
const approvalToken = '0x927488F48ffbc32112F1fF721759649A89721F8F'; // Crown token which can be minted for free
const paymaster = '0x13D0D8550769f59aa241a41897D4859c87f7Dd46'; // Paymaster for Crown token

export function App() {
    const {account, getSigner, getProvider} = useEthereum();

    async function depositETH() {
        // Browser wallet should be connected to Ethereum Sepolia network
        const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
        const provider = Provider.getDefaultProvider(types.Network.Sepolia);
        const signer = L1Signer.from(await browserProvider.getSigner(), provider);

        console.log(`L2 balance before deposit: ${await provider.getBalance(signer.address)}`);
        console.log(`L1 balance before deposit: ${await browserProvider.getBalance(signer.address)}`);

        await signer.deposit({
            token: utils.ETH_ADDRESS,
            to: signer.address,
            amount: ethers.parseEther('0.01')
        });

        console.log(`L2 balance after deposit: ${await provider.getBalance(signer.address)}`);
        console.log(`L1 balance after deposit: ${await browserProvider.getBalance(signer.address)}`);
    }

    async function depositToken() {
        // Browser wallet should be connected to Ethereum Sepolia network
        const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
        const provider = Provider.getDefaultProvider(types.Network.Sepolia);
        const ethProvider = ethers.getDefaultProvider(sepolia);
        const signer = L1Signer.from(await browserProvider.getSigner(), provider);
        const voidSigner = new L1VoidSigner(signer.address, ethProvider, provider);

        console.log(`L2 token balance before deposit: ${await voidSigner.getBalance(token)}`);
        console.log(`L1 token balance before deposit: ${await voidSigner.getBalanceL1(tokenL1)}`);

        await signer.deposit({
            token: tokenL1,
            to: signer.address,
            amount: 5,
            approveERC20: true
        });

        console.log(`L2 token balance after deposit: ${await voidSigner.getBalance(token)}`);
        console.log(`L1 token balance after deposit: ${await voidSigner.getBalanceL1(tokenL1)}`);
    }

    async function withdrawETH() {
        // Browser wallet should be connected to zkSync Era Sepolia network
        const browserProvider = new BrowserProvider((window as any).ethereum);
        const provider = Provider.getDefaultProvider(types.Network.Sepolia);
        const ethProvider = ethers.getDefaultProvider(sepolia);
        const signer = Signer.from(
            await browserProvider.getSigner(),
            Number((await browserProvider.getNetwork()).chainId),
            provider
        );
        const voidSigner = new L1VoidSigner(signer.address, ethProvider, provider);

        console.log(`L2 balance before withdrawal: ${await voidSigner.getBalance()}`);
        console.log(`L1 balance before withdrawal: ${await voidSigner.getBalanceL1()}`);

        await signer.withdraw({
            token: utils.ETH_ADDRESS,
            to: signer.address,
            amount: ethers.parseEther('0.001')
        });

        console.log(`L2 balance after withdrawal: ${await voidSigner.getBalance()}`);
        console.log(`L1 balance after withdrawal: ${await voidSigner.getBalanceL1()}`);
    }

    async function withdrawToken() {
        // Browser wallet should be connected to zkSync Era Sepolia network
        const browserProvider = new BrowserProvider((window as any).ethereum);
        const provider = Provider.getDefaultProvider(types.Network.Sepolia);
        const ethProvider = ethers.getDefaultProvider(sepolia);
        const signer = Signer.from(
            await browserProvider.getSigner(),
            Number((await browserProvider.getNetwork()).chainId),
            provider
        );
        const voidSigner = new L1VoidSigner(signer.address, ethProvider, provider);

        console.log(`L2 balance before withdrawal: ${await voidSigner.getBalance(token)}`);
        console.log(`L1 balance before withdrawal: ${await voidSigner.getBalanceL1(tokenL1)}`);

        await signer.withdraw({
            token: token,
            to: signer.address,
            amount: 5,
        });

        signer.sendTransaction({
            to: receiver,
            value: ethers.parseEther('0.01')
        })

        console.log(`L2 balance after withdrawal: ${await voidSigner.getBalance(token)}`);
        console.log(`L1 balance after withdrawal: ${await voidSigner.getBalanceL1(tokenL1)}`);
    }

    async function transferETH() {
        // Browser wallet should be connected to zkSync Era Sepolia network
        const browserProvider = new BrowserProvider((window as any).ethereum);
        const signer = await browserProvider.getSigner();
        const provider = Provider.getDefaultProvider(types.Network.Sepolia);

        console.log(`Account1 balance before transfer: ${await signer.getBalance()}`);
        console.log(`Account2 balance before transfer: ${await provider.getBalance(receiver)}`);

        await signer.transfer({
            to: receiver,
            amount: ethers.parseEther('0.01'),
        });

        console.log(`Account1 balance after transfer: ${await signer.getBalance()}`);
        console.log(`Account2 balance after transfer: ${await provider.getBalance(receiver)}`);
    }

    async function transferToken() {
        // Browser wallet should be connected to zkSync Era Sepolia network
        const browserProvider = new BrowserProvider((window as any).ethereum);
        const signer = await browserProvider.getSigner();
        const provider = Provider.getDefaultProvider(types.Network.Sepolia);

        console.log(`Account1 balance before transfer: ${await signer.getBalance(token)}`);
        console.log(`Account2 balance before transfer: ${await provider.getBalance(receiver, 'latest', token)}`);

        await signer.transfer({
            token: token,
            to: receiver,
            amount: 5,
        });

        console.log(`Account1 balance after transfer: ${await signer.getBalance(token)}`);
        console.log(`Account2 balance after transfer: ${await provider.getBalance(receiver, 'latest', token)}`);
    }

    async function transferETHUsingApprovalPaymaster() {
        // Browser wallet should be connected to zkSync Era Sepolia network
        const browserProvider = new BrowserProvider((window as any).ethereum);
        const signer = await browserProvider.getSigner();
        const provider = Provider.getDefaultProvider(types.Network.Sepolia);

        console.log(`Account1 balance before transfer: ${await signer.getBalance()}`);
        console.log(`Account2 balance before transfer: ${await provider.getBalance(receiver)}`);

        await signer.transfer({
            to: receiver,
            amount: ethers.parseEther('0.01'),
            paymasterParams: utils.getPaymasterParams(paymaster, {
                type: 'ApprovalBased',
                token: approvalToken,
                minimalAllowance: 1,
                innerInput: new Uint8Array(),
            }),
        });

        console.log(`Account1 balance after transfer: ${await signer.getBalance()}`);
        console.log(`Account2 balance after transfer: ${await provider.getBalance(receiver)}`);
    }

    async function transferTokenUsingApprovalPaymaster() {
        // Browser wallet should be connected to zkSync Era Sepolia network
        const browserProvider = new BrowserProvider((window as any).ethereum);
        const signer = await browserProvider.getSigner();
        const provider = Provider.getDefaultProvider(types.Network.Sepolia);

        console.log(`Account1 balance before transfer: ${await signer.getBalance(token)}`);
        console.log(`Account2 balance before transfer: ${await provider.getBalance(receiver, "latest", token)}`);

        const tx = await signer.transfer({
            token: token,
            to: receiver,
            amount: 5,
            paymasterParams: utils.getPaymasterParams(paymaster, {
                type: 'ApprovalBased',
                token: approvalToken,
                minimalAllowance: 1,
                innerInput: new Uint8Array(),
            }),
        });
        const receipt = await tx.wait();
        console.log(`Tx: ${receipt.hash}`);

        console.log(`Account1 balance after transfer: ${await signer.getBalance(token)}`);
        console.log(`Account2 balance after transfer: ${await provider.getBalance(receiver, 'latest', token)}`);
    }

    async function gasEstimation() {
        // Browser wallet should be connected to zkSync Era Sepolia network
        const browserProvider = new BrowserProvider((window as any).ethereum);
        const signer = await browserProvider.getSigner();
        const provider = Provider.getDefaultProvider(types.Network.Sepolia);

        const gasTransferETH = await provider.estimateGasTransfer({
            from: await signer.getAddress(),
            to: receiver,
            amount: ethers.parseEther("0.01")
        });

        const gasTransferToken = await provider.estimateGasTransfer({
            from: await signer.getAddress(),
            to: receiver,
            token: token,
            amount: 1
        });

        const gasWithdrawETH = await provider.estimateGasWithdraw({
            from: await signer.getAddress(),
            to: await signer.getAddress(),
            token: utils.ETH_ADDRESS,
            amount: ethers.parseEther("0.01"),
        });

        const gasWithdrawToken = await provider.estimateGasWithdraw({
            from: await signer.getAddress(),
            to: await signer.getAddress(),
            token: token,
            amount: 1,
        });

        console.log(`Transfer ETH gas: ${gasTransferETH}`);
        console.log(`Transfer Token gas: ${gasTransferToken}`);
        console.log(`Withdraw ETH gas: ${gasWithdrawETH}`);
        console.log(`Withdraw Token gas: ${gasWithdrawToken}`);
    }

    const getFullRequiredDepositFee = async () => {
        // Browser wallet should be connected to Ethereum Sepolia network
        const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
        const provider = Provider.getDefaultProvider(types.Network.Sepolia);
        const signer = L1Signer.from(await browserProvider.getSigner(), provider);
        const fee = await signer.getFullRequiredDepositFee({
            to: signer.address,
            token: utils.ETH_ADDRESS,
        });
        console.log(`Fee: ${utils.toJSON(fee)}`);
    }

    return (
        <>
            <h1>zkSync + ethers + Vite</h1>

            <Connect/>

            {account.isConnected && (
                <>
                    <hr/>

                    <h2>Get full required deposit fee</h2>
                    <button onClick={getFullRequiredDepositFee}>Execute</button>

                    <h2>Deposit ETH</h2>
                    <button onClick={depositETH}>Execute</button>

                    <h2>Deposit token</h2>
                    <button onClick={depositToken}>Execute</button>

                    <h2>Withdraw ETH</h2>
                    <button onClick={withdrawETH}>Execute</button>

                    <h2>Withdraw token</h2>
                    <button onClick={withdrawToken}>Execute</button>

                    <h2>Transfer ETH</h2>
                    <button onClick={transferETH}>Execute</button>

                    <h2>Transfer token</h2>
                    <button onClick={transferToken}>Execute</button>

                    <h2>Transfer ETH using approval paymaster</h2>
                    <button onClick={transferETHUsingApprovalPaymaster}>Execute</button>

                    <h2>Transfer token using approval paymaster</h2>
                    <button onClick={transferTokenUsingApprovalPaymaster}>Execute</button>

                    <h2>Network</h2>
                    <p>
                        <strong>Make sure to connect your wallet to zkSync Testnet for full functionality</strong>
                        <br/>
                        or update to a different contract address
                    </p>
                    <NetworkSwitcher/>
                    <br/>
                    <hr/>
                    <h2>Account</h2>
                    <Account/>
                    <br/>
                    <hr/>
                    <h2>Balance</h2>
                    <Balance/>
                    <br/>
                    <hr/>
                    <h2>Block Number</h2>
                    <BlockNumber/>
                    <br/>
                    <hr/>
                    <h2>Read Contract</h2>
                    <ReadContract/>
                    <br/>
                    <hr/>
                    <h2>Send Transaction</h2>
                    <SendTransaction/>
                    <br/>
                    <hr/>
                    <h2>Send Transaction (Prepared)</h2>
                    <SendTransactionPrepared/>
                    <br/>
                    <hr/>
                    <h2>Sign Message</h2>
                    <SignMessage/>
                    <br/>
                    <hr/>
                    <h2>Sign Typed Data</h2>
                    <SignTypedData/>
                    <br/>
                    <hr/>
                    <h2>Token</h2>
                    <Token/>
                    <br/>
                    <hr/>
                    <h2>Watch Contract Events</h2>
                    <WatchContractEvents/>
                    <br/>
                    <hr/>
                    <h2>Watch Pending Transactions</h2>
                    <WatchPendingTransactions/>
                    <br/>
                    <hr/>
                    <h2>Write Contract</h2>
                    <WriteContract/>
                    <br/>
                    <hr/>
                    <h2>Write Contract (Prepared)</h2>
                    <WriteContractPrepared/>
                </>
            )}
        </>
    )
}
