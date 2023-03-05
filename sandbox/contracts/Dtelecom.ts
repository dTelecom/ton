import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, ContractState, Sender, storeStateInit, toNano } from "ton-core";

import { hex as dtelecomCodeHex } from '../../build/dtelecom.compiled.json';
import { NodeWallet } from "./NodeWallet";
import { UserWallet } from "./UserWallet";

enum OPS {
    CreateUser = 0x3e135959,
    CreateNode = 0x448685af
}

export type DtelecomData = {
    contractBalance: bigint
    owner: Address
}

export class Dtelecom implements Contract {
    static readonly code = Cell.fromBoc(Buffer.from(dtelecomCodeHex, "hex"))[0];

    readonly address: Address;
    readonly init: { code: Cell; data: Cell; };

    constructor(workchain: number, adminAddress: Address) {
        const data = beginCell()
            .storeAddress(adminAddress)
            .storeRef(UserWallet.code)
            .storeRef(NodeWallet.code)
            .endCell();
        this.init = { code: Dtelecom.code, data };
        this.address = contractAddress(workchain, this.init);
    }

    async sendCreateUser(provider: ContractProvider, via: Sender, params: {
        value: bigint
    }) {
        await provider.internal(via, {
            value: params.value,
            body: beginCell()
                .storeUint(OPS.CreateUser, 32)
                .storeUint(0, 64) // query_id
                .endCell()
        });
    }

    async sendCreateNode(provider: ContractProvider, via: Sender, params: {
        value: bigint,
        nodeHost: string
    }) {
        const nodeHostBuffer = Buffer.from(params.nodeHost, 'utf8');
        await provider.internal(via, {
            value: params.value,
            body: beginCell()
                .storeUint(OPS.CreateNode, 32)
                .storeUint(0, 64) // query_id
                .storeUint(nodeHostBuffer.byteLength, 8)
                .storeBuffer(nodeHostBuffer)
                .endCell()
        });
    }

    async getUserWalletAddress(provider: ContractProvider, userAddress: Address): Promise<Address> {
        const { stack } = await provider.get('get_user_wallet_address', [{ type: 'slice', cell: beginCell().storeAddress(userAddress).endCell() }])
        return stack.readAddress()
    }

    async getNodeWalletAddress(provider: ContractProvider, nodeAddress: Address): Promise<Address> {
        const { stack } = await provider.get('get_node_wallet_address', [{ type: 'slice', cell: beginCell().storeAddress(nodeAddress).endCell() }])
        return stack.readAddress()
    }

    async getData(provider: ContractProvider): Promise<DtelecomData> {
        const { balance } = await provider.getState();
        const { stack } = await provider.get('get_dtelecom_data', [])
        return {
            contractBalance: balance,
            owner: stack.readAddress()
        }
    }
}