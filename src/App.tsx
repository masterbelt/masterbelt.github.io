import { SiteFrame } from "./components/SiteFrame";
import { getMarkdown, getSelectedSpec } from "./data/specs";
import { HomePage } from "./pages/HomePage";
import { SpecPage } from "./pages/SpecPage";

function App({ pathname }: { pathname: string }) {
  const selectedSpec = getSelectedSpec(pathname);
  const selectedMarkdown = getMarkdown(selectedSpec);

  return (
    <SiteFrame>
      {selectedSpec ? <SpecPage spec={selectedSpec} markdown={selectedMarkdown ?? ""} /> : <HomePage />}
    </SiteFrame>
  );
}

export default App;
