import * as React from "react";
import * as ReactDOM from "react-dom/client";
import "./ui.css";
import BottomSection from "./components/ui/BottomSection";

declare function require(path: string): any;

function App() {
  return (
    <main>
      {/* Footer section with credits and mode toggle */}
      <BottomSection />
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("react-page")).render(<App />);
