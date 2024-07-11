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
// import { Token } from './components/Token'
import { WatchContractEvents } from './components/WatchContractEvents'
import { WatchPendingTransactions } from './components/WatchPendingTransactions'
import { WriteContract } from './components/WriteContract'
import { WriteContractPrepared } from './components/WriteContractPrepared'
import {Web3Provider, Provider, Signer, L1Signer, L1VoidSigner, types, utils, Contract} from 'zksync-ethers';
import {BigNumber, ethers} from 'ethers';

import Token from './Token.json'

const sepolia = 'sepolia'

export function App() {
    const { account } = useEthereum();

    async function withdrawETH() {
        const paymaster = '0x13D0D8550769f59aa241a41897D4859c87f7Dd46';
        const approvalToken = '0x927488F48ffbc32112F1fF721759649A89721F8F';
        const zeekAddress = '0x9F649DDD12171091c90d0846b7CB40bda7BA299a';
        const message = 'This tx cost me no ETH!'
        const zeekABI = [
            "constructor()",
            "event MessageReceived(string)",
            "function getLastMessage() view returns (string)",
            "function getTotalMessages() view returns (uint256)",
            "function sendMessage(string memory _message)"
        ];


        // Browser wallet should be connected to zkSync Era Sepolia network
        const browserProvider = new Web3Provider((window as any).ethereum);

        const signer = Signer.from(
            browserProvider.getSigner(),
            Provider.getDefaultProvider(types.Network.Sepolia)
        );
        const walletAddress = await signer.getAddress();

        const zeek = new Contract(zeekAddress, zeekABI, signer)

        let ethBalance = await signer.getBalance();
        let tokenBalance = await signer.getBalance(approvalToken);
        console.log(`Account ${walletAddress} has ${ethers.utils.formatEther(ethBalance)} ETH`);
        console.log(`Account ${walletAddress} has ${ethers.utils.formatUnits(tokenBalance, 18)} tokens`);

        try {
            // use this when you need to mint approval tokens to use paymaster
            // otherwise you can comment
            const mintTx = await signer.sendTransaction({
                to: approvalToken,
                data: new ethers.utils.Interface([
                    "function mint(address _to, uint256 _amount) returns (bool)"
                ]).encodeFunctionData("mint", [await signer.getAddress(), BigNumber.from('10000000000000000')]),
            });
            await mintTx.wait();


            const gasLimit = await zeek.estimateGas.sendMessage(message, {
                customData: {
                    gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                    paymasterParams: utils.getPaymasterParams(paymaster, {
                        type: "ApprovalBased",
                        token: approvalToken,
                        minimalAllowance: BigNumber.from(1),
                        innerInput: new Uint8Array(0),
                    }),
                }
            });
            const gasPrice = await browserProvider.getGasPrice();
            const fee = gasPrice.mul(gasLimit);
            console.log(`Fee: ${fee.toString()}`);


        // send transaction with additional paymaster params as overrides
        const tx = await zeek.sendMessage(message, {
            maxFeePerGas: gasPrice,
            maxPriorityFeePerGas: "1",
            gasLimit,
            customData: {
                gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                paymasterParams: utils.getPaymasterParams(paymaster, {
                    type: "ApprovalBased",
                    token: approvalToken,
                    minimalAllowance: fee,
                    innerInput: new Uint8Array(0),
                }),
            }
        });
        console.log(`Transaction ${tx.hash} with fee ${ethers.utils.formatUnits(fee, 18)} ERC20 tokens, sent via paymaster ${paymaster}`);
        await tx.wait();
        console.log(`Transaction processed`)

        ethBalance = await signer.getBalance();
        tokenBalance = await signer.getBalance(approvalToken);
        console.log(`Account ${walletAddress} now has ${ethers.utils.formatEther(ethBalance)} ETH`);
        console.log(`Account ${walletAddress} now has ${ethers.utils.formatUnits(tokenBalance, 18)} tokens`);
        console.log(`Done!`);

        } catch (error) {
            console.log(error)
        }

        // const transferTx = await s.transfer({
        //     token: utils.ETH_ADDRESS,
        //     to: '0x81E9D85b65E9CC8618D85A1110e4b1DF63fA30d9',
        //     amount: 5000
        // });
        // console.log(transferTx);
        // const signer = Signer.from(
        //     browserProvider.getSigner(),
        //     provider
        // );
        // const voidSigner = new L1VoidSigner(await signer.getAddress(), ethProvider, provider);
        //
        //
        // const signerL1 = L1Signer.from(
        //     browserProvider.getSigner(),
        //     Provider.getDefaultProvider(types.Network.Sepolia)
        // );
        //
        // const tokenL1 = "0x5C221E77624690fff6dd741493D735a17716c26B";
        // const gas = await signerL1.estimateGasDeposit({
        //     token: tokenL1,
        //     amount: 10_000_000,
        // });
        // console.log(`Gas: ${gas}`);
        //
        // console.log(`L2 balance before withdrawal: ${await voidSigner.getBalance()}`);
        // console.log(`L1 balance before withdrawal: ${await voidSigner.getBalanceL1()}`);
        //
        // await signer.withdraw({
        //     token: utils.ETH_ADDRESS,
        //     to: await signer.getAddress(),
        //     amount: ethers.utils.parseEther('0.001')
        // });
        //
        // console.log(`L2 balance after withdrawal: ${await voidSigner.getBalance()}`);
        // console.log(`L1 balance after withdrawal: ${await voidSigner.getBalanceL1()}`);
    }

    return (
        <>
            <h1>zkSync + ethers v5 + Vite</h1>

            <Connect />

            {account.isConnected && (
                <>
                    <hr />
                    <button onClick={withdrawETH}>Execute</button>
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
