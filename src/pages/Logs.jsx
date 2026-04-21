import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase/firebase';
import {
    FaClipboardList, FaFilter, FaSearch,
    FaPills, FaUserMd, FaTrashAlt,
} from 'react-icons/fa';
import {
    MdSchedule, MdAdd, MdEdit, MdDelete,
    MdPowerSettingsNew, MdTune, MdInventory2,
    MdDevices, MdEventNote, MdCircle,
    MdCheckCircle, MdWarning, MdInfo,
    MdKeyboardArrowDown,
} from 'react-icons/md';

/* ─────────────────────────────────────────────
   Type / Action metadata
───────────────────────────────────────────── */
const TYPE_META = {
    schedule: {
        label: 'Schedule',
        icon: <MdSchedule />,
        color: '#3b82f6',
        bg: '#eff6ff',
        border: '#bfdbfe',
    },
    inventory: {
        label: 'Inventory',
        icon: <FaPills />,
        color: '#10b981',
        bg: '#ecfdf5',
        border: '#a7f3d0',
    },
    device: {
        label: 'Device',
        icon: <MdDevices />,
        color: '#8b5cf6',
        bg: '#f5f3ff',
        border: '#ddd6fe',
    },
    status: {
        label: 'System',
        icon: <MdTune />,
        color: '#06b6d4',
        bg: '#ecfeff',
        border: '#a5f3fc',
    },
    event: {
        label: 'Event',
        icon: <MdEventNote />,
        color: '#f59e0b',
        bg: '#fffbeb',
        border: '#fde68a',
    },
    history: {
        label: 'History',
        icon: <FaClipboardList />,
        color: '#64748b',
        bg: '#f8fafc',
        border: '#e2e8f0',
    },
};

const ACTION_META = {
    Add:        { label: 'Added',      color: '#059669', bg: '#d1fae5', icon: <MdAdd /> },
    Update:     { label: 'Updated',    color: '#2563eb', bg: '#dbeafe', icon: <MdEdit /> },
    Delete:     { label: 'Deleted',    color: '#dc2626', bg: '#fee2e2', icon: <MdDelete /> },
    Activate:   { label: 'Activated',  color: '#059669', bg: '#d1fae5', icon: <MdCheckCircle /> },
    Deactivate: { label: 'Deactivated',color: '#d97706', bg: '#fef3c7', icon: <MdWarning /> },
    Reduce:     { label: 'Reduced',    color: '#dc2626', bg: '#fee2e2', icon: <MdKeyboardArrowDown /> },
};

const ALL_TYPES = ['all', 'schedule', 'inventory', 'device', 'status', 'event'];

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const normaliseTs = (ts) => {
    if (!ts || ts === 0) return null;
    return ts > 9999999999 ? ts : ts * 1000;
};

const formatDate = (ts) => {
    if (!ts) return '—';
    const d = new Date(normaliseTs(ts));
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(normaliseTs(ts));
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
};

const timeAgo = (ts) => {
    if (!ts) return '';
    const ms = Date.now() - normaliseTs(ts);
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
const Logs = () => {
    const [events,  setEvents]  = useState({});
    const [status,  setStatus]  = useState({});
    const [device,  setDevice]  = useState({});
    const [history, setHistory] = useState({});
    const [loading, setLoading] = useState(true);

    const [filterType,   setFilterType]   = useState('all');
    const [searchQuery,  setSearchQuery]  = useState('');

    useEffect(() => {
        const paths = [
            { path: 'events',  setter: setEvents  },
            { path: 'status',  setter: setStatus  },
            { path: 'device',  setter: setDevice  },
            { path: 'logs',    setter: setHistory },
        ];
        let loaded = 0;
        const unsubs = paths.map(({ path, setter }) =>
            onValue(ref(database, path), (snap) => {
                setter(snap.val() || {});
                if (++loaded >= paths.length) setLoading(false);
            }, () => { if (++loaded >= paths.length) setLoading(false); })
        );
        return () => unsubs.forEach(u => u());
    }, []);

    const allEntries = useMemo(() => {
        const entries = [];

        Object.entries(history).forEach(([key, log]) => {
            entries.push({
                key:       `hist-${key}`,
                message:   log.message   || '',
                detail:    log.detail    || '',
                timestamp: log.timestamp || 0,
                type:      log.type      || 'history',
                action:    log.action    || '',
            });
        });

        if (events.lastEvent) {
            const dup = entries.some(e =>
                Math.abs((e.timestamp || 0) - (events.timestamp || 0)) < 5000 &&
                e.message === (events.message || events.lastEvent)
            );
            if (!dup) {
                entries.push({
                    key:       'event-last',
                    message:   events.message || events.lastEvent,
                    detail:    `Event: ${events.lastEvent}` +
                               (events.lastBox ? ` · Box ${events.lastBox}` : ''),
                    timestamp: events.timestamp || 0,
                    type:      'event',
                    action:    '',
                });
            }
        }

        if (device.online !== undefined) {
            entries.push({
                key:       'device-status',
                message:   `Device is ${device.online ? 'Online' : 'Offline'}`,
                detail:    `${device.deviceName || 'SmartMDS'} · Firmware ${device.firmware || 'N/A'}`,
                timestamp: device.lastSeen || 0,
                type:      'device',
                action:    '',
            });
        }

        if (status.systemState) {
            entries.push({
                key:       'system-state',
                message:   `System State: ${status.systemState}`,
                detail:    `Dispensing: ${status.dispensing ? 'Yes' : 'No'} · ` +
                           `Box: ${status.currentBox || 0} · Buzzer: ${status.buzzerActive ? 'On' : 'Off'}`,
                timestamp: device.lastSeen || 0,
                type:      'status',
                action:    '',
            });
        }

        return entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }, [history, events, device, status]);

    /* Counts per type */
    const typeCounts = useMemo(() => {
        const c = { all: allEntries.length };
        allEntries.forEach(e => { c[e.type] = (c[e.type] || 0) + 1; });
        return c;
    }, [allEntries]);

    /* Filtered + searched */
    const visibleEntries = useMemo(() => {
        return allEntries.filter(e => {
            const typeOk  = filterType === 'all' || e.type === filterType;
            const query   = searchQuery.toLowerCase();
            const searchOk = !query ||
                (e.message || '').toLowerCase().includes(query) ||
                (e.detail  || '').toLowerCase().includes(query);
            return typeOk && searchOk;
        });
    }, [allEntries, filterType, searchQuery]);

    /* Group by date */
    const grouped = useMemo(() => {
        const map = {};
        visibleEntries.forEach(e => {
            const dk = formatDate(e.timestamp);
            if (!map[dk]) map[dk] = [];
            map[dk].push(e);
        });
        return Object.entries(map);
    }, [visibleEntries]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p>Loading logs…</p>
            </div>
        );
    }

    return (
        <div>
            {/* ── Page Header ── */}
            <div className="page-header">
                <h1>Activity Logs</h1>
                <p>Full audit trail of device events and system actions</p>
            </div>

            {/* ── Summary Stat Strip ── */}
            <div className="log-stat-strip">
                {ALL_TYPES.map(t => {
                    const meta = t === 'all'
                        ? { label: 'Total', color: '#0f1a35', bg: '#e2e8f4', icon: <FaClipboardList /> }
                        : TYPE_META[t];
                    const count = typeCounts[t] || 0;
                    return (
                        <button
                            key={t}
                            className={`log-stat-btn ${filterType === t ? 'active' : ''}`}
                            style={{
                                '--stat-color': meta?.color,
                                '--stat-bg': meta?.bg,
                            }}
                            onClick={() => setFilterType(t)}
                        >
                            <span className="log-stat-icon">{meta?.icon}</span>
                            <span className="log-stat-label">{meta?.label}</span>
                            <span className="log-stat-count">{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* ── Search Bar ── */}
            <div className="log-search-bar">
                <span className="log-search-icon"><FaSearch /></span>
                <input
                    type="text"
                    className="log-search-input"
                    placeholder="Search logs by message or detail…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button
                        className="log-search-clear"
                        onClick={() => setSearchQuery('')}
                        title="Clear"
                    >×</button>
                )}
            </div>

            {/* ── Log Table ── */}
            {visibleEntries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><FaClipboardList /></div>
                    <h3>No Logs Found</h3>
                    <p>{searchQuery ? 'No results match your search.' : 'Activity logs will appear here when the device starts operating.'}</p>
                </div>
            ) : (
                <div className="log-table-wrap">
                    {/* Header row */}
                    <div className="log-table-header">
                        <span className="log-col-type">Type</span>
                        <span className="log-col-action">Action</span>
                        <span className="log-col-message">Message</span>
                        <span className="log-col-detail">Detail</span>
                        <span className="log-col-time">Timestamp</span>
                    </div>

                    {/* Date-grouped rows */}
                    {grouped.map(([dateLabel, entries]) => (
                        <div key={dateLabel} className="log-date-group">
                            <div className="log-date-divider">
                                <span className="log-date-label">{dateLabel}</span>
                            </div>
                            {entries.map((entry, idx) => {
                                const tm   = TYPE_META[entry.type]   || TYPE_META.history;
                                const am   = ACTION_META[entry.action];
                                return (
                                    <div
                                        key={entry.key}
                                        className="log-row"
                                        style={{ '--row-accent': tm.color }}
                                    >
                                        {/* Type badge */}
                                        <span className="log-col-type">
                                            <span
                                                className="log-type-badge"
                                                style={{ color: tm.color }}
                                            >
                                                {tm.icon}
                                                {tm.label}
                                            </span>
                                        </span>

                                        {/* Action badge */}
                                        <span className="log-col-action">
                                            {am ? (
                                                <span
                                                    className="log-action-badge"
                                                    style={{ color: am.color }}
                                                >
                                                    {am.icon}
                                                    {am.label}
                                                </span>
                                            ) : (
                                                <span className="log-action-none">—</span>
                                            )}
                                        </span>

                                        {/* Message */}
                                        <span className="log-col-message">
                                            <span className="log-message-text">{entry.message || '—'}</span>
                                        </span>

                                        {/* Detail */}
                                        <span className="log-col-detail">
                                            {entry.detail
                                                ? <span className="log-detail-text">{entry.detail}</span>
                                                : <span className="log-action-none">—</span>
                                            }
                                        </span>

                                        {/* Timestamp */}
                                        <span className="log-col-time">
                                            <span className="log-time-main">{formatTime(entry.timestamp)}</span>
                                            <span className="log-time-ago">{timeAgo(entry.timestamp)}</span>
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    <div className="log-footer">
                        Showing <strong>{visibleEntries.length}</strong> of <strong>{allEntries.length}</strong> log entries
                    </div>
                </div>
            )}
        </div>
    );
};

export default Logs;
