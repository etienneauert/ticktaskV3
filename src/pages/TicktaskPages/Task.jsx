import SingleTask from "./SingleTask";

export function Task({ tasks, onDelete }) {
  return (
    <div>
      {
        <ul>
          {tasks.map((task, i) => (
            <SingleTask key={i} task={task} index={i} onDelete={onDelete} />
          ))}
        </ul>
      }
    </div>
  );
}
