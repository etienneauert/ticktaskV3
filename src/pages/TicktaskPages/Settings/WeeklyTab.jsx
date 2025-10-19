import styles from "./SettingsPopup.module.css";
import weeklyStyles from "./Weekly/Weekly.module.css";
import { useState, useEffect } from "react";
import Monday from "./Weekly/Monday";
import Tuesday from "./Weekly/Tuesday";
import Wednesday from "./Weekly/Wednesday";
import Thursday from "./Weekly/Thursday";
import Friday from "./Weekly/Friday";
import Saturday from "./Weekly/Saturday";
import Sunday from "./Weekly/Sunday";

export default function WeeklyTab({ weeklyTasks, updateWeeklyTasks }) {
  const [showDays, setShowDays] = useState(false);

  useEffect(() => {
    // Warte bis die Modal-Animation (300ms) vollständig abgeschlossen ist
    const timer = setTimeout(() => {
      setShowDays(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.tabPanel}>
      <div className={weeklyStyles.weeklyContainer}>
        {showDays && (
          <div className={weeklyStyles.weeklyDays}>
            <Monday
              tasks={weeklyTasks.monday}
              onUpdateTasks={(tasks) => updateWeeklyTasks("monday", tasks)}
            />
            <Tuesday
              tasks={weeklyTasks.tuesday}
              onUpdateTasks={(tasks) => updateWeeklyTasks("tuesday", tasks)}
            />
            <Wednesday
              tasks={weeklyTasks.wednesday}
              onUpdateTasks={(tasks) => updateWeeklyTasks("wednesday", tasks)}
            />
            <Thursday
              tasks={weeklyTasks.thursday}
              onUpdateTasks={(tasks) => updateWeeklyTasks("thursday", tasks)}
            />
            <Friday
              tasks={weeklyTasks.friday}
              onUpdateTasks={(tasks) => updateWeeklyTasks("friday", tasks)}
            />
            <Saturday
              tasks={weeklyTasks.saturday}
              onUpdateTasks={(tasks) => updateWeeklyTasks("saturday", tasks)}
            />
            <Sunday
              tasks={weeklyTasks.sunday}
              onUpdateTasks={(tasks) => updateWeeklyTasks("sunday", tasks)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
