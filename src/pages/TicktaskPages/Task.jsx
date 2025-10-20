import SingleTask from "./SingleTask";
import styles from "./Task.module.css";

export function Task({
  tasks,
  onDelete,
  onTaskDone,
  onEdit,
  onCopyTask,
  isDoneList = false,
  isFrequentList = false,
  runningTaskId,
  onTaskStart,
  onTaskStop,
}) {
  return (
    <div className={styles.takslist}>
      {
        <ul>
          {tasks.map((task, i) => (
            <SingleTask
              key={task.id || `task-${i}`}
              task={task}
              index={i}
              onDelete={onDelete}
              onTaskDone={onTaskDone}
              onEdit={onEdit}
              onCopyTask={onCopyTask}
              isDoneList={isDoneList}
              isFrequentList={isFrequentList}
              runningTaskId={runningTaskId}
              onTaskStart={onTaskStart}
              onTaskStop={onTaskStop}
            />
          ))}
        </ul>
      }
    </div>
  );
}
