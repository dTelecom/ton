import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, ContractState, Sender, storeStateInit, toNano } from "ton-core";

import { hex as codeHex } from '../../build/node-wallet.compiled.json';

enum OPS {
    EndRoom = 0x91e26e0
}

export type NodeWalletData = {
    contractBalance: bigint
    nodeHost: string
    owner: Address
    master: Address
}

export class NodeWallet implements Contract {
    static readonly code = Cell.fromBoc(Buffer.from(codeHex, "hex"))[0];

    constructor(readonly address: Address) {}

    async sendEndRoom(provider: ContractProvider, via: Sender, params: {
        value: bigint
        roomCreator: Address
        spentMinutes: number
    }) {
        await provider.internal(via, {
            value: params.value,
            body: beginCell()
                .storeUint(OPS.EndRoom, 32)
                .storeUint(0, 64) // query_id
                .storeAddress(params.roomCreator)
                .storeUint(params.spentMinutes, 32)
                .endCell()
        })
    }

    async getData(provider: ContractProvider): Promise<NodeWalletData> {
        const { balance } = await provider.getState();
        const { stack } = await provider.get('get_wallet_data', [])

        return {
            contractBalance: balance,
            nodeHost: stack.readString(),
            owner: stack.readAddress(),
            master: stack.readAddress()
        }
    }
}