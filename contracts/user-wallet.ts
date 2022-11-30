import {Address, WalletContract, TupleSlice} from "ton";
import BN from "bn.js";

interface Data {
    balance: BN,
    owner: Address,
    master: Address
}

export async function getData(walletContract: WalletContract, contractAddress: Address): Promise<Data> {
    const getMethodResult = await walletContract.client.callGetMethod(contractAddress, 'get_wallet_data');
    const ts = new TupleSlice(getMethodResult.stack);
    return {
        balance: ts.readBigNumber(),
        owner: ts.readCell().beginParse().readAddress()!,
        master: ts.readCell().beginParse().readAddress()!,
    };
}