import {WrappedSmartContract} from "./wrapped-smart-contract";
import BN from "bn.js";
import {Address, beginCell, Cell, Slice} from "ton";
import {toCellSlice, toCellSliceFromString} from "./utils";
import { stackSlice } from "ton-contract-executor";

interface DtelecomData {
    owner: Address;
}

export class Dtelecom extends WrappedSmartContract {
    async getUserWalletAddress(userAddress: Address): Promise<Address> {
        const res = await this.contract.invokeGetMethod('get_user_wallet_address', [toCellSlice(userAddress)]);
        return (res.result[0] as Slice).readAddress()!;
    }

    async getNodeWalletAddress(nodeAddress: Address): Promise<Address> {
        const res = await this.contract.invokeGetMethod('get_node_wallet_address', [toCellSlice(nodeAddress)]);
        return (res.result[0] as Slice).readAddress()!;
    }

    async getDtelecomData(): Promise<DtelecomData> {
        const res = await this.contract.invokeGetMethod('get_dtelecom_data', []);
        return {
            owner: (res.result[0] as Slice).readAddress()!
        };
    }
}