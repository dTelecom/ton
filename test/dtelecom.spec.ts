import { internalMessage, randomAddress, setBalance } from "./helpers";
import { Dtelecom } from "./lib/dtelecom";
import * as dtelecom from '../contracts/dtelecom'
import * as nodeWallet from '../contracts/node-wallet'

import chai, { expect, should } from "chai";
import chaiBN from "chai-bn";
import BN from "bn.js";
chai.use(chaiBN(BN));
should();

import { hex as masterCodeHex } from '../build/dtelecom.compiled.json';
import { hex as userWalletCodeHex } from '../build/user-wallet.compiled.json';
import { hex as nodeWalletCodeHex } from '../build/node-wallet.compiled.json';
import { Address, Cell, InternalCommonMessageInfoRelaxed, toNano } from "ton";

import { UserWallet } from "./lib/user_wallet";
import { actionToMessage } from "./lib/utils";
import { NodeWallet } from "./lib/node_wallet";
import { parseActionsList, SendMsgAction } from "ton-contract-executor/dist/utils/parseActionList";
const MASTER_CODE = Cell.fromBoc(masterCodeHex)[0];
const USER_WALLET_CODE = Cell.fromBoc(userWalletCodeHex)[0];
const NODE_WALLET_CODE = Cell.fromBoc(nodeWalletCodeHex)[0];

const OWNER_ADDRESS = randomAddress("owner");
const USER_ADDRESS = randomAddress("user_1");
const NODE_ADDRESS = randomAddress("node_1");

describe('Dtelecom', () => {
    let masterContract: Dtelecom;

    const getUserWalletContract = async (
        owner: Address,
        master: Address
    ): Promise<UserWallet> =>
        await UserWallet.create(
            USER_WALLET_CODE,
            UserWallet.initData(owner, master, USER_WALLET_CODE)
        ) as UserWallet;

    const getNodeWalletContract = async (
        owner: Address,
        master: Address
    ): Promise<NodeWallet> =>
        await NodeWallet.create(
            NODE_WALLET_CODE,
            NodeWallet.initData(owner, master, NODE_WALLET_CODE)
        ) as NodeWallet;

    beforeEach(async () => {
        const masterDataCell = dtelecom.initData(OWNER_ADDRESS, USER_WALLET_CODE, NODE_WALLET_CODE);
        masterContract = (await Dtelecom.create(MASTER_CODE, masterDataCell)) as Dtelecom;
    })

    it('should get master initialization data correctly', async () => {
        const { owner } = await masterContract.getDtelecomData();

        expect(owner.toFriendly()).to.equal(OWNER_ADDRESS.toFriendly());
    });

    it('offchain and onchain user wallet should return the same address', async () => {
        const userWallet = await getUserWalletContract(USER_ADDRESS, masterContract.address);
        const userWalletAddress = await masterContract.getUserWalletAddress(USER_ADDRESS);
        expect(userWallet.address.toFriendly()).to.equal(userWalletAddress.toFriendly());
    });

    it('should get userWallet initialization data correctly', async () => {
        const userWallet = await getUserWalletContract(USER_ADDRESS, masterContract.address);
        const userWalletData = await userWallet.getWalletData();

        expect(userWalletData.owner.toFriendly()).to.equal(USER_ADDRESS.toFriendly());
        expect(userWalletData.master.toFriendly()).to.equal(masterContract.address.toFriendly());
    });

    it('should create user wallet', async () => {
        const { actionList: createUser1ActionList } = await masterContract.contract.sendInternalMessage(
            internalMessage({
                from: USER_ADDRESS,
                body: dtelecom.createUserOpBody()
            })
        );
        expect(createUser1ActionList.length).equal(1, "should be only one message");
        expect((createUser1ActionList[0] as SendMsgAction).mode).equal(64, "mode should be 64")
        expect(((createUser1ActionList[0] as SendMsgAction).message.info as InternalCommonMessageInfoRelaxed).value.coins)
            .to.be.bignumber.equal(toNano(0), "should carry 0 coins");

        const user1Wallet = await getUserWalletContract(USER_ADDRESS, masterContract.address);
        expect(((createUser1ActionList[0] as SendMsgAction).message.info as InternalCommonMessageInfoRelaxed).dest.toFriendly())
            .to.equal(user1Wallet.address.toFriendly(), "should send message to user1 wallet");
    });

    it('offchain and onchain node wallet should return the same address', async () => {
        const nodeWallet = await getNodeWalletContract(NODE_ADDRESS, masterContract.address);
        const nodeWalletAddress = await masterContract.getNodeWalletAddress(NODE_ADDRESS);
        nodeWallet.address.toFriendly().should.equal(nodeWalletAddress.toFriendly());
    });

    it('should get nodeWallet initialization data correctly', async () => {
        const nodeWallet = await getNodeWalletContract(NODE_ADDRESS, masterContract.address);
        const nodeWalletData = await nodeWallet.getWalletData();

        nodeWalletData.nodeHost.should.equal('');
        nodeWalletData.owner.toFriendly().should.equal(NODE_ADDRESS.toFriendly());
        nodeWalletData.master.toFriendly().should.equal(masterContract.address.toFriendly());
    });

    it('create node', async () => {
        const notEnoughMoneyResult = await masterContract.contract.sendInternalMessage(
            internalMessage({
                from: NODE_ADDRESS,
                value: new BN(10000000000), // 10 TON
                body: dtelecom.createNodeOpBody('wss://dtelecom.org')
            })
        );

        expect(notEnoughMoneyResult.type).to.be.equal('failed');
        expect(notEnoughMoneyResult.exit_code).to.be.equal(73);

        const {actionList: createNode1ActionList} = await masterContract.contract.sendInternalMessage(
            internalMessage({
                from: NODE_ADDRESS,
                value: new BN(11000000000), // 11 TON
                body: dtelecom.createNodeOpBody('wss://dtelecom.org')
            })
        );

        expect(createNode1ActionList.length).equal(1);
        expect(createNode1ActionList[0].type).equal('send_msg');

        const node1Wallet = await getNodeWalletContract(NODE_ADDRESS, masterContract.address);
        await node1Wallet.contract.sendInternalMessage(
            actionToMessage(masterContract.address, createNode1ActionList[0])
        )

        const { nodeHost: nodeHostAfter } = await node1Wallet.getWalletData();
        expect(nodeHostAfter).to.be.equal('wss://dtelecom.org');
    });

    it('should end room', async () => {
        const node1Wallet = await getNodeWalletContract(NODE_ADDRESS, masterContract.address);

        const { actionList: endRoomActionList, type: endRoomType } = await node1Wallet.contract.sendInternalMessage(
            internalMessage({
                from: NODE_ADDRESS,
                body: nodeWallet.endRoomOpBody(USER_ADDRESS, 99)
            })
        );
        endRoomType.should.equal('success');

        const {actionList: endNodeRoomActionList, type: endNodeRoomType} = await masterContract.contract.sendInternalMessage(
            actionToMessage(node1Wallet.address, endRoomActionList[0])
        )
        endNodeRoomType.should.equal('success');

        const user1Wallet = await getUserWalletContract(USER_ADDRESS, masterContract.address);
        const { actionList: payRewardsActionList, type: payRewardsType } = await user1Wallet.contract.sendInternalMessage(
            actionToMessage(masterContract.address, endNodeRoomActionList[0])
        )
        payRewardsType.should.equal('success');

        payRewardsActionList.should.have.lengthOf(3);
        payRewardsActionList[0].type.should.equal('send_msg');
        payRewardsActionList[1].type.should.equal('send_msg');
        payRewardsActionList[2].type.should.equal('send_msg');

        ((payRewardsActionList[0] as SendMsgAction).message.info as InternalCommonMessageInfoRelaxed).value.coins.should.be.bignumber.equal(new BN(99*100000000));
        ((payRewardsActionList[1] as SendMsgAction).message.info as InternalCommonMessageInfoRelaxed).value.coins.should.be.bignumber.equal(new BN(99*100000000));
    });
});
