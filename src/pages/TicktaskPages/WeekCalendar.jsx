import styles from "./WeekCalendar.module.css";

export default function WeekCalendar() {
  const weekDays = [
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
    "Sonntag",
  ];
  const hours = Array.from({ length: 17 }, (_, i) => i + 6);

  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  return (
    <div className={styles.WeekCalendar}>
      <div className={styles.CalendarHeader}>
        <div className={styles.LeftBar}></div>
        <div className={styles.TimeColumnHeader}></div>
        {weekDays.map((day, index) => (
          <div key={day} className={styles.DayHeader}>
            <div className={styles.DayName}>{day}</div>
            <div className={styles.DayDate}>
              {weekDates[index].getDate()}.
              {String(weekDates[index].getMonth() + 1).padStart(2, "0")}
            </div>
          </div>
        ))}
        <div className={styles.RightBar}></div>
      </div>
      <div className={styles.CalendarBody}>
        <div className={styles.LeftBarColumn}>
          {hours.map((hour, index) => (
            <div key={hour}>
              <div className={styles.LeftBarCell}></div>
              {index < hours.length - 1 && (
                <div className={styles.HorizontalBar}></div>
              )}
            </div>
          ))}
        </div>
        <div className={styles.TimeColumn}>
          {hours.map((hour, index) => (
            <div key={hour} className={styles.TimeRow}>
              <div className={styles.TimeSlot}>
                {String(hour).padStart(2, "0")}:00
              </div>
              {index < hours.length - 1 && (
                <div className={styles.HorizontalBar}></div>
              )}
            </div>
          ))}
        </div>
        {weekDays.map((day) => (
          <div key={day} className={styles.DayColumn}>
            {hours.map((hour, index) => (
              <div key={`${day}-${hour}`} className={styles.CalendarRow}>
                <div className={styles.CalendarCell}></div>
                {index < hours.length - 1 && (
                  <div className={styles.HorizontalBar}></div>
                )}
              </div>
            ))}
          </div>
        ))}
        <div className={styles.RightBarColumn}>
          {hours.map((hour, index) => (
            <div key={hour} className={styles.RightBarRow}>
              <div className={styles.RightBarCell}></div>
              {index < hours.length - 1 && (
                <div className={styles.HorizontalBar}></div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.BottomBar}>
        <div className={styles.BottomBarLeft}></div>
        <div className={styles.BottomBarTimeColumn}></div>
        {weekDays.map((day) => (
          <div key={day} className={styles.BottomBarCell}></div>
        ))}
        <div className={styles.BottomBarRight}></div>
      </div>
    </div>
  );
}
