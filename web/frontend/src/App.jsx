import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { createGlobalStyle } from "styled-components";
import CoCreation from "./pages/CoCreation.jsx";
import IdentitySetup from "./components/IdentitySetup.jsx";
import SharedContextSetupPage from "./pages/SharedContextSetup.jsx";
import FinalShowcasePage from "./pages/FinalShowcase.jsx";

const GlobalStyle = createGlobalStyle`
  :root {
    --primary-color: #6366f1;
    --primary-hover: #4f46e5;
    --secondary-color: #64748b;
    --background-color: #f8fafc;
    --surface-color: #ffffff;
    --border-color: #e2e8f0;
    --text-color: #0f172a;
    --text-color-muted: #64748b;
    --success-color: #10b981;
    --error-color: #ef4444;
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  }

  body {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--background-color);
    color: var(--text-color);
    line-height: 1.5;
  }

  * {
    box-sizing: border-box;
  }
`;

export default function App() {
  return (
    <>
      <GlobalStyle />
      <Router>
        <Routes>
          <Route path="/" element={<IdentitySetup />} />
          <Route path="/shared-context" element={<SharedContextSetupPage />} />
          <Route path="/cocreation" element={<CoCreation />} />
          <Route path="/showcase" element={<FinalShowcasePage />} />
        </Routes>
      </Router>
    </>
  );
}
