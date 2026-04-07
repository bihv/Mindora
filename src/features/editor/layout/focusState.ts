import type { ConnectorFocusState, NodeFocusState } from "../types";

export function getConnectorFocusState(
  parentFocusState: NodeFocusState,
  childFocusState: NodeFocusState,
): ConnectorFocusState {
  if (
    (childFocusState === "selected" || childFocusState === "lineage") &&
    (parentFocusState === "selected" || parentFocusState === "lineage")
  ) {
    return "lineage";
  }

  if (
    (childFocusState === "descendant" || childFocusState === "selected") &&
    (parentFocusState === "descendant" || parentFocusState === "selected")
  ) {
    return "descendant";
  }

  return "dimmed";
}
