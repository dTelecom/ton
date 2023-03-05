import { beginCell, SendMode, toNano } from "ton-core"
import { Blockchain } from "@ton-community/sandbox"
import { Dtelecom } from "../contracts/Dtelecom"
import "@ton-community/test-utils" // register matchers
import { UserWallet } from "../contracts/UserWallet"
import { NodeWallet } from "../contracts/NodeWallet"

describe('Dtelecom', () => {
    it('should work', async () => {
        const blkch = await Blockchain.create()

        const admin = await blkch.treasury('admin')
        const user = await blkch.treasury('user')
        const node = await blkch.treasury('node')

        const dtelecom = blkch.openContract(new Dtelecom(0, admin.address))



        const createUserResult = await dtelecom.sendCreateUser(user.getSender(), {
            value: toNano('111')
        })

        // console.log('createUserResult', createUserResult)

        const userWalletAddress = await dtelecom.getUserWalletAddress(user.address)
        const userWallet = blkch.openContract(new UserWallet(userWalletAddress))
        const userWalletData = await userWallet.getData()

        console.log('user wallet data', userWalletData)



        const createNodeResult = await dtelecom.sendCreateNode(node.getSender(), {
            value: toNano('10.1'),
            nodeHost: 'wss://dtelecom.org'
        })

        // console.log('createNodeResult', createNodeResult)

        const nodeWalletAddress = await dtelecom.getNodeWalletAddress(node.address)
        const nodeWallet = blkch.openContract(new NodeWallet(nodeWalletAddress))
        const nodeWalletData = await nodeWallet.getData()

        console.log('node wallet data', nodeWalletData)

        console.log('dtelecom data', await dtelecom.getData())



        const endRoomResult = await nodeWallet.sendEndRoom(node.getSender(), {
            value: toNano('0.1'),
            roomCreator: user.address,
            spentMinutes: 10
        })

        // console.log('endRoomResult', endRoomResult)

        console.log('user wallet data after', await userWallet.getData())
        console.log('node wallet data after', await nodeWallet.getData())
        console.log('dtelecom data after', await dtelecom.getData())
    })
})