import { ethers } from 'ethers'
import { task } from 'hardhat/config'

import { createGetHreByEid, createProviderFactory, getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { Options } from '@layerzerolabs/lz-v2-utilities'

import { abi } from './abi'

task('lz:test:oft:send', 'test send')
    .addParam('contractA', 'contract address on network A')
    .addParam('contractB', 'contract address on network B')
    .addParam('networkA', 'name of the network A')
    .addParam('networkB', 'name of the network B')
    .addParam('amount', 'amount to transfer in eth')
    .setAction(async (taskArgs) => {
        const eidA = getEidForNetworkName(taskArgs.networkA)
        const eidB = getEidForNetworkName(taskArgs.networkB)
        const contractA = taskArgs.contractA
        const contractB = taskArgs.contractB
        const environmentFactory = createGetHreByEid()
        const providerFactory = createProviderFactory(environmentFactory)
        const signer = (await providerFactory(eidA)).getSigner()
        const sender = await signer.getAddress()
        const oft = ethers.ContractFactory.getContract(contractA, abi, signer)
        const decimals = await oft.decimals()
        const amount = ethers.utils.parseUnits(taskArgs.amount, decimals)
        console.log('sending amount: ', amount.toString())
        const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString()
        const sendParam = [eidB, ethers.utils.zeroPad(contractB, 32), amount, amount, options, '0x', '0x']
        const [nativeFee] = await oft.quoteSend(sendParam, false)

        console.log({ eidA, eidB, contractA, contractB, amount, sender, nativeFee })

        console.log(
            `sending ${taskArgs.amount} tokens from network: ${taskArgs.networkA} to network: ${taskArgs.networkB}`
        )
        const r = await oft.send(sendParam, [nativeFee, 0], sender, { value: nativeFee })
        console.log(r)
        console.log(`Tx initiated. See: https://layerzeroscan.com/tx/${r.hash}`)
    })
