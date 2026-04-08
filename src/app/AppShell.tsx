import "./AppShell.css";
import { AiGenerationDialog } from "../features/ai/AiGenerationDialog";
import { RecentFilesLauncher } from "../features/editor/components/RecentFilesLauncher";
import { EditorWorkspace } from "../features/editor/components/EditorWorkspace";
import { useMindMapAppModel } from "../features/editor/view-models/useMindMapAppModel";

export function AppShell() {
  const model = useMindMapAppModel();

  if (model.startupScreen) {
    return (
      <>
        <RecentFilesLauncher {...model.startupScreen} />
        {model.aiDialog.isAvailable ? <AiGenerationDialog {...model.aiDialog} /> : null}
      </>
    );
  }

  return (
    <>
      <EditorWorkspace workspace={model.workspace} />
      {model.aiDialog.isAvailable ? <AiGenerationDialog {...model.aiDialog} /> : null}
    </>
  );
}
