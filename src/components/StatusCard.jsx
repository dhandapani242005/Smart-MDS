import React from 'react';

const StatusCard = ({ icon, label, value, color = 'blue' }) => {
    return (
        <div className="card card-elevated status-card">
            <div className={`status-card-icon ${color}`}>
                {icon}
            </div>
            <div className="status-card-info">
                <h4>{label}</h4>
                <p>{value || '—'}</p>
            </div>
        </div>
    );
};

export default StatusCard;
