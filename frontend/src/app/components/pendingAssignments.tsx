import { Clock } from "lucide-react";

export interface Assignment {
  id: string;
  name: string;
  status?: "pending" | "completed" | "graded"; // Added status for filtering
  // Add other assignment properties if needed
}

interface ItemsListProps<T> {
  title?: string;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
	emptyMessage: string | React.ReactNode;
	itemKey: keyof T | ((item: T) => string); // To get a unique key for each item
}

function ItemsList<T>({
	title,
	items,
	renderItem,
	emptyMessage,
	itemKey,
}: ItemsListProps<T>) {
	const getKey = (item: T) => {
		if (typeof itemKey === "function") {
			return itemKey(item);
		}
		// Ensure the key exists and is string/number before accessing
		const key = item[itemKey];
		if (typeof key === "string" || typeof key === "number") {
			return key;
		}
		// Fallback or error handling if key is not primitive
		console.error("Invalid key type provided to ItemsList:", key);
		return Math.random().toString(); // Not ideal, provide a proper key!
	};

	return (
		<div className="mb-6">
			{" "}
			{/* Add margin below the list section */}
			{title && <h3 className="text-lg font-medium mb-3">{title}</h3>}{" "}
			{/* Consistent heading style */}
			{items && items.length > 0 ? (
				<div className="space-y-2">
					{" "}
					{/* Spacing between list items */}
					{items.map((item, index) => (
						<div key={getKey(item)}>
							{" "}
							{/* Use unique key */}
							{renderItem(item, index)}
						</div>
					))}
				</div>
			) : (
				<div className="flex items-center justify-center text-sm p-4 bg-muted/50 rounded-md border border-dashed">
					{typeof emptyMessage === "string" ? (
						<p className="text-muted-foreground">{emptyMessage}</p>
					) : (
						emptyMessage
					)}
				</div>
			)}
		</div>
	);
}

export default function PendingAssignments({ assignments, admin=false }: { assignments: Assignment[], admin?: boolean }): JSX.Element {
    const pendingAssignments = assignments.filter((assignment) => assignment.status === "pending");
  return (
    <div className="flex-1">
      <ItemsList
        title="Pending Assignments"
        items={pendingAssignments}
        itemKey="id"
        renderItem={(assignment) => (
          <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 hover:border-blue-300 rounded-lg text-sm transition-colors">
            <span className="text-gray-900">{assignment.name}</span>
            <Clock className="h-4 w-4 text-gray-400" />
          </div>
        )}
        emptyMessage="No pending assignments for this subject."
      />
    </div>
  );
}
