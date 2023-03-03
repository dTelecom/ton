import {Address, beginCell, Cell, WalletContract, TupleSlice} from "ton";

enum OPS {
    EndRoom = 0x91e26e0,
    SetOwner = 0x13fd15d3
}

export function endRoomOpBody(creatorUserAddress: Address, spentMinutes: number): Cell {
    return beginCell()
        .storeUint(OPS.EndRoom, 32)
        .storeUint(0, 64) // query_id
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