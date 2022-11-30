import {Address, beginCell} from "ton";

export function toTvmSlice(address: Address) {
    return ['tvm.Slice', toCellString(address)];
}

export function toCellString(address: Address): String {
    return beginCell()
        .storeAddress(address)
        .endCell()
        .toBoc({idx: false})
        .toString("base64");
}