import { FileBrowser } from "../_component/file-browser";

export default function TrashPage() {
  return (
    <div>
      <FileBrowser title="Deleted Files" deleted />
    </div>
  );
}
