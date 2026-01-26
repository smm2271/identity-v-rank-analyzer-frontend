import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/home/home';
import Docs from './pages/introductions/terms_docs/docs'; // 共用layout
import Features from './pages/introductions/features/features';
import Signin from './pages/signin/signin';
import About from './pages/introductions/about/about';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/features" element={<Features />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;