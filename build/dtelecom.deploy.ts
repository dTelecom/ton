import * as dtelecom from '../contracts/dtelecom';
import * as user from '../contracts/user-wallet';
import * as node from '../contracts/node-wallet';
import {Address, Cell, toNano, WalletContract} from "ton";

import { hex as userWalletCodeHex } from '../build/user-wallet.compiled.json'
import { hex as nodeWalletCodeHex } from '../build/node-wallet.compiled.json'
import {sendInternalMessageWithWallet} from "../test/helpers";

const USER_WALLET_CODE = Cell.fromBoc(userWalletCodeHex)[0];
const NODE_WALLET_CODE = Cell.fromBoc(nodeWalletCodeHex)[0];

export function initData() {
    return dtelecom.initData(
        Address.parseFriendly('EQB72RSmofKZRjevBTwExavdu-Ip5oWedomAzM8p46eaYZfH').address,
        USER_WALLET_CODE,
        NODE_WALLET_CODE
    )
}

export function initMessage() {
    return null;
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createNode(walletContract: WalletContract, secretKey: Buffer, contractAddress: Address) {
    const nodeAddress = Address.parse('EQA_nXy_aebj9P44bZ_uj7VbTEObCZGPF8GUOJc6adyLPvqP');
    
    await sendInternalMessageWithWallet({
        walletContract,
        secretKey,
        to: contractAddress,
        value: toNano(0.02),
        body: dtelecom.createNodeOpBody(nodeAddress, 'www.hello-world.com')
    });
    console.log(`Sent 'createNode' op message for node = ${nodeAddress.toFriendly()}`);
}

async function checkBalance(walletContract: WalletContract, secretKey: Buffer, contractAddress: Address) {
    const dtelecomData = await dtelecom.getData(walletContract, contractAddress);
    console.log(`Master contract balance = ${dtelecomData.balance}`);

    const userAddress = walletContract.address;
    const userWalletAddress = await dtelecom.getUserWalletAddress(walletContract, contractAddress, userAddress);
    console.log(`User contract owner = ${userAddress.toFriendly()} and address = ${userWalletAddress!.toFriendly()}`);

    const userDataAfterBalanceIncrease = await user.getData(walletContract, userWalletAddress);
    console.log(`User contract balance = ${userDataAfterBalanceIncrease.balance}`);
}

async function general(walletContract: WalletContract, secretKey: Buffer, contractAddress: Address) {
    const userAddress = walletContract.address;
    const nodeAddress = walletContract.address;

    const userWalletAddress = await dtelecom.getUserWalletAddress(walletContract, contractAddress, userAddress);
    console.log(`User wallet address = ${userWalletAddress!.toFriendly()}`);

    const nodeWalletAddress = await dtelecom.getNodeWalletAddress(walletContract, contractAddress, nodeAddress);
    console.log(`Node wallet address = ${nodeWalletAddress!.toFriendly()}`);
    
    const dtelecomData = await dtelecom.getData(walletContract, contractAddress);
    console.log(`Master contract data (balance = ${dtelecomData.balance}, owner = ${dtelecomData.owner.toFriendly()})`);
    

    // increate user wallet balance
    await sendInternalMessageWithWallet({
        walletContract,
        secretKey,
        to: contractAddress,
        value: toNano(0.02),
        body: dtelecom.increaseUserBalanceOpBody(userAddress, toNano(1000))
    });
    console.log(`Sent 'increaseUserBalance' op message for user = ${userAddress.toFriendly()}`);

    const userDataAfterBalanceIncrease = await user.getData(walletContract, userWalletAddress);
    console.log(`User wallet balance = ${userDataAfterBalanceIncrease.balance}`);
    //-----------------------------


    // create node
    await sendInternalMessageWithWallet({
        walletContract,
        secretKey,
        to: contractAddress,
        value: toNano(0.02),
        body: dtelecom.createNodeOpBody(nodeAddress, 'www.hello-world.com')
    });
    console.log(`Sent 'createNode' op message for node = ${nodeAddress.toFriendly()}`);

    const nodeDataAfterCreateNode = await node.getData(walletContract, nodeWalletAddress);
    console.log(`Node wallet host = ${nodeDataAfterCreateNode.nodeHost}`);
    //------------

    // end room
    await sendInternalMessageWithWallet({
        walletContract,
        secretKey,
        to: nodeWalletAddress,
        value: toNano(0.04),
        body: node.roomEndedOpBody(userAddress, 30)
    });
    console.log(`Sent 'roomEnded' op message for user = ${userAddress.toFriendly()} and node = ${nodeAddress.toFriendly()}`);

    console.log('Waiting 10 sec');
    await sleep(10000);

    const userDataAfterRoomEnd = await user.getData(walletContract, userWalletAddress);
    console.log(`User wallet balance = ${userDataAfterRoomEnd.balance}`);

    const dtelecomDataAfterRoomEnd = await dtelecom.getData(walletContract, contractAddress);
    console.log(`Master wallet balance = ${dtelecomDataAfterRoomEnd.balance}`);
    //---------
}

export {checkBalance as postDeployTest};