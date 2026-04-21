import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase/firebase';
import useDeviceStatus from '../hooks/useDeviceStatus';
import { FaMicrochip, FaWifi, FaClock, FaServer, FaCode, FaSyringe, FaVolumeUp } from 'react-icons/fa';
import { MdDevices, MdSettingsInputComposite } from 'react-icons/md';

const DeviceConfig = () => {
    const [device, setDevice] = useState({});
    const [status, setStatus] = useState({});
    const [loading, setLoading] = useState(true);
    const { isOnline, lastSeen } = useDeviceStatus();

    useEffect(() => {
        const paths = [
            { path: 'device', setter: setDevice },
            { path: 'status', setter: setStatus },
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

    const formatDate = (timestamp) => {
        if (!timestamp || timestamp === 0) return 'Unknown';
        const ts = timestamp > 9999999999 ? timestamp : timestamp * 1000;
        return new Date(ts).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p>Loading device info...</p>
            </div>
        );
    }

    const deviceInfo = [
        {
            label: 'Device Name',
            value: device.deviceName || 'Smart MDS',
            icon: <FaServer />,
        },
        {
            label: 'Device Status',
            value: isOnline ? 'Online' : 'Offline',
            icon: <FaWifi />,
            isStatus: true,
        },
        {
            label: 'Firmware Version',
            value: device.firmware || 'N/A',
            icon: <FaCode />,
        },
        {
            label: 'System State',
            value: status.systemState || 'Unknown',
            icon: <MdSettingsInputComposite />,
        },
        {
            label: 'Dispensing',
            value: status.dispensing ? 'Yes' : 'No',
            icon: <FaSyringe />,
        },
        {
            label: 'Buzzer Active',
            value: status.buzzerActive ? 'Yes' : 'No',
            icon: <FaVolumeUp />,
        },
        {
            label: 'Last Seen',
            value: formatDate(lastSeen),
            icon: <FaClock />,
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h1>Device Configuration</h1>
                <p>ESP8266 device information and status</p>
            </div>

            <div className="card device-config-card">
                {deviceInfo.map((info, idx) => (
                    <div className="device-info-row" key={idx}>
                        <div className="device-info-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {info.icon}
                            {info.label}
                        </div>
                        <div className="device-info-value">
                            {info.isStatus ? (
                                <span
                                    className={`device-status ${isOnline ? '' : 'offline'}`}
                                    style={{ fontSize: '0.85rem' }}
                                >
                                    <span className="status-dot" />
                                    {info.value}
                                </span>
                            ) : (
                                info.value
                            )}
                        </div>
                    </div>
                ))}

                {/* ESP8266 Illustration Placeholder */}
                <div className="device-illustration">
                    <FaMicrochip />
                </div>
            </div>
        </div>
    );
};

export default DeviceConfig;
