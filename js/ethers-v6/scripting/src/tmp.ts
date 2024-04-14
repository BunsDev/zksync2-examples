import { Provider, types, utils, Wallet } from "zksync-ethers";
import { ethers } from "ethers";
import { IERC20__factory } from "zksync-ethers/build/typechain/factories/"

const provider = Provider.getDefaultProvider(types.Network.Sepolia);
const ethProvider = ethers.getDefaultProvider("https://sepolia.infura.io/v3/501003dcc2fb4abfb939207f9d1c54d7");

// const provider = Provider.getDefaultProvider(types.Network.Mainnet);
// const ethProvider = ethers.getDefaultProvider("https://mainnet.infura.io/v3/501003dcc2fb4abfb939207f9d1c54d7");
// const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PRIVATE_KEY='dd09bab622750ad521c32a46642202dcbfe40cae8adad9a69c66815db4b520bf';
const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);

const receiver = "0x81E9D85b65E9CC8618D85A1110e4b1DF63fA30d9";
const address = "0x082b1bb53fe43810f646ddd71aa2ab201b4c6b04"
const token = "0x6a4Fb925583F7D4dF82de62d98107468aE846FD1";
const tokenL1 = '0x56E69Fa1BB0d1402c89E3A4E3417882DeA6B14Be';

async function main() {

    // const fee = await wallet.getFullRequiredDepositFee({
    //     token: utils.ETH_ADDRESS,
    //     to: wallet.address
    // });
    // console.log(`Fee: ${utils.toJSON(fee)}`);
    // console.log(`Block number: ${await provider.getBlockNumber()}`);
    // const block = await provider.getBlock("latest", true);
    // console.log(`Block: ${utils.toJSON(block)}`);
    // console.log(`Block txs: ${utils.toJSON(block.getPrefetchedTransaction(0))}`);

    // const gasTransferETH = await provider.estimateGasTransfer({
    //     from: address,
    //     to: receiver,
    //     amount: ethers.parseEther("0.01")
    // });
    //
    // const gasTransferToken = await provider.estimateGasTransfer({
    //     from: address,
    //     to: receiver,
    //     token: token,
    //     amount: 1
    // });
    //
    // const gasWithdrawETH = await provider.estimateGasWithdraw({
    //     from: address,
    //     to: address,
    //     token: utils.ETH_ADDRESS,
    //     amount: ethers.parseEther("0.01"),
    // });
    //
    // const gasWithdrawToken = await provider.estimateGasWithdraw({
    //     from: address,
    //     to: address,
    //     token: token,
    //     amount: 1,
    // });
    //
    // console.log(`Transfer ETH gas: ${gasTransferETH}`);
    // console.log(`Transfer Token gas: ${gasTransferToken}`);
    // console.log(`Withdraw ETH gas: ${gasWithdrawETH}`);
    // console.log(`Withdraw Token gas: ${gasWithdrawToken}`);
}

main()
    .then()
    .catch((error) => {
        console.log(`Error: ${error}`);
    });
