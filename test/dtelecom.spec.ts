import { internalMessage, randomAddress, setBalance } from "./helpers";
import { Dtelecom } from "./lib/dtelecom";
import * as dtelecom from '../contracts/dtelecom'
import * as nodeWallet from '../contracts/node-wallet'

import chai, { expect } from "chai";
import chaiBN from "chai-bn";
import BN from "bn.js";
chai.use(chaiBN(BN));

import { hex as masterCodeHex } from '../build/dtelecom.compiled.json'
import { hex as userWalletCodeHex } from '../build/user-wallet.compiled.json'
import { hex as nodeWalletCodeHex } from '../build/node-wallet.compiled.json'
import { Address, Cell, toNano } from "ton";

import { UserWallet } from "./lib/user_wallet";
import { actionToMessage } from "./lib/utils";
import { NodeWallet } from "./lib/node_wallet";
import { parseActionsList, SendMsgAction } from "ton-contract-executor/dist/utils/parseActionList";
const MASTER_CODE = Cell.fromBoc(masterCodeHex)[0];
const USER_WALLET_CODE = Cell.fromBoc(userWalletCodeHex)[0];
const NODE_WALLET_CODE = Cell.fromBoc(nodeWalletCodeHex)[0];

const OWNER_ADDRESS = randomAddress("owner");
const USER_ADDRESS_1 = randomAddress("user_1");
const USER_ADDRESS_2 = randomAddress("user_2");
const NODE_ADDRESS_1 = randomAddress("node_1");

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
        const { balance, owner } = await masterContract.getDtelecomData();

        expect(balance).to.bignumber.equal(toNano(0));
        expect(owner.toFriendly()).to.equal(OWNER_ADDRESS.toFriendly());
    });

    it('offchain and onchain user wallet should return the same address', async () => {
        const userWallet = await getUserWalletContract(USER_ADDRESS_1, masterContract.address);
        const userWalletAddress = await masterContract.getUserWalletAddress(USER_ADDRESS_1);
        expect(userWallet.address.toFriendly()).to.equal(userWalletAddress.toFriendly());
    });

    it('should get userWallet initialization data correctly', async () => {
        const userWallet = await getUserWalletContract(USER_ADDRESS_1, masterContract.address);
        const userWalletData = await userWallet.getWalletData();

        expect(userWalletData.owner.toFriendly()).to.equal(USER_ADDRESS_1.toFriendly());
        expect(userWalletData.master.toFriendly()).to.equal(masterContract.address.toFriendly());
    });

    it('should increase balance of 2 users', async () => {
        const { actionList: createUser1ActionList } = await masterContract.contract.sendInternalMessage(
            internalMessage({
                from: USER_ADDRESS_1,
                value: new BN(10),
                body: dtelecom.createUserOpBody()
            })
        );
        console.log(parseActionsList(createUser1ActionList));

        const user1Wallet = await getUserWalletContract(USER_ADDRESS_1, masterContract.address);
        console.log(JSON.stringify(user1Wallet.contract.getC7()));
        // setBalance(user1Wallet.contract, new BN(0));
        console.log(JSON.stringify(user1Wallet.contract.getC7()));
        const res = await user1Wallet.contract.sendInternalMessage(
            actionToMessage(masterContract.address, createUser1ActionList[0])
        );
        console.log(JSON.stringify(user1Wallet.contract.getC7()));
        console.log(res);

        // const { balance: user1BalanceInitial } = await user1Wallet.getWalletData();
        // expect(user1BalanceInitial).to.bignumber.equal(new BN(0), 'user1Wallet inintial balance should be 0');

        // await user1Wallet.contract.sendInternalMessage(
        //     actionToMessage(masterContract.address, increaseUser1BalanceActionList[0])
        // )

        // const { balance: user1BalanceAfter } = await user1Wallet.getWalletData();
        // expect(user1BalanceAfter).to.bignumber.equal(
        //     toNano(0.01),
        //     "user1Wallet should reflect its balance after increasing"
        // );



        // const { actionList: increaseUser2BalanceActionList } = await masterContract.contract.sendInternalMessage(
        //     internalMessage({
        //         from: OWNER_ADDRESS,
        //         body: dtelecom.createUserOpBody(USER_ADDRESS_2)
        //     })
        // );

        // const user2Wallet = await getUserWalletContract(USER_ADDRESS_2, masterContract.address);

        // const { balance: user2BalanceInitial } = await user2Wallet.getWalletData();
        // expect(user2BalanceInitial).to.bignumber.equal(new BN(0), 'user2Wallet inintial balance should be 0');

        // await user2Wallet.contract.sendInternalMessage(
        //     actionToMessage(masterContract.address, increaseUser2BalanceActionList[0])
        // )
        // await user2Wallet.contract.sendInternalMessage(
        //     actionToMessage(masterContract.address, increaseUser2BalanceActionList[0])
        // )

        // const { balance: user2BalanceAfter } = await user2Wallet.getWalletData();
        // expect(user2BalanceAfter).to.bignumber.equal(
        //     toNano(0.04),
        //     "user1Wallet should reflect its balance after increasing"
        // );
    });

    it('offchain and onchain node wallet should return the same address', async () => {
        const nodeWallet = await getNodeWalletContract(NODE_ADDRESS_1, masterContract.address);
        const nodeWalletAddress = await masterContract.getNodeWalletAddress(NODE_ADDRESS_1);
        expect(nodeWallet.address.toFriendly()).to.equal(nodeWalletAddress.toFriendly());
    });

    it('should get nodeWallet initialization data correctly', async () => {
        const nodeWallet = await getNodeWalletContract(NODE_ADDRESS_1, masterContract.address);
        const nodeWalletData = await nodeWallet.getWalletData();

        expect(nodeWalletData.nodeHost).to.string('');
        expect(nodeWalletData.owner.toFriendly()).to.equal(NODE_ADDRESS_1.toFriendly());
        expect(nodeWalletData.master.toFriendly()).to.equal(masterContract.address.toFriendly());
    });

    it('create node', async () => {
        const { actionList: createNode1ActionList } = await masterContract.contract.sendInternalMessage(
            internalMessage({
                from: OWNER_ADDRESS,
                body: dtelecom.createNodeOpBody(NODE_ADDRESS_1, 'www.hello-world.com')
            })
        );

        expect(createNode1ActionList.length).equal(1);
        expect(createNode1ActionList[0].type).equal('send_msg');

        const node1Wallet = await getNodeWalletContract(NODE_ADDRESS_1, masterContract.address);
        await node1Wallet.contract.sendInternalMessage(
            actionToMessage(masterContract.address, createNode1ActionList[0])
        )

        const { nodeHost: nodeHostAfter } = await node1Wallet.getWalletData();
        expect(nodeHostAfter).equal('www.hello-world.com');
    });

    it('should end room', async () => {
        const { actionList: increaseUser1BalanceActionList } = await masterContract.contract.sendInternalMessage(
            internalMessage({
                from: OWNER_ADDRESS,
                body: dtelecom.increaseUserBalanceOpBody(USER_ADDRESS_1, toNano(1000))
            })
        );

        const user1Wallet = await getUserWalletContract(USER_ADDRESS_1, masterContract.address);

        const { balance: user1BalanceInitial } = await user1Wallet.getWalletData();
        expect(user1BalanceInitial).to.bignumber.equal(new BN(0), 'user1Wallet inintial balance should be 0');

        await user1Wallet.contract.sendInternalMessage(
            actionToMessage(masterContract.address, increaseUser1BalanceActionList[0])
        )

        const { balance: user1BalanceAfter } = await user1Wallet.getWalletData();
        expect(user1BalanceAfter).to.bignumber.equal(
            toNano(1000),
            "user1Wallet should reflect its balance after increasing"
        );



        const { balance: masterBalanceBeforeRoomEnded } = await masterContract.getDtelecomData();
        expect(masterBalanceBeforeRoomEnded).to.bignumber.equal(toNano(0));

        const node1Wallet = await getNodeWalletContract(NODE_ADDRESS_1, masterContract.address);
        const { actionList: roomEndedActionList } = await node1Wallet.contract.sendInternalMessage(
            internalMessage({
                from: NODE_ADDRESS_1,
                body: nodeWallet.roomEndedOpBody(USER_ADDRESS_1, 99)
            })
        );

        const {actionList: nodeRoomEndedActionList} = await masterContract.contract.sendInternalMessage(
            actionToMessage(node1Wallet.address, roomEndedActionList[0])
        )

        const { balance: masterBalanceAfterRoomEnded } = await masterContract.getDtelecomData();
        expect(masterBalanceAfterRoomEnded).to.bignumber.equal(new BN(99*10), 'master balance should reflect its balance after room ended');

        await user1Wallet.contract.sendInternalMessage(
            actionToMessage(masterContract.address, nodeRoomEndedActionList[0])
        )

        const { balance: user1BalanceAfterBurn } = await user1Wallet.getWalletData();
        expect(user1BalanceAfterBurn).to.bignumber.equal(
            toNano(1000).sub(new BN(99*10)),
            "user1Wallet should reflect its balance after room ended"
        );
    });
});
