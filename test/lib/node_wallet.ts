import {WrappedSmartContract} from "./wrapped-smart-contract";
import {Address, beginCell, Cell, Slice} from "ton";

interface NodeWalletData {
    nodeHost: string;
    master: Address;
    owner: Address;
}

export class NodeWallet extends WrappedSmartContract {

    static initData(ownerAddress: Address, masterAddress: Address, nodeWalletCode: Cell): Cell {
        return beginCell()
            .storeUint8(0) // empty host
            .storeAddress(ownerAddress)
            .storeAddress(masterAddress)
            .storeRef(nodeWalletCode)
            .endCell();
    }

    async getWalletData(): Promise<NodeWalletData> {
        const res = await this.contract.invokeGetMethod('get_wallet_data', []);
        return {
            nodeHost: (res.result[0] as Slice).readRemainingBytes().toString('utf-8'),
            owner: (res.result[1] as Slice).readAddress()!,
            master: (res.result[2] as Slice).readAddress()!
        };
    }

}