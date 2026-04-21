import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    FaPills,
    FaClipboardList,
    FaUserMd,
} from 'react-icons/fa';
import {
    MdDashboard,
    MdSchedule,
    MdMemory,
    MdChevronLeft,
    MdChevronRight,
} from 'react-icons/md';
import { HiOutlineChip } from 'react-icons/hi';

const navItems = [
    { to: '/',        icon: <MdDashboard />,    label: 'Dashboard'          },
    { to: '/schedule',icon: <MdSchedule />,     label: 'Schedule'           },
    { to: '/inventory',icon: <FaPills />,       label: 'Inventory'          },
    { to: '/logs',    icon: <FaClipboardList />, label: 'Logs'              },
    { to: '/doctors', icon: <FaUserMd />,        label: 'Doctors / Caretakers' },
    { to: '/device',  icon: <MdMemory />,        label: 'Device Config'     },
];

const Sidebar = ({ mobileOpen, onMobileClose }) => {
    const [collapsed, setCollapsed] = useState(false);

    const toggleCollapse = () => setCollapsed(v => !v);

    return (
        <>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="sidebar-overlay" onClick={onMobileClose} />
            )}

            <aside
                className={[
                    'sidebar',
                    collapsed   ? 'sidebar-collapsed' : '',
                    mobileOpen  ? 'sidebar-mobile-open' : '',
                ].filter(Boolean).join(' ')}
            >
                {/* ── Logo ── */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <HiOutlineChip />
                    </div>
                    <div className="sidebar-logo-text">
                        <h2>Smart MDS</h2>
                        <span>Medication Dispenser</span>
                    </div>
                </div>

                {/* ── Nav ── */}
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'active' : ''}`
                            }
                            onClick={onMobileClose}
                            title={collapsed ? item.label : ''}
                        >
                            <span className="sidebar-link-icon">{item.icon}</span>
                            <span className="sidebar-link-label">{item.label}</span>
                            {collapsed && (
                                <span className="sidebar-tooltip">{item.label}</span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* ── Footer / Collapse Toggle ── */}
                <div className="sidebar-footer">
                    <span className="sidebar-footer-version">Smart MDS v1.0</span>

                    <button
                        className="sidebar-collapse-btn"
                        onClick={toggleCollapse}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <MdChevronRight /> : <MdChevronLeft />}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
