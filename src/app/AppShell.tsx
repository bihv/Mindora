import "./AppShell.css";
import { RecentFilesLauncher } from "../features/editor/components/RecentFilesLauncher";
import { EditorWorkspace } from "../features/editor/components/EditorWorkspace";
import { useMindMapAppModel } from "../features/editor/view-models/useMindMapAppModel";

export function AppShell() {
  const model = useMindMapAppModel();

  if (model.startupScreen) {
    return <RecentFilesLauncher {...model.startupScreen} />;
  }

  return <EditorWorkspace workspace={model.workspace} />;
}
