import {Address, beginCell, Cell, WalletContract, TupleSlice} from "ton";

enum OPS {
    SetHost = 0x227b61b6,
    RoomEnded = 0x4251da14
}

export function roomEndedOpBody(creatorUserAddress: Address, spentMinutes: number): Cell {
    return beginCell()
        .storeUint(OPS.RoomEnded, 32)
        .storeUint(0, 64)
        .storeAddress(creatorUserAddress)
        .storeUint(spentMinutes, 32)
        .endCell();
}

interface Data {
    nodeHost: string,
    owner: Address,
    master: Address
}

export async function getData(walletContract: WalletContract, contractAddress: Address): Promise<Data> {
    const getMethodResult = await walletContract.client.callGetMethod(contractAddress, 'get_wallet_data');
    const ts = new TupleSlice(getMethodResult.stack);
    return {
        nodeHost: ts.readCell().beginParse().readRemainingBytes().toString('utf-8'),
        owner: ts.readCell().beginParse().readAddress()!,
        master: ts.readCell().beginParse().readAddress()!,
    }
}