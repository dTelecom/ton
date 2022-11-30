import {Address, beginCell, Cell, WalletContract, TupleSlice} from "ton";
import BN from "bn.js";
import * as utils from '../contracts/utils';

enum OPS {
    IncreaseUserBalance = 0xd47c6dd,
    CreateNode = 0xad4fe3a
}

export function initData(adminAddress: Address, userWalletCode: Cell, nodeWalletCode: Cell): Cell {
    return beginCell()
        .storeCoins(0)
        .storeAddress(adminAddress)
        .storeRef(userWalletCode)
        .storeRef(nodeWalletCode)
        .endCell();
}

export function increaseUserBalanceOpBody(userAddress: Address, amount: BN): Cell {
    return beginCell()
        .storeUint(OPS.IncreaseUserBalance, 32)
        .storeUint(0, 64)
        .storeAddress(userAddress)
        .storeCoins(amount)
        .endCell();
}

export function createNodeOpBody(nodeAddress: Address, nodeHost: String): Cell {
    const nodeHostBuffer = Buffer.from(nodeHost, 'utf8');
    return beginCell()
        .storeUint(OPS.CreateNode, 32)
        .storeUint(0, 64)
        .storeAddress(nodeAddress)
        .storeUint8(nodeHostBuffer.byteLength)
        .storeBuffer(nodeHostBuffer)
        .endCell();
}

interface Data {
    balance: BN,
    owner: Address
}

export async function getData(walletContract: WalletContract, contractAddress: Address): Promise<Data> {
    const getMethodResult = await walletContract.client.callGetMethod(contractAddress, 'get_dtelecom_data');
    const ts = new TupleSlice(getMethodResult.stack);
    return {
        balance: ts.readBigNumber(),
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