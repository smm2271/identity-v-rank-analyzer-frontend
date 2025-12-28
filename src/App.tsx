import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/home/home';
import Disclaimer from './pages/introductions/docs/disclaimer/disclaimer';
import Privacy from './pages/introductions/docs/privacy/privacy';
import Terms from './pages/introductions/docs/terms/terms';
import Features from './pages/introductions/features/features';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/features" element={<Features />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;