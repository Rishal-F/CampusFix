import { useState } from "react";

const STATUSES = [
  ["reported", "Reported"],
  ["assigned", "Assigned"],
  ["in_progress", "In progress"],
  ["resolved", "Resolved"],
  ["closed", "Closed"],
];
const PRIORITIES = ["low", "medium", "high", "urgent"];
const NEXT_STATUSES = {
  reported: ["assigned", "in_progress", "closed"],
  assigned: ["in_progress", "closed"],
  in_progress: ["assigned", "closed"],
  resolved: ["closed"],
  closed: [],
};

function formatStatus(status) {
  return STATUSES.find(([value]) => value === status)?.[1] || status;
}

function formatDate(date) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "Unknown date" : parsed.toLocaleString();
}

function sameOriginImageUrl(imageKey) {
  if (typeof imageKey !== "string" || !imageKey.trim()) return null;

  try {
    const url = new URL(imageKey, window.location.origin);
    return url.origin === window.location.origin ? url.href : null;
  } catch {
    return null;
  }
}

export default function AdminIssues({
  issues,
  escalations,
  assignees,
  assigneesLoading,
  assigneesError,
  isLoading,
  errorMessage,
  onRefresh,
  onLoadIssue,
  onUpdatePriority,
  onUpdateStatus,
  onAssign,
  onResolve,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [history, setHistory] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = issues.filter((issue) => {
    const text = [
      issue.id,
      issue.title,
      issue.description,
      issue.reporter_name,
      issue.category,
      issue.location,
      issue.assigned_to,
    ].join(" ").toLowerCase();

    return (
      text.includes(search.toLowerCase())
      && (statusFilter === "All" || issue.status === statusFilter)
      && (priorityFilter === "All" || issue.priority === priorityFilter)
    );
  });
  const escalatedIds = new Set(escalations.map((issue) => String(issue.id)));
  const escalatedCount = escalations.length;
  const assigneeById = new Map(assignees.map((assignee) => [String(assignee.id), assignee]));

  async function runAction(action, successMessage, reloadIssueId = null) {
    setSaving(true);
    setActionMessage("");
    setActionError("");
    try {
      await action();
      setActionMessage(successMessage);
      if (reloadIssueId !== null) {
        const result = await onLoadIssue(reloadIssueId);
        setSelectedIssue(result.issue);
        setHistory(Array.isArray(result.history) ? result.history : []);
      }
      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to save issue changes.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function openIssue(issue) {
    setSelectedIssue(issue);
    setHistory([]);
    setDetailsError("");
    setDetailsLoading(true);
    try {
      const result = await onLoadIssue(issue.id);
      setSelectedIssue(result.issue);
      setHistory(Array.isArray(result.history) ? result.history : []);
    } catch (error) {
      setDetailsError(error instanceof Error ? error.message : "Unable to load issue history.");
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeIssue() {
    setSelectedIssue(null);
    setDetailsError("");
    setResolutionNote("");
    setActionMessage("");
    setActionError("");
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
            Live reports and history from the authenticated CampusFix API.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full border border-[#deded9] bg-[#ecece8] px-4 py-2 text-xs font-semibold">
            {issues.length} Total Reports
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="rounded-full border border-[#deded9] bg-[#fffefa] px-4 py-2 text-xs font-semibold disabled:opacity-50"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900" role="note">
        Assignments are made to existing admin users. Choosing an assignee does not change the complaint status.
      </div>

      {assigneesError && (
        <p className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          Eligible assignees could not be loaded: {assigneesError}
        </p>
      )}

      {!assigneesLoading && !assigneesError && assignees.length === 0 && (
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
          No admin users are currently available for assignment.
        </p>
      )}

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {errorMessage}
        </div>
      )}

      {escalatedCount > 0 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <h3 className="text-sm font-bold text-red-800">Escalation review needed</h3>
          <p className="mt-2 text-xs text-red-700">
            {escalatedCount} high- or urgent-priority report(s) have exceeded the backend escalation threshold.
          </p>
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search reports..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="min-w-[180px] flex-1 rounded-lg border border-[#deded9] bg-[#fffefa] px-4 py-3 text-xs"
        />

        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-[#deded9] bg-[#fffefa] px-4 py-3 text-xs"
        >
          <option value="All">All statuses</option>
          {STATUSES.map(([value, label]) => (
            <option value={value} key={value}>{label}</option>
          ))}
        </select>

        <select
          aria-label="Filter by priority"
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
          className="rounded-lg border border-[#deded9] bg-[#fffefa] px-4 py-3 text-xs"
        >
          <option value="All">All priorities</option>
          {PRIORITIES.map((priority) => (
            <option value={priority} key={priority}>{priority}</option>
          ))}
        </select>
      </div>

      {actionError && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      )}
      {actionMessage && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700" role="status">
          {actionMessage}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-[#deded9] bg-[#fffefa]">
        <table className="w-full min-w-[900px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-[#deded9] text-[10px] uppercase tracking-wide text-slate-500">
              <th className="px-4 py-4">Issue</th>
              <th className="px-4 py-4">Reporter</th>
              <th className="px-4 py-4">Category / location</th>
              <th className="px-4 py-4">Priority</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Assignment</th>
              <th className="px-4 py-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((issue) => (
              <tr key={issue.id} className="border-b border-[#ecece8] text-slate-600">
                <td className="px-4 py-4">
                  <strong className="block text-[10px] text-[#111318]">#{issue.id}</strong>
                  <span className="mt-1 block font-medium">{issue.title}</span>
                  {escalatedIds.has(String(issue.id)) && (
                    <span className="mt-2 inline-block rounded-full bg-red-100 px-2 py-1 text-[10px] font-semibold text-red-700">
                      Review overdue
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">{issue.reporter_name || "Unknown reporter"}</td>
                <td className="px-4 py-4">
                  {issue.category}<span className="block mt-1 text-slate-400">{issue.location}</span>
                </td>
                <td className="px-4 py-4">
                  <select
                    aria-label={`Priority for issue ${issue.id}`}
                    value={issue.priority}
                    disabled={saving || isLoading}
                    onChange={(event) => runAction(
                      () => onUpdatePriority(issue.id, event.target.value),
                      "Priority updated successfully.",
                      selectedIssue?.id === issue.id ? issue.id : null,
                    )}
                    className="rounded-lg border border-[#deded9] bg-white p-2 text-xs capitalize disabled:opacity-50"
                  >
                    {PRIORITIES.map((priority) => (
                      <option value={priority} key={priority}>{priority}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-4">
                  <select
                    aria-label={`Status for issue ${issue.id}`}
                    value={issue.status}
                    disabled={saving || isLoading || NEXT_STATUSES[issue.status]?.length === 0}
                    onChange={(event) => runAction(
                      () => onUpdateStatus(issue.id, event.target.value),
                      "Status updated successfully.",
                      selectedIssue?.id === issue.id ? issue.id : null,
                    )}
                    className="rounded-lg border border-[#deded9] bg-white p-2 text-xs disabled:opacity-50"
                  >
                    <option value={issue.status}>{formatStatus(issue.status)}</option>
                    {(NEXT_STATUSES[issue.status] || []).map((status) => (
                      <option value={status} key={status}>{formatStatus(status)}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-4">
                  <select
                    aria-label={`Assignee for issue ${issue.id}`}
                    value={issue.assigned_to == null ? "" : String(issue.assigned_to)}
                    disabled={saving || isLoading || assigneesLoading || Boolean(assigneesError)}
                    onChange={(event) => runAction(
                      () => onAssign(issue.id, event.target.value || null),
                      event.target.value ? "Issue assigned successfully." : "Issue unassigned successfully.",
                      selectedIssue?.id === issue.id ? issue.id : null,
                    )}
                    className="max-w-48 rounded-lg border border-[#deded9] bg-white p-2 text-xs disabled:opacity-50"
                  >
                    <option value="">Unassigned</option>
                    {issue.assigned_to != null && !assigneeById.has(String(issue.assigned_to)) && (
                      <option value={String(issue.assigned_to)}>
                        Unavailable admin (ID {issue.assigned_to})
                      </option>
                    )}
                    {assignees.map((assignee) => (
                      <option value={String(assignee.id)} key={assignee.id}>
                        {assignee.fullName}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => openIssue(issue)}
                    className="rounded-full bg-[#111318] px-4 py-2 font-semibold text-white hover:bg-black"
                  >
                    View details
                  </button>
                </td>
              </tr>
            ))}

            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Loading reports...</td></tr>
            )}
            {!isLoading && !errorMessage && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  {issues.length === 0 ? "No issue reports have been submitted yet." : "No reports match these filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedIssue && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeIssue}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Issue details"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-[#fffefa] p-6 shadow-xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-500">Issue #{selectedIssue.id}</span>
                <h2 className="mt-2 text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                  {selectedIssue.title}
                </h2>
              </div>
              <button type="button" onClick={closeIssue} aria-label="Close issue details" className="text-xl text-slate-500 hover:text-black">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <p><strong>Reporter:</strong> {selectedIssue.reporter_name || "Unknown reporter"}</p>
              <p><strong>Category:</strong> {selectedIssue.category}</p>
              <p><strong>Location:</strong> {selectedIssue.location}</p>
              <p><strong>Description:</strong> {selectedIssue.description}</p>
              <p><strong>Submitted:</strong> {formatDate(selectedIssue.created_at)}</p>
              <p><strong>Status:</strong> {formatStatus(selectedIssue.status)}</p>
              <p><strong>Priority:</strong> <span className="capitalize">{selectedIssue.priority}</span></p>
              <p>
                <strong>Assigned to:</strong>{" "}
                {selectedIssue.assigned_to == null
                  ? "Unassigned"
                  : assigneeById.get(String(selectedIssue.assigned_to))?.fullName
                    || `Admin user ${selectedIssue.assigned_to}`}
              </p>
            </div>

            {sameOriginImageUrl(selectedIssue.image_key) && (
              <figure className="my-5">
                <figcaption className="mb-2 text-xs font-semibold text-slate-700">Issue image</figcaption>
                <img
                  src={sameOriginImageUrl(selectedIssue.image_key)}
                  alt={`Image attached to issue ${selectedIssue.id}`}
                  className="max-h-80 w-full rounded-lg border border-[#deded9] object-contain"
                />
              </figure>
            )}

            <div className="my-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-xs font-semibold">
                Priority
                <select
                  value={selectedIssue.priority}
                  disabled={saving}
                  onChange={(event) => runAction(
                    () => onUpdatePriority(selectedIssue.id, event.target.value),
                    "Priority updated successfully.",
                    selectedIssue.id,
                  )}
                  className="rounded-lg border border-[#deded9] bg-white p-3 text-xs capitalize disabled:opacity-50"
                >
                  {PRIORITIES.map((priority) => (
                    <option value={priority} key={priority}>{priority}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-xs font-semibold">
                Status
                <select
                  value={selectedIssue.status}
                  disabled={saving || NEXT_STATUSES[selectedIssue.status]?.length === 0}
                  onChange={(event) => runAction(
                    () => onUpdateStatus(selectedIssue.id, event.target.value),
                    "Status updated successfully.",
                    selectedIssue.id,
                  )}
                  className="rounded-lg border border-[#deded9] bg-white p-3 text-xs disabled:opacity-50"
                >
                  <option value={selectedIssue.status}>{formatStatus(selectedIssue.status)}</option>
                  {(NEXT_STATUSES[selectedIssue.status] || []).map((status) => (
                    <option value={status} key={status}>{formatStatus(status)}</option>
                  ))}
                </select>
              </label>
            </div>
            {!["resolved", "closed"].includes(selectedIssue.status) && (
              <div className="mb-7 border-t border-[#deded9] pt-6">
                <h3 className="text-sm font-bold">Resolve issue</h3>
                <label className="mt-3 grid gap-2 text-xs font-semibold">
                  Resolution note (required)
                  <textarea
                    value={resolutionNote}
                    onChange={(event) => setResolutionNote(event.target.value)}
                    maxLength={5000}
                    rows={3}
                    placeholder="Describe the resolution..."
                    disabled={saving}
                    className="w-full rounded-lg border border-[#deded9] bg-white p-3 text-sm font-normal"
                  />
                </label>
                <button
                  type="button"
                  disabled={saving || !resolutionNote.trim()}
                  onClick={() => runAction(
                    () => onResolve(selectedIssue.id, resolutionNote.trim()),
                    "Issue resolved and resolution note saved.",
                    selectedIssue.id,
                  ).then((saved) => {
                    if (saved) setResolutionNote("");
                  })}
                  className="mt-3 rounded-full bg-[#111318] px-5 py-2.5 text-xs font-bold text-white hover:bg-black disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save resolution"}
                </button>
              </div>
            )}

            {actionError && <p className="mb-4 text-sm text-red-700" role="alert">{actionError}</p>}
            {actionMessage && <p className="mb-4 text-sm text-emerald-700" role="status">{actionMessage}</p>}

            <div className="mt-7 border-t border-[#deded9] pt-6">
              <h3 className="mb-4 text-sm font-bold">Issue history</h3>
              {detailsLoading && <p className="text-xs text-slate-500" role="status">Loading issue history...</p>}
              {detailsError && <p className="text-xs text-red-700" role="alert">{detailsError}</p>}
              {!detailsLoading && !detailsError && history.length === 0 && (
                <p className="text-xs text-slate-500">No history has been recorded for this issue.</p>
              )}
              <div className="space-y-4">
                {history.map((event) => (
                  <div key={event.id} className="border-l-2 border-[#111318] pl-4">
                    <p className="text-xs font-semibold text-[#111318]">
                      {event.old_status ? `${formatStatus(event.old_status)} → ` : ""}
                      {formatStatus(event.new_status)}
                    </p>
                    {event.note && <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{event.note}</p>}
                    <p className="mt-1 text-[11px] text-slate-500">
                      {formatDate(event.created_at)}
                      {event.changed_by_name ? ` · By ${event.changed_by_name}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={closeIssue}
              className="mt-7 rounded-full border border-[#deded9] px-5 py-2.5 text-xs font-semibold hover:bg-[#ecece8]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
