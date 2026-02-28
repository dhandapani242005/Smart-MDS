import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    FaTachometerAlt,
    FaPills,
    FaClipboardList,
    FaUserMd,
    FaMicrochip,
} from 'react-icons/fa';
import { MdSchedule, MdClose } from 'react-icons/md';
import { HiOutlineChip } from 'react-icons/hi';

const navItems = [
    { to: '/', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { to: '/schedule', icon: <MdSchedule />, label: 'Schedule' },
    { to: '/inventory', icon: <FaPills />, label: 'Inventory' },
    { to: '/logs', icon: <FaClipboardList />, label: 'Logs' },
    { to: '/doctors', icon: <FaUserMd />, label: 'Doctors / Caretakers' },
    { to: '/device', icon: <FaMicrochip />, label: 'Device Config' },
];

const Sidebar = ({ isOpen, onClose }) => {
    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <HiOutlineChip />
                    </div>
                    <div>
                        <h2>Smart MDS</h2>
                        <span>Medication Dispenser</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'active' : ''}`
                            }
                            onClick={onClose}
                        >
                            <span className="sidebar-link-icon">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <p>Smart MDS v1.0</p>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
