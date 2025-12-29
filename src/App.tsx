import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/home/home';
import Docs from './pages/introductions/terms_docs/docs'; // 共用layout
import Features from './pages/introductions/features/features';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/features" element={<Features />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;