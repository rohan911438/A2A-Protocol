from __future__ import annotations

from pyteal import (
    App,
    Btoi,
    Bytes,
    BytesZero,
    Concat,
    Extract,
    For,
    Global,
    If,
    InnerTxnBuilder,
    Int,
    Itob,
    Len,
    Mode,
    OnComplete,
    Return,
    ScratchVar,
    Seq,
    Subroutine,
    TealType,
    Txn,
    TxnField,
    TxnType,
    Gtxn,
    Approve,
    Reject,
    Pop,
    BoxCreate,
    BoxGet,
    BoxPut,
)

STATUS_CREATED = Int(0)
STATUS_ACCEPTED = Int(1)
STATUS_FUNDED = Int(2)
STATUS_CLOSED = Int(3)

MAX_MILESTONES = Int(5)


def int8(value) -> Bytes:
    # last byte of 8-byte integer
    return Extract(Itob(value), Int(7), Int(1))


def meta_key(deal_id) -> Bytes:
    return Concat(Bytes("meta:"), deal_id)


def milestone_key(deal_id, index) -> Bytes:
    return Concat(Bytes("m:"), deal_id, Itob(index))


@Subroutine(TealType.uint64)
def is_creator():
    return Txn.sender() == Global.creator_address()


def approval_program() -> str:
    deal_id = ScratchVar(TealType.bytes)
    count = ScratchVar(TealType.uint64)
    total = ScratchVar(TealType.uint64)
    sum_amt = ScratchVar(TealType.uint64)
    amt = ScratchVar(TealType.uint64)
    i = ScratchVar(TealType.uint64)
    meta_exists = ScratchVar(TealType.uint64)

    meta = ScratchVar(TealType.bytes)
    buyer = ScratchVar(TealType.bytes)
    seller = ScratchVar(TealType.bytes)
    total_b = ScratchVar(TealType.bytes)
    status_b = ScratchVar(TealType.uint64)
    count_b = ScratchVar(TealType.uint64)
    released_b = ScratchVar(TealType.uint64)

    meta_get = BoxGet(meta_key(deal_id.load()))

    load_meta = Seq(
        meta_get,
        If(meta_get.hasValue() == Int(0)).Then(Reject()),
        meta.store(meta_get.value()),
        buyer.store(Extract(meta.load(), Int(0), Int(32))),
        seller.store(Extract(meta.load(), Int(32), Int(32))),
        total_b.store(Extract(meta.load(), Int(64), Int(8))),
        status_b.store(Btoi(Extract(meta.load(), Int(72), Int(1)))),
        count_b.store(Btoi(Extract(meta.load(), Int(73), Int(1)))),
        released_b.store(Btoi(Extract(meta.load(), Int(74), Int(1)))),
    )

    create_deal_get = BoxGet(meta_key(deal_id.load()))

    create_deal = Seq(
        deal_id.store(Txn.application_args[1]),
        total.store(Btoi(Txn.application_args[2])),
        count.store(Btoi(Txn.application_args[3])),
        sum_amt.store(Int(0)),
        create_deal_get,
        meta_exists.store(create_deal_get.hasValue()),
        If(
            (Txn.application_args[0] != Bytes("create"))
            | (count.load() == Int(0))
            | (count.load() > MAX_MILESTONES)
            | (Txn.application_args.length() != count.load() + Int(4))
            | (meta_exists.load() != Int(0))
        ).Then(Reject()),
        Pop(BoxCreate(meta_key(deal_id.load()), Int(75))),
        For(
            i.store(Int(0)),
            i.load() < count.load(),
            i.store(i.load() + Int(1)),
        ).Do(
            Seq(
                amt.store(Btoi(Txn.application_args[i.load() + Int(4)])),
                sum_amt.store(sum_amt.load() + amt.load()),
                Pop(BoxCreate(milestone_key(deal_id.load(), i.load()), Int(9))),
                BoxPut(
                    milestone_key(deal_id.load(), i.load()),
                    Concat(Itob(amt.load()), int8(Int(0))),
                ),
            )
        ),
        If(sum_amt.load() != total.load()).Then(Reject()),
        BoxPut(
            meta_key(deal_id.load()),
            Concat(
                Txn.sender(),
                BytesZero(Int(32)),
                Itob(total.load()),
                int8(STATUS_CREATED),
                int8(count.load()),
                int8(Int(0)),
            ),
        ),
        Approve(),
    )

    accept = Seq(
        deal_id.store(Txn.application_args[1]),
        load_meta,
        If((status_b.load() != STATUS_CREATED) & (status_b.load() != STATUS_FUNDED)).Then(Reject()),
        If(seller.load() != BytesZero(Int(32))).Then(Reject()),
        BoxPut(
            meta_key(deal_id.load()),
            Concat(
                buyer.load(),
                Txn.sender(),
                total_b.load(),
                int8(If(status_b.load() == STATUS_FUNDED, STATUS_FUNDED, STATUS_ACCEPTED)),
                int8(count_b.load()),
                int8(released_b.load()),
            ),
        ),
        Approve(),
    )

    deposit = Seq(
        deal_id.store(Txn.application_args[1]),
        load_meta,
        If(
            (Global.group_size() != Int(2))
            | (Gtxn[0].type_enum() != TxnType.Payment)
            | (Gtxn[0].receiver() != Global.current_application_address())
            | (Gtxn[0].amount() != Btoi(total_b.load()))
            | ((status_b.load() != STATUS_ACCEPTED) & (status_b.load() != STATUS_CREATED))
        ).Then(Reject()),
        If(Gtxn[0].sender() != Txn.sender()).Then(Reject()),
        If(Txn.sender() != buyer.load()).Then(Reject()),
        BoxPut(
            meta_key(deal_id.load()),
            Concat(
                buyer.load(),
                seller.load(),
                total_b.load(),
                int8(STATUS_FUNDED),
                int8(count_b.load()),
                int8(released_b.load()),
            ),
        ),
        Approve(),
    )

    release_index = ScratchVar(TealType.uint64)
    milestone_val = ScratchVar(TealType.bytes)
    released_flag = ScratchVar(TealType.uint64)
    new_released = ScratchVar(TealType.uint64)
    milestone_get = BoxGet(milestone_key(deal_id.load(), release_index.load()))
    milestone_exists = ScratchVar(TealType.uint64)

    release = Seq(
        deal_id.store(Txn.application_args[1]),
        release_index.store(Btoi(Txn.application_args[2])),
        load_meta,
        If(
            (Txn.sender() != buyer.load())
            | (status_b.load() != STATUS_FUNDED)
            | (release_index.load() >= count_b.load())
            | (seller.load() == BytesZero(Int(32)))
        ).Then(Reject()),
        milestone_get,
        milestone_exists.store(milestone_get.hasValue()),
        If(milestone_exists.load() == Int(0)).Then(Reject()),
        milestone_val.store(milestone_get.value()),
        released_flag.store(Btoi(Extract(milestone_val.load(), Int(8), Int(1)))),
        If(released_flag.load() != Int(0)).Then(Reject()),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.receiver: seller.load(),
                TxnField.amount: Btoi(Extract(milestone_val.load(), Int(0), Int(8))),
            }
        ),
        InnerTxnBuilder.Submit(),
        BoxPut(
            milestone_key(deal_id.load(), release_index.load()),
            Concat(Extract(milestone_val.load(), Int(0), Int(8)), int8(Int(1))),
        ),
        new_released.store(released_b.load() + Int(1)),
        BoxPut(
            meta_key(deal_id.load()),
            Concat(
                buyer.load(),
                seller.load(),
                total_b.load(),
                int8(If(new_released.load() == count_b.load(), STATUS_CLOSED, STATUS_FUNDED)),
                int8(count_b.load()),
                int8(new_released.load()),
            ),
        ),
        Approve(),
    )

    on_call = Seq(
        If(Txn.application_args.length() == Int(0)).Then(Reject()),
        If(Txn.application_args[0] == Bytes("create")).Then(create_deal),
        If(Txn.application_args[0] == Bytes("accept")).Then(accept),
        If(Txn.application_args[0] == Bytes("deposit")).Then(deposit),
        If(Txn.application_args[0] == Bytes("release")).Then(release),
        Reject(),
    )

    program = Seq(
        If(Txn.application_id() == Int(0)).Then(Approve()),
        If(Txn.on_completion() == OnComplete.OptIn).Then(Approve()),
        If(Txn.on_completion() == OnComplete.CloseOut).Then(Approve()),
        If(Txn.on_completion() == OnComplete.DeleteApplication).Then(Return(is_creator())),
        If(Txn.on_completion() == OnComplete.UpdateApplication).Then(Return(is_creator())),
        If(Txn.on_completion() == OnComplete.NoOp).Then(on_call),
        Reject(),
    )

    return program


def clear_program() -> str:
    return Approve()


def compile_teal() -> tuple[str, str]:
    from pyteal import compileTeal

    approval = compileTeal(approval_program(), mode=Mode.Application, version=8)
    clear = compileTeal(clear_program(), mode=Mode.Application, version=8)
    return approval, clear
