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
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen((prev) => !prev);
    const closeSidebar = () => setSidebarOpen(false);

    return (
        <Router>
            <div className="app-layout">
                <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
                <div className="main-wrapper">
                    <Header onMenuToggle={toggleSidebar} />
                    <main className="main-content">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/schedule" element={<Schedule />} />
                            <Route path="/inventory" element={<Inventory />} />
                            <Route path="/logs" element={<Logs />} />
                            <Route path="/doctors" element={<Doctors />} />
                            <Route path="/device" element={<DeviceConfig />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </Router>
    );
};

export default App;
