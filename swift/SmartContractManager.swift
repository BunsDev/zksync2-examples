//
//  SmartContractManager.swift
//  zkSync-Demo
//
//  Created by Bojan on 17.6.23..
//

import Foundation
import BigInt
#if canImport(web3swift)
import web3swift
import Web3Core
#else
import web3swift_zksync2
#endif
#if canImport(zkSync2_swift)
import zkSync2_swift
#endif

class SmartContractManager: BaseManager {
    func deploySmartContract(callback: @escaping (() -> Void)) {
        Task {
            let url = Bundle.main.url(forResource: "Storage", withExtension: "zbin")!
            let bytecodeData = try! Data(contentsOf: url)
            
            let contractTransaction = CodableTransaction.create2ContractTransaction(
                from: EthereumAddress(self.signer.address)!,
                gasPrice: BigUInt.zero,
                gasLimit: BigUInt.zero,
                bytecode: bytecodeData,
                deps: [bytecodeData],
                calldata: Data(),
                salt: Data(),
                chainId: self.signer.domain.chainId
            )
            
            let precomputedAddress = ContractDeployer.computeL2Create2Address(
                EthereumAddress(self.signer.address)!,
                bytecode: bytecodeData,
                constructor: Data(),
                salt: Data()
            )
            
            let chainID = self.signer.domain.chainId
            
            var estimate = CodableTransaction.createFunctionCallTransaction(
                from: EthereumAddress(self.signer.address)!,
                to: contractTransaction.to,
                gasPrice: BigUInt.zero,
                gasLimit: BigUInt.zero,
                data: contractTransaction.data
            )
            
            estimate.eip712Meta?.factoryDeps = [bytecodeData]
            
            let fee = try! zkSync.zksEstimateFee(estimate).wait()
            
            var transaction = await CodableTransaction(
                type: .eip712,
                to: estimate.to,
                nonce: self.getNonce(),
                chainID: self.signer.domain.chainId,
                data: estimate.data
            )
            transaction.value = contractTransaction.value
            transaction.gasLimit = fee.gasLimit
            transaction.maxPriorityFeePerGas = fee.maxPriorityFeePerGas
            transaction.maxFeePerGas = fee.maxFeePerGas
            transaction.from = contractTransaction.from
            transaction.eip712Meta = estimate.eip712Meta
            transaction.eip712Meta?.factoryDeps = [bytecodeData]
            
            signTransaction(&transaction)
            
            guard let message = transaction.encode(for: .transaction) else {
                fatalError("Failed to encode transaction.")
            }
            
            let result = try! await zkSync.web3.eth.send(raw: message)
            
            let receipt = await transactionReceiptProcessor.waitForTransactionReceipt(hash: result.hash)
            
            assert(receipt?.status == .ok)
            assert(precomputedAddress == receipt?.contractAddress)
            
            callback()
        }
    }

    func deploySmartContractViaWallet(callback: @escaping (() -> Void)) {
        let url = Bundle.main.url(forResource: "Storage", withExtension: "zbin")!
        let bytecodeData = try! Data(contentsOf: url)
        Task {
            let result = await wallet.deploy(bytecodeData)
            
            let receipt = await transactionReceiptProcessor.waitForTransactionReceipt(hash: result.hash)
            
            assert(receipt?.status == .ok)
            
            callback()
        }
    }

    func testSmartContract(smartContractAddress: String, callback: @escaping (() -> Void)) {
        Task {
            let contractAddress = EthereumAddress(smartContractAddress)!
            
            let contract = self.zkSync.web3.contract("[{\"inputs\":[],\"name\":\"get\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_value\",\"type\":\"uint256\"}],\"name\":\"set\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]", at: contractAddress)!
            
            let value = BigUInt(100)
            
            var parameters = [
                value as AnyObject
            ] as [AnyObject]
            
            guard let writeTransaction = contract.createWriteOperation(
                "set",
                parameters: parameters
            ) else {
                fatalError(DefaultEthereumProvider.EthereumProviderError.invalidParameter.localizedDescription)
            }
            writeTransaction.transaction.from = EthereumAddress(signer.address)!
            
            var estimate = CodableTransaction.createFunctionCallTransaction(
                from: EthereumAddress(self.signer.address)!,
                to: writeTransaction.transaction.to,
                gasPrice: BigUInt.zero,
                gasLimit: BigUInt.zero,
                data: writeTransaction.transaction.data
            )
            
            let fee = try! zkSync.zksEstimateFee(estimate).wait()
            
            estimate.eip712Meta?.gasPerPubdata = BigUInt(160000)
            
            var transaction = await CodableTransaction(
                type: .eip712,
                to: estimate.to,
                nonce: self.getNonce(),
                chainID: self.signer.domain.chainId,
                data: estimate.data
            )
            transaction.eip712Meta = estimate.eip712Meta
            transaction.from = EthereumAddress(signer.address)!
            transaction.gasLimit = fee.gasLimit
            transaction.maxPriorityFeePerGas = fee.maxPriorityFeePerGas
            transaction.maxFeePerGas = fee.maxFeePerGas
            
            signTransaction(&transaction)
            
            _ = try! await zkSync.web3.eth.send(transaction)
            
            parameters = [
                
            ] as [AnyObject]
            
            guard let readTransaction = contract.createReadOperation(
                "get",
                parameters: parameters
            ) else {
                fatalError(DefaultEthereumProvider.EthereumProviderError.invalidParameter.localizedDescription)
            }
            
            let result = try! await readTransaction.callContractMethod()
            
            print("result:", result)
            
            callback()
        }
    }
}
