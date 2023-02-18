import {WrappedSmartContract} from "./wrapped-smart-contract";
import BN from "bn.js";
import {Address, beginCell, Cell, Slice} from "ton";

enum OPS {
    IncreaseBalance = 0
}

interface UserWalletData {
    owner: Address;
    master: Address;
}

export class UserWallet extends WrappedSmartContract {

    static initData(ownerAddress: Address, masterAddress: Address, userWalletCode: Cell): Cell {
        return beginCell()
            .storeAddress(ownerAddress)
            .storeAddress(masterAddress)
            .storeRef(userWalletCode)
            .endCell();
    }

    async getWalletData(): Promise<UserWalletData> {
        const res = await this.contract.invokeGetMethod('get_wallet_data', []);
        return {
            owner: (res.result[0] as Slice).readAddress()!,
            master: (res.result[1] as Slice).readAddress()!
        };
    }

    static increaseBalanceBody(): Cell {
        return beginCell()
            .storeUint(OPS.IncreaseBalance, 32)
            .storeUint(0, 64)
            .endCell();
    }
}

