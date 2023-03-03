import {stackSlice, TVMStackEntry} from "ton-contract-executor/dist/executor/executor";
import {Address, beginCell, CommonMessageInfo, CellMessage, InternalMessage} from "ton";
import { OutAction } from "ton-contract-executor";
import BN from "bn.js";

export function toCellSlice(address: Address): TVMStackEntry {
    return {
        type: "cell_slice",
        value: beginCell()
            .storeAddress(address)
            .endCell()
            .toBoc({idx: false})
            .toString("base64"),
    };
}

export function toCellSliceFromString(s: String): TVMStackEntry {
    return stackSlice(
        beginCell()
        .storeBuffer(Buffer.from(s))
        .endCell()
    );
}

export function toCellString(address: Address): String {
    return beginCell()
        .storeAddress(address)
        .endCell()
        .toBoc({idx: false})
        .toString("base64");
}

export function actionToMessage(
    from: Address,
    action: OutAction | undefined,
    messageValue = new BN(1000000000),
    bounce = true
) {
    //@ts-ignore
    const sendMessageAction = action as SendMsgOutAction;

    let msg = new CommonMessageInfo({
        body: new CellMessage(sendMessageAction.message?.body),
    });
    return new InternalMessage({
        to: sendMessageAction.message?.info.dest,
        from,
        value: messageValue,
        bounce,
        body: msg,
    });
}
