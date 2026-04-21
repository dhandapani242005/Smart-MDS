import React, { useState, useEffect } from 'react';
import { MdMenu, MdOutlineWatchLater } from 'react-icons/md';
import useDeviceStatus from '../hooks/useDeviceStatus';

const Header = ({ onMenuToggle }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const { isOnline } = useDeviceStatus();

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <header className="header">
            <div className="header-left">
                <button className="header-menu-btn" onClick={onMenuToggle}>
                    <MdMenu />
                </button>
                <h1 className="header-title">Smart MDS</h1>
            </div>

            <div className="header-right">
                <div className="header-time">
                    <MdOutlineWatchLater />
                    <span>{formatDate(currentTime)}</span>
                    <span>{formatTime(currentTime)}</span>
                </div>
                <div className={`device-status ${isOnline ? '' : 'offline'}`}>
                    <span className="status-dot" />
                    {isOnline ? 'Online' : 'Offline'}
                </div>
            </div>
        </header>
    );
};

export default Header;
