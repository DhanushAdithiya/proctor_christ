import { Assignment } from "./pendingAssignments";
import { useParams } from "next/navigation";

export default function AllAssignments({
  assignments,
  admin=false
}: {
  assignments: Assignment[];
  admin?: boolean;
}): JSX.Element {
	const params = useParams();
  const subjectId = params.subjectId;
  return (
    <div className="flex-[2]">
      <h3 className="text-xl font-semibold mb-4 text-gray-900">
        All Assignments
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {/* Add New Assignment Card */}
        {admin && (
          <a href={`${subjectId}/lab/create-lab`}>
            <div className="border-2 border-dashed border-gray-200 hover:border-blue-400 bg-gray-50 hover:bg-blue-50 transition-all duration-200 rounded-lg flex items-center justify-center cursor-pointer min-h-[112px] min-w-[100px]">
              <span className="text-4xl text-gray-300">+</span>
            </div>
          </a>
        )}
        {/* Assignment Cards */}
        {assignments.map((assignment) => (
          <a key={assignment.id} href={`${subjectId}/lab/${assignment.id}`}>
          <div
            key={assignment.id}
            className="bg-white border border-gray-200 hover:shadow-lg hover:bg-blue-50 transition-all duration-200 rounded-lg flex items-center justify-center text-center p-4 min-h-[112px] min-w-[100px] text-base font-medium text-gray-900 cursor-pointer"
          >
            {assignment.name}
          </div>
          </a>
        ))}
      </div>
    </div>
  );
}
