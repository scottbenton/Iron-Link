import { useCallback } from "react";

import {
  DataswornOracleTree,
  DataswornOracleTreeProps,
  RenderOracleRow,
} from "components/datasworn/DataswornTree";

import { ReferenceOracleRow } from "./ReferenceOracleRow";

export interface ReferenceOracleTreeProps
  extends Omit<DataswornOracleTreeProps, "renderOracle" | "rollOracle"> {
  // Rolls an oracle from its row or the Ask the Oracle buttons.
  rollOracle: (oracleId: string) => void;
}

// The reference's list of oracles, every oracle a link to its page with a
// quick roll.
export function ReferenceOracleTree(props: ReferenceOracleTreeProps) {
  const { rollOracle } = props;
  const renderOracle = useCallback<RenderOracleRow>(
    (oracle, state) => (
      <ReferenceOracleRow {...oracle} {...state} rollOracle={rollOracle} />
    ),
    [rollOracle],
  );
  return <DataswornOracleTree {...props} renderOracle={renderOracle} />;
}
