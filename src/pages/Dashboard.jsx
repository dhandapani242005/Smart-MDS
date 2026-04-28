import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase/firebase';
import useDeviceStatus from '../hooks/useDeviceStatus';
import BoxCard from '../components/BoxCard';
import StatusCard from '../components/StatusCard';
import { MdAccessTimeFilled, MdOutlineHistory, MdEventNote } from 'react-icons/md';
import { FaPills } from 'react-icons/fa';

const Dashboard = () => {
    const [inventory, setInventory] = useState({});
    const [device, setDevice] = useState({});
    const [schedules, setSchedules] = useState({});
    const [events, setEvents] = useState({});
    const [status, setStatus] = useState({});
    const [loading, setLoading] = useState(true);
    const { isOnline, lastSeen } = useDeviceStatus();

    useEffect(() => {
        const refs = [
            { path: 'inventory', setter: setInventory },
            { path: 'device', setter: setDevice },
            { path: 'schedule_runtime', setter: setSchedules },
            { path: 'events', setter: setEvents },
            { path: 'status', setter: setStatus },
        ];

        let loaded = 0;
        const unsubscribes = refs.map(({ path, setter }) => {
            const dbRef = ref(database, path);
            return onValue(dbRef, (snapshot) => {
                setter(snapshot.val() || {});
                loaded++;
                if (loaded >= refs.length) setLoading(false);
            }, (error) => {
                console.error(`Firebase error reading ${path}:`, error);
                loaded++;
                if (loaded >= refs.length) setLoading(false);
            });
        });

        return () => unsubscribes.forEach((unsub) => unsub());
    }, []);

    // inventory values can be plain numbers (e.g. box1: 99) or objects ({count: 99, name: "..."})
    const boxes = [1, 2, 3, 4].map((num) => {
        const raw = inventory[`box${num}`];
        if (typeof raw === 'number') {
            return { number: num, count: raw, name: '' };
        }
        if (typeof raw === 'object' && raw !== null) {
            return { number: num, count: raw.count || 0, name: raw.name || '' };
        }
        return { number: num, count: 0, name: '' };
    });

    // Convert "HH:MM" 24hr to 12hr format
    const formatTo12Hr = (timeStr) => {
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
    };

    const getLastEvent = () => {
        if (events.message) return events.message;
        if (events.lastEvent) return events.lastEvent;
        return 'No data';
    };

    const getNextDoseTime = () => {
        const schedArr = Object.values(schedules);
        if (schedArr.length === 0) return 'No schedules';
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const times = schedArr
            .filter((s) => s.active !== false)
            .map((s) => {
                if (!s.time) return null;
                const [h, m] = s.time.split(':').map(Number);
                return { time: s.time, minutes: h * 60 + m };
            })
            .filter(Boolean)
            .sort((a, b) => a.minutes - b.minutes);

        const next = times.find((t) => t.minutes > currentMinutes);
        if (next) return formatTo12Hr(next.time);
        if (times.length > 0) return formatTo12Hr(times[0].time) + ' (tomorrow)';
        return 'No schedules';
    };

    const getLastSeen = () => {
        if (lastSeen) {
            return new Date(lastSeen).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });
        }
        return 'Unknown';
    };

    const getSystemState = () => {
        return status.systemState || 'Unknown';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Real-time overview of your medication dispenser system</p>
            </div>

            {/* Status Cards Row */}
            <div className="status-cards-row">
                <StatusCard
                    icon={<MdEventNote />}
                    label="Last Event"
                    value={getLastEvent()}
                    color="green"
                />
                <StatusCard
                    icon={<MdAccessTimeFilled />}
                    label="Next Dose"
                    value={getNextDoseTime()}
                    color="blue"
                />
                <StatusCard
                    icon={<MdOutlineHistory />}
                    label="Last Seen"
                    value={getLastSeen()}
                    color={isOnline ? 'green' : 'orange'}
                />
            </div>

            {/* Medicine Boxes */}
            <h3 className="section-title">
                <FaPills /> Medicine Boxes
            </h3>
            <div className="box-grid">
                {boxes.map((box) => (
                    <BoxCard
                        key={box.number}
                        boxNumber={box.number}
                        count={box.count}
                        name={box.name}
                    />
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
