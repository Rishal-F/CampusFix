
import { useState } from "react";
import { departments, statuses } from "./adminMockData";

const priorities = ["Low", "Medium", "High"];
const ESCALATION_HOURS = 48;

function needsEscalation(issue) {
  if (issue.priority !== "High" || issue.status === "Resolved") {
    return false;
  }

  const submitted = new Date(issue.date);
  if (Number.isNaN(submitted.getTime())) return false;

  const hoursOpen = (Date.now() - submitted.getTime()) / 3600000;
  return hoursOpen > ESCALATION_HOURS;
}

export default function AdminIssues({ complaints, onUpdate }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [message, setMessage] = useState("");

  const selectedIssue = complaints.find(
    (issue) => issue.id === selectedId
  );

  const filtered = complaints.filter((issue) => {
    const text = [
      issue.id,
      issue.title,
      issue.student,
      issue.category,
      issue.location,
      issue.department
    ].join(" ").toLowerCase();

    return (
      text.includes(search.toLowerCase()) &&
      (statusFilter === "All" || issue.status === statusFilter) &&
      (priorityFilter === "All" || issue.priority === priorityFilter)
    );
  });

  const escalatedCount = complaints.filter(needsEscalation).length;

  function openIssue(id) {
    setSelectedId(id);
    setResolutionNote("");
    setMessage("");
  }

  function saveResolution() {
    if (!selectedIssue) return;

    if (!resolutionNote.trim()) {
      setMessage("Please enter a resolution note.");
      return;
    }

    onUpdate(selectedIssue.id, {
      status: "Resolved",
      resolutionNote: resolutionNote.trim()
    });

    setResolutionNote("");
    setMessage("Resolution recorded successfully in the demo.");
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Complaint Management
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            Review, prioritize, assign and resolve campus issues.
          </p>
        </div>

        <span className="rounded-full border border-[#deded9] bg-[#ecece8] px-4 py-2 text-xs font-semibold">
          {complaints.length} Total Reports
        </span>
      </div>

      {/* ESCALATION SUMMARY */}
      {escalatedCount > 0 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <h3 className="text-sm font-bold text-red-800">
            Escalation Attention Required
          </h3>
          <p className="mt-2 text-xs text-red-700">
            {escalatedCount} high-priority complaint(s) have remained
            unresolved for more than {ESCALATION_HOURS} hours.
          </p>
          <p className="mt-1 text-xs text-red-700">
            These complaints require administrator review.
          </p>
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <div className="mb-5 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search complaints..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[180px] flex-1 rounded-lg border border-[#deded9] bg-[#fffefa] px-4 py-3 text-xs"
        />

        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[#deded9] bg-[#fffefa] px-4 py-3 text-xs"
        >
          <option value="All">All Statuses</option>
          {statuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>

        <select
          aria-label="Filter by priority"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-[#deded9] bg-[#fffefa] px-4 py-3 text-xs"
        >
          <option value="All">All Priorities</option>
          {priorities.map((priority) => (
            <option key={priority}>{priority}</option>
          ))}
        </select>
      </div>

      {/* COMPLAINT TABLE */}
      <div className="overflow-x-auto rounded-xl border border-[#deded9] bg-[#fffefa]">
        <table className="w-full min-w-[850px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-[#deded9] text-[10px] uppercase tracking-wide text-slate-500">
              <th className="px-4 py-4">Issue</th>
              <th className="px-4 py-4">Category</th>
              <th className="px-4 py-4">Priority</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Department</th>
              <th className="px-4 py-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((issue) => (
              <tr
                key={issue.id}
                className="border-b border-[#ecece8] text-slate-600"
              >
                <td className="px-4 py-4">
                  <strong className="block text-[10px] text-[#111318]">
                    {issue.id}
                  </strong>
                  <span className="mt-1 block font-medium">
                    {issue.title}
                  </span>

                  {needsEscalation(issue) && (
                    <span className="mt-2 inline-block rounded-full bg-red-100 px-2 py-1 text-[10px] font-semibold text-red-700">
                      Escalation Required
                    </span>
                  )}
                </td>

                <td className="px-4 py-4">{issue.category}</td>

                <td className="px-4 py-4">
                  <select
                    aria-label={`Priority for ${issue.id}`}
                    value={issue.priority}
                    onChange={(e) =>
                      onUpdate(issue.id, {
                        priority: e.target.value
                      })
                    }
                    className="rounded-lg border border-[#deded9] bg-white p-2 text-xs"
                  >
                    {priorities.map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>
                </td>

                <td className="px-4 py-4">
                  <span className="campus-status inline-block rounded-full px-3 py-1 text-[11px]">
                    {issue.status}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <select
                    aria-label={`Department for ${issue.id}`}
                    value={issue.department}
                    onChange={(e) =>
                      onUpdate(issue.id, {
                        department: e.target.value
                      })
                    }
                    className="max-w-[160px] rounded-lg border border-[#deded9] bg-white p-2 text-xs"
                  >
                    {departments.map((department) => (
                      <option key={department}>{department}</option>
                    ))}
                  </select>
                </td>

                <td className="px-4 py-4">
                  <button
                    onClick={() => openIssue(issue.id)}
                    className="rounded-full bg-[#111318] px-4 py-2 font-semibold text-white hover:bg-black"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-10 text-center text-slate-500">
                  No matching complaints found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* COMPLAINT DETAILS */}
      {selectedIssue && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Manage complaint"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-[#fffefa] p-6 shadow-xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-500">
                  {selectedIssue.id}
                </span>
                <h2
                  className="mt-2 text-xl font-bold"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {selectedIssue.title}
                </h2>
              </div>

              <button
                onClick={() => setSelectedId(null)}
                aria-label="Close complaint"
                className="text-xl text-slate-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <p><strong>Student:</strong> {selectedIssue.student}</p>
              <p><strong>Category:</strong> {selectedIssue.category}</p>
              <p><strong>Location:</strong> {selectedIssue.location}</p>
              <p><strong>Description:</strong> {selectedIssue.description}</p>
              <p><strong>Submitted:</strong> {selectedIssue.date}</p>
            </div>

            <div className="my-6 grid gap-4 sm:grid-cols-3">
              <label className="grid gap-2 text-xs font-semibold">
                Status
                <select
                  value={selectedIssue.status}
                  onChange={(e) =>
                    onUpdate(selectedIssue.id, {
                      status: e.target.value
                    })
                  }
                  className="rounded-lg border border-[#deded9] bg-white p-3"
                >
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-xs font-semibold">
                Priority
                <select
                  value={selectedIssue.priority}
                  onChange={(e) =>
                    onUpdate(selectedIssue.id, {
                      priority: e.target.value
                    })
                  }
                  className="rounded-lg border border-[#deded9] bg-white p-3"
                >
                  {priorities.map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-xs font-semibold">
                Department
                <select
                  value={selectedIssue.department}
                  onChange={(e) =>
                    onUpdate(selectedIssue.id, {
                      department: e.target.value
                    })
                  }
                  className="rounded-lg border border-[#deded9] bg-white p-3"
                >
                  {departments.map((department) => (
                    <option key={department}>{department}</option>
                  ))}
                </select>
              </label>
            </div>

            {/* RESOLUTION NOTES */}
            <div className="border-t border-[#deded9] pt-6">
              <h3 className="text-sm font-bold">
                Resolution Notes
              </h3>

              {selectedIssue.resolutionNote && (
                <div className="mt-3 rounded-lg bg-[#ecece8] p-4 text-xs">
                  <strong>Latest recorded resolution:</strong>
                  <p className="mt-2 whitespace-pre-wrap">
                    {selectedIssue.resolutionNote}
                  </p>
                </div>
              )}

              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Describe the action taken to resolve this issue..."
                rows={3}
                className="mt-3 w-full rounded-lg border border-[#deded9] bg-white p-3 text-sm"
              />

              <button
                onClick={saveResolution}
                className="mt-3 rounded-full bg-[#111318] px-5 py-2.5 text-xs font-bold text-white hover:bg-black"
              >
                Save Resolution & Mark Resolved
              </button>

              {message && (
                <p className="mt-3 text-xs text-slate-600" role="status">
                  {message}
                </p>
              )}
            </div>

            {/* ACTIVITY TIMELINE */}
            <div className="mt-8 border-t border-[#deded9] pt-6">
              <h3 className="mb-4 text-sm font-bold">
                Activity Timeline
              </h3>

              {(!selectedIssue.history ||
                selectedIssue.history.length === 0) && (
                <p className="text-xs text-slate-500">
                  No admin changes recorded yet.
                </p>
              )}

              <div className="space-y-4">
                {[...(selectedIssue.history || [])]
                  .reverse()
                  .map((event) => (
                    <div
                      key={event.id}
                      className="border-l-2 border-[#111318] pl-4"
                    >
                      <p className="text-xs font-semibold text-[#111318]">
                        {event.action}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        By: {event.by}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedId(null)}
              className="mt-8 rounded-full border border-[#deded9] px-5 py-2.5 text-xs font-semibold hover:bg-[#ecece8]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
