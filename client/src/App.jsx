import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { ConnectionProvider } from './context/ConnectionContext.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { JoinQueuePage } from './pages/JoinQueuePage.jsx';
import { MyStatusPage } from './pages/MyStatusPage.jsx';
import { ReceptionPage } from './pages/ReceptionPage.jsx';
import { BarberPage } from './pages/BarberPage.jsx';
import { DisplayPage } from './pages/DisplayPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

export function App() {
  return (
    <LanguageProvider>
      <ConnectionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/join" element={<JoinQueuePage />} />
            <Route path="/status/:id" element={<MyStatusPage />} />
            <Route path="/reception" element={<ReceptionPage />} />
            <Route path="/barber" element={<BarberPage />} />
            <Route path="/barber/:name" element={<BarberPage />} />
            <Route path="/display" element={<DisplayPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ConnectionProvider>
    </LanguageProvider>
  );
}

export default App;
