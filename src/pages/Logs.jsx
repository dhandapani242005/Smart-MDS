import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase/firebase';
import { FaClipboardList, FaInfoCircle } from 'react-icons/fa';
import { MdDevices } from 'react-icons/md';

const Logs = () => {
    const [events, setEvents] = useState({});
    const [status, setStatus] = useState({});
    const [device, setDevice] = useState({});
    const [history, setHistory] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const paths = [
            { path: 'events', setter: setEvents },
            { path: 'status', setter: setStatus },
            { path: 'device', setter: setDevice },
            { path: 'logs', setter: setHistory },
        ];

        let loaded = 0;
        const unsubscribes = paths.map(({ path, setter }) => {
            const dbRef = ref(database, path);
            return onValue(dbRef, (snapshot) => {
                setter(snapshot.val() || {});
                loaded++;
                if (loaded >= paths.length) setLoading(false);
            }, (error) => {
                console.error(`Firebase error reading ${path}:`, error);
                loaded++;
                if (loaded >= paths.length) setLoading(false);
            });
        });

        return () => unsubscribes.forEach((unsub) => unsub());
    }, []);

    const formatTime = (timestamp) => {
        if (!timestamp || timestamp === 0) return 'N/A';
        const ts = timestamp > 9999999999 ? timestamp : timestamp * 1000;
        const d = new Date(ts);
        return d.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    // Build log entries from the flat events/status/device/history data
    const buildLogEntries = () => {
        const entries = [];

        // Add persistent history logs
        Object.entries(history).forEach(([key, log]) => {
            entries.push({
                key: `history-${key}`,
                message: log.message,
                detail: log.detail,
                timestamp: log.timestamp,
                type: log.type || 'history',
                action: log.action
            });
        });

        // Add last event if not already in history (for backward compatibility/legacy flow)
        if (events.lastEvent) {
            const alreadyLogged = entries.some(e =>
                Math.abs(e.timestamp - events.timestamp) < 5000 && e.message === (events.message || events.lastEvent)
            );

            if (!alreadyLogged) {
                entries.push({
                    key: 'event-last',
                    message: events.message || events.lastEvent,
                    detail: `Event: ${events.lastEvent}` + (events.lastBox ? ` | Box: ${events.lastBox}` : ''),
                    timestamp: events.timestamp,
                    type: 'event',
                });
            }
        }

        if (device.online !== undefined) {
            entries.push({
                key: 'device-status',
                message: `Device is ${device.online ? 'Online' : 'Offline'}`,
                detail: `Device: ${device.deviceName || 'SmartMDS'} | Firmware: ${device.firmware || 'N/A'}`,
                timestamp: device.lastSeen,
                type: 'device',
            });
        }

        if (status.systemState) {
            entries.push({
                key: 'system-state',
                message: `System State: ${status.systemState}`,
                detail: `Dispensing: ${status.dispensing ? 'Yes' : 'No'} | Current Box: ${status.currentBox || 0} | Buzzer: ${status.buzzerActive ? 'On' : 'Off'}`,
                timestamp: device.lastSeen, // status doesn't have its own timestamp usually
                type: 'status',
            });
        }

        return entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    };

    const logEntries = buildLogEntries();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p>Loading logs...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1>Activity Logs</h1>
                <p>Current device events and system status</p>
            </div>

            {logEntries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <FaClipboardList />
                    </div>
                    <h3>No Logs Yet</h3>
                    <p>Activity logs will appear here when the device starts operating.</p>
                </div>
            ) : (
                <div className="timeline">
                    {logEntries.map((entry) => (
                        <div key={entry.key} className="timeline-item">
                            <div className="timeline-dot">
                                <div className="timeline-dot-inner" />
                            </div>
                            <div className="timeline-content">
                                <div className="timeline-time">
                                    {formatTime(entry.timestamp)}
                                </div>
                                <div className="timeline-message">
                                    {entry.message}
                                </div>
                                {entry.detail && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                        {entry.detail}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Logs;
