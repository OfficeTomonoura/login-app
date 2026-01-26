'use client';

import React, { useState, useRef } from 'react';
import styles from './DatePicker.module.css';

type DatePickerProps = {
    label?: string;
    value: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    required?: boolean;
};

export default function DatePicker({
    label,
    value,
    onChange,
    required = false,
}: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date()); // The month being viewed
    const [viewMode, setViewMode] = useState<'days' | 'years'>('days');
    const modalRef = useRef<HTMLDivElement>(null);

    // Initial value processing
    const [prevValue, setPrevValue] = useState(value);
    if (value !== prevValue) {
        setPrevValue(value);
        if (value) {
            setViewDate(new Date(value));
        }
    }

    // Calendar generation logic
    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth();

    const generateDays = () => {
        const days = [];
        const prevMonthDays = daysInMonth(currentYear, currentMonth - 1);
        const firstDay = firstDayOfMonth(currentYear, currentMonth);

        // Fill previous month gaps
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({
                day: prevMonthDays - i,
                month: currentMonth - 1,
                year: currentYear,
                type: 'prev',
            });
        }

        // Current month days
        const count = daysInMonth(currentYear, currentMonth);
        for (let i = 1; i <= count; i++) {
            days.push({
                day: i,
                month: currentMonth,
                year: currentYear,
                type: 'current',
            });
        }

        // Fill next month gaps
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({
                day: i,
                month: currentMonth + 1,
                year: currentYear,
                type: 'next',
            });
        }

        return days;
    };

    const handleDateSelect = (year: number, month: number, day: number) => {
        const d = new Date(year, month, day);
        // Correct for timezone offset to ensure YYYY-MM-DD string is correct
        const formatted = d.toLocaleDateString('sv-SE'); // YYYY-MM-DD
        onChange(formatted);
        setIsOpen(false);
    };

    const changeMonth = (offset: number) => {
        setViewDate(new Date(currentYear, currentMonth + offset, 1));
    };

    const toggleViewMode = () => {
        setViewMode(viewMode === 'days' ? 'years' : 'days');
    };

    const selectYear = (year: number) => {
        setViewDate(new Date(year, currentMonth, 1));
        setViewMode('days');
    };

    // Close on backdrop click (handled in the overlay div)
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setIsOpen(false);
        }
    };

    const years = [];
    const thisYear = new Date().getFullYear();
    for (let y = thisYear; y >= 1930; y--) {
        years.push(y);
    }

    return (
        <div className={styles.datePickerWrapper}>
            {label && (
                <label className={styles.label} style={{ fontSize: '0.875rem', fontWeight: 500, color: 'white', marginBottom: '0.5rem', display: 'block' }}>
                    {label}
                    {required && <span style={{ color: 'hsl(var(--error))', marginLeft: '0.25rem' }}>*</span>}
                </label>
            )}

            <div className={styles.inputField} onClick={() => setIsOpen(true)}>
                <span>{value || '生年月日を選択'}</span>
                <span className={styles.icon}>📅</span>
            </div>

            {isOpen && (
                <div className={styles.overlay} onClick={handleBackdropClick}>
                    <div className={styles.calendar} ref={modalRef}>
                        <div className={styles.header}>
                            <div className={styles.currentDate} onClick={toggleViewMode} style={{ cursor: 'pointer' }}>
                                {viewMode === 'days' ? (
                                    `${currentYear}年 ${currentMonth + 1}月`
                                ) : (
                                    '年を選択'
                                )}
                            </div>
                            <div className={styles.nav}>
                                {viewMode === 'days' && (
                                    <>
                                        <button className={styles.navBtn} onClick={() => changeMonth(-1)}>←</button>
                                        <button className={styles.navBtn} onClick={() => changeMonth(1)}>→</button>
                                    </>
                                )}
                                <button className={styles.navBtn} onClick={toggleViewMode}>
                                    {viewMode === 'days' ? '📅' : '🗓️'}
                                </button>
                            </div>
                        </div>

                        {viewMode === 'days' ? (
                            <div className={styles.daysGrid}>
                                {['日', '月', '火', '水', '木', '金', '土'].map(d => (
                                    <div key={d} className={styles.dayLabel}>{d}</div>
                                ))}
                                {generateDays().map((d, i) => {
                                    const dateStr = new Date(d.year, d.month, d.day).toLocaleDateString('sv-SE');
                                    const isSelected = dateStr === value;
                                    const isToday = dateStr === new Date().toLocaleDateString('sv-SE');

                                    return (
                                        <div
                                            key={i}
                                            className={`
                                                ${styles.day} 
                                                ${d.type !== 'current' ? styles.otherMonth : ''}
                                                ${isSelected ? styles.selected : ''}
                                                ${isToday ? styles.today : ''}
                                            `}
                                            onClick={() => handleDateSelect(d.year, d.month, d.day)}
                                        >
                                            {d.day}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={styles.yearSelector}>
                                {years.map(y => (
                                    <div
                                        key={y}
                                        className={`${styles.yearItem} ${y === currentYear ? styles.yearItemSelected : ''}`}
                                        onClick={() => selectYear(y)}
                                    >
                                        {y}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={styles.footer}>
                            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>閉じる</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
