import React from 'react';

const getColorClass = (count) => {
    if (count > 10) return 'green';
    if (count >= 5) return 'yellow';
    return 'red';
};

const BoxCard = ({ boxNumber, count = 0, name }) => {
    const colorClass = getColorClass(count);

    return (
        <div className={`card card-elevated box-card ${colorClass}`}>
            <div className="box-card-number">Box {boxNumber}</div>
            <div className="box-card-count">{count}</div>
            <div className="box-card-label">tablets</div>
            {name && <div className="box-card-name">{name}</div>}
        </div>
    );
};

export default BoxCard;
