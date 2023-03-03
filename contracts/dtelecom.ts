import {Address, beginCell, Cell, WalletContract, TupleSlice} from "ton";
import BN from "bn.js";
import * as utils from '../contracts/utils';

enum OPS {
    CreateUser = 0x3e135959,
    CreateNode = 0x448685af
}

export function initData(adminAddress: Address, userWalletCode: Cell, nodeWalletCode: Cell): Cell {
    return beginCell()
        .storeAddress(adminAddress)
        .storeRef(userWalletCode)
        .storeRef(nodeWalletCode)
        .endCell();
}

export function createUserOpBody(): Cell {
    return beginCell()
        .storeUint(OPS.CreateUser, 32)
        .storeUint(0, 64) // query_id
        .endCell();
}

export function createNodeOpBody(nodeHost: String): Cell {
    const nodeHostBuffer = Buffer.from(nodeHost, 'utf8');
    return beginCell()
        .storeUint(OPS.CreateNode, 32)
        .storeUint(0, 64) // query_id
        .storeUint8(nodeHostBuffer.byteLength)
        .storeBuffer(nodeHostBuffer)
        .endCell();
}

interface Data {
    owner: Address
}

export async function getData(walletContract: WalletContract, contractAddress: Address): Promise<Data> {
    const getMethodResult = await walletContract.client.callGetMethod(contractAddress, 'get_dtelecom_data');
    const ts = new TupleSlice(getMethodResult.stack);
    return {
        owner: ts.readCell().beginParse().readAddress()!
    };
}

export async function getUserWalletAddress(walletContract: WalletContract, contractAddress: Address, userAddress: Address): Promise<Address> {
    const getMethodResult = await walletContract.client.callGetMethod(
        contractAddress,
        'get_user_wallet_address',
        [utils.toTvmSlice(userAddress)]
    );
    return new TupleSlice(getMethodResult.stack).readCell().beginParse().readAddress()!;
}

export async function getNodeWalletAddress(walletContract: WalletContract, contractAddress: Address, userAddress: Address): Promise<Address> {
    const getMethodResult = await walletContract.client.callGetMethod(
        contractAddress,
        'get_node_wallet_address',
        [utils.toTvmSlice(userAddress)]
    );
    return new TupleSlice(getMethodResult.stack).readCell().beginParse().readAddress()!;
}