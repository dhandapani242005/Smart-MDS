import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Inventory from './pages/Inventory';
import Logs from './pages/Logs';
import Doctors from './pages/Doctors';
import DeviceConfig from './pages/DeviceConfig';

const App = () => {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <Router>
            <div className="app-layout">
                <Sidebar
                    mobileOpen={mobileOpen}
                    onMobileClose={() => setMobileOpen(false)}
                />
                <div className="main-wrapper">
                    <Header onMenuToggle={() => setMobileOpen(v => !v)} />
                    <main className="main-content">
                        <Routes>
                            <Route path="/"         element={<Dashboard />} />
                            <Route path="/schedule" element={<Schedule />} />
                            <Route path="/inventory"element={<Inventory />} />
                            <Route path="/logs"     element={<Logs />} />
                            <Route path="/doctors"  element={<Doctors />} />
                            <Route path="/device"   element={<DeviceConfig />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </Router>
    );
};

export default App;

