import React from 'react';
import { FaTrashAlt } from 'react-icons/fa';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ScheduleCard = ({ schedule, onDelete }) => {
    const { time, days = [], boxes = [] } = schedule;

    return (
        <div className="card schedule-card">
            <div className="schedule-card-left">
                <div className="schedule-time">{time}</div>
                <div className="schedule-days">
                    {DAYS.map((day) => (
                        <span
                            key={day}
                            className={`schedule-day ${days.includes(day) ? 'active' : 'inactive'
                                }`}
                        >
                            {day.charAt(0)}
                        </span>
                    ))}
                </div>
                <div className="schedule-boxes">
                    {boxes.map((box) => (
                        <span key={box} className="schedule-box-tag">
                            Box {box}
                        </span>
                    ))}
                </div>
            </div>
            {onDelete && (
                <button className="schedule-delete-btn" onClick={onDelete}>
                    <FaTrashAlt />
                </button>
            )}
        </div>
    );
};

export default ScheduleCard;
