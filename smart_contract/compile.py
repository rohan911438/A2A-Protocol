from __future__ import annotations

import os
import sys

# Allow running as `python smart_contract/compile.py`
CURRENT_DIR = os.path.dirname(__file__)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from escrow_contract import compile_teal


def main() -> None:
    approval, clear = compile_teal()
    build_dir = os.path.join(os.path.dirname(__file__), "build")
    os.makedirs(build_dir, exist_ok=True)

    with open(os.path.join(build_dir, "approval.teal"), "w", encoding="utf-8") as f:
        f.write(approval)

    with open(os.path.join(build_dir, "clear.teal"), "w", encoding="utf-8") as f:
        f.write(clear)

    print("TEAL files written to smart_contract/build/")


if __name__ == "__main__":
    main()


# Deployed app ID: 758126516
# App address: JUSRQVITC54J3NTYZXEPLXNC6RLKYSWGPCIIVJQ2SLJJRN2Y2FQBA5IK4A