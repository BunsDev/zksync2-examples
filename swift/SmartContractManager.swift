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
#else
import web3swift_zksync
#endif
#if canImport(ZkSync2)
import ZkSync2
#endif

class SmartContractManager: BaseManager {
    func deploySmartContract(callback: (() -> Void)) {
        let url = Bundle.main.url(forResource: "Storage", withExtension: "zbin")!
        let bytecodeBytes = try! Data(contentsOf: url)
        
        let contractTransaction = EthereumTransaction.create2ContractTransaction(
            from: EthereumAddress(signer.address)!,
            gasPrice: BigUInt.zero,
            gasLimit: BigUInt.zero,
            bytecode: bytecodeBytes,
            deps: [bytecodeBytes],
            calldata: Data(),
            salt: Data(),
            chainId: signer.domain.chainId
        )
        
        let precomputedAddress = ContractDeployer.computeL2Create2Address(
            EthereumAddress(signer.address)!,
            bytecode: bytecodeBytes,
            constructor: Data(),
            salt: Data()
        )
        
        let chainID = signer.domain.chainId
        
        var estimate = EthereumTransaction.createFunctionCallTransaction(
            from: EthereumAddress(signer.address)!,
            to: contractTransaction.to,
            gasPrice: BigUInt.zero,
            gasLimit: BigUInt.zero,
            data: contractTransaction.data
        )
        
        estimate.parameters.EIP712Meta?.factoryDeps = [bytecodeBytes]
        
        let fee = try! zkSync.zksEstimateFee(estimate).wait()
        
        var transactionOptions = TransactionOptions.defaultOptions
        transactionOptions.type = .eip712
        transactionOptions.chainID = chainID
        transactionOptions.nonce = .manual(nonce)
        transactionOptions.to = contractTransaction.to
        transactionOptions.value = contractTransaction.value
        transactionOptions.gasLimit = .manual(fee.gasLimit)
        transactionOptions.maxPriorityFeePerGas = .manual(fee.maxPriorityFeePerGas)
        transactionOptions.maxFeePerGas = .manual(fee.maxFeePerGas)
        transactionOptions.from = contractTransaction.parameters.from
        
        var ethereumParameters = EthereumParameters(from: transactionOptions)
        ethereumParameters.EIP712Meta = estimate.parameters.EIP712Meta
        ethereumParameters.EIP712Meta?.factoryDeps = [bytecodeBytes]
        
        var transaction = EthereumTransaction(
            type: .eip712,
            to: estimate.to,
            nonce: nonce,
            chainID: chainId,
            data: estimate.data,
            parameters: ethereumParameters
        )
        
        signTransaction(&transaction)
        
        guard let message = transaction.encode(for: .transaction) else {
            fatalError("Failed to encode transaction.")
        }
        
        let result = try! zkSync.web3.eth.sendRawTransactionPromise(message).wait()
        
        let receipt = transactionReceiptProcessor.waitForTransactionReceipt(hash: result.hash)
        
        assert(receipt?.status == .ok)
        assert(precomputedAddress == receipt?.contractAddress)
        
        callback()
    }
    
    func deploySmartContractViaWallet(callback: (() -> Void)) {
        let url = Bundle.main.url(forResource: "Storage", withExtension: "zbin")!
        let bytecodeBytes = try! Data(contentsOf: url)
        let result = try! wallet.deploy(bytecodeBytes).wait()
        
        let receipt = transactionReceiptProcessor.waitForTransactionReceipt(hash: result.hash)
        
        assert(receipt?.status == .ok)
        
        callback()
    }
    
    func testSmartContract(callback: (() -> Void)) {
        let contractAddress = EthereumAddress("0xf3ea0f675900d6aa31b2a7a30612a70e83989052")!
        
        let contract = zkSync.web3.contract("[{\"inputs\":[],\"name\":\"get\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_value\",\"type\":\"uint256\"}],\"name\":\"set\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]", at: contractAddress)!
        
        let value = BigUInt(100)
        
        var parameters = [
            value as AnyObject
        ] as [AnyObject]
        
        var transactionOptions = TransactionOptions.defaultOptions
        transactionOptions.from = EthereumAddress(signer.address)!
        
        guard let writeTransaction = contract.write(
            "set",
            parameters: parameters,
            transactionOptions: transactionOptions
        ) else {
            fatalError(DefaultEthereumProvider.EthereumProviderError.invalidParameter.localizedDescription)
        }
        
        var estimate = EthereumTransaction.createFunctionCallTransaction(
            from: EthereumAddress(signer.address)!,
            to: writeTransaction.transaction.to,
            gasPrice: BigUInt.zero,
            gasLimit: BigUInt.zero,
            data: writeTransaction.transaction.data
        )
        
        let fee = try! zkSync.zksEstimateFee(estimate).wait()
        
        estimate.parameters.EIP712Meta?.gasPerPubdata = BigUInt(160000)
        
        transactionOptions = TransactionOptions.defaultOptions
        transactionOptions.type = .eip712
        transactionOptions.from = EthereumAddress(signer.address)!
        transactionOptions.to = estimate.to
        transactionOptions.gasLimit = .manual(fee.gasLimit)
        transactionOptions.maxPriorityFeePerGas = .manual(fee.maxPriorityFeePerGas)
        transactionOptions.maxFeePerGas = .manual(fee.maxFeePerGas)
        transactionOptions.nonce = .manual(nonce)
        transactionOptions.chainID = chainId
        
        var ethereumParameters = EthereumParameters(from: transactionOptions)
        ethereumParameters.EIP712Meta = estimate.parameters.EIP712Meta
        
        var transaction = EthereumTransaction(
            type: .eip712,
            to: estimate.to,
            nonce: nonce,
            chainID: chainId,
            data: estimate.data,
            parameters: ethereumParameters
        )
        
        signTransaction(&transaction)
        
        _ = try! zkSync.web3.eth.sendRawTransactionPromise(transaction).wait()
        
        parameters = [
            
        ] as [AnyObject]
        
        guard let readTransaction = contract.read(
            "get",
            parameters: parameters,
            transactionOptions: nil
        ) else {
            fatalError(DefaultEthereumProvider.EthereumProviderError.invalidParameter.localizedDescription)
        }
        
        let result = try! readTransaction.callPromise().wait()
        
        print("result:", result)
        
        callback()
    }
}
