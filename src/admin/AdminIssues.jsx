
import { useState } from "react";
import { departments, statuses } from "./adminMockData";

export default function AdminIssues({ complaints, onUpdate }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const filtered = complaints.filter((issue) => {
    const matchesSearch = [
      issue.id,
      issue.title,
      issue.student,
      issue.category,
      issue.location
    ].some((value) =>
      String(value || "").toLowerCase().includes(search.toLowerCase())
    );

    return matchesSearch &&
      (filter === "All" || issue.status === filter);
  });

  return (
    <section>
      <div className="admin-section-heading">
        <div>
          <h2>Complaint Management</h2>
          <p>Review, assign and resolve campus complaints.</p>
        </div>
      </div>

      <div className="admin-filters">
        <input
          type="search"
          placeholder="Search complaints..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Complaint</th>
              <th>Student</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Department</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((issue) => (
              <tr key={issue.id}>
                <td>{issue.id}</td>
                <td>
                  <strong>{issue.title}</strong>
                  <small>{issue.category}</small>
                </td>
                <td>{issue.student}</td>
                <td>{issue.priority}</td>
                <td>
                  <span className={
                    "admin-status " +
                    issue.status.toLowerCase().replace(" ", "-")
                  }>
                    {issue.status}
                  </span>
                </td>
                <td>
                  <select
                    aria-label={"Department for " + issue.id}
                    value={issue.department}
                    onChange={(e) =>
                      onUpdate(issue.id, {
                        department: e.target.value
                      })
                    }
                  >
                    {departments.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    className="admin-small-button"
                    onClick={() => setSelected(issue.id)}
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="admin-empty">
                  No matching complaints found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (() => {
        const issue = complaints.find((item) => item.id === selected);
        if (!issue) return null;

        return (
          <div
            className="admin-modal-overlay"
            onClick={() => setSelected(null)}
          >
            <div
              className="admin-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Complaint details"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-header">
                <h2>Complaint Details</h2>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close details"
                >
                  ✕
                </button>
              </div>

              <p><strong>ID:</strong> {issue.id}</p>
              <p><strong>Title:</strong> {issue.title}</p>
              <p><strong>Student:</strong> {issue.student}</p>
              <p><strong>Description:</strong> {issue.description}</p>
              <p><strong>Category:</strong> {issue.category}</p>
              <p><strong>Location:</strong> {issue.location}</p>
              <p><strong>Priority:</strong> {issue.priority}</p>
              <p><strong>Date:</strong> {issue.date}</p>

              <label className="admin-field">
                Status
                <select
                  value={issue.status}
                  onChange={(e) =>
                    onUpdate(issue.id, { status: e.target.value })
                  }
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-field">
                Assigned Department
                <select
                  value={issue.department}
                  onChange={(e) =>
                    onUpdate(issue.id, { department: e.target.value })
                  }
                >
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </label>

              <button
                className="admin-primary-button"
                onClick={() => setSelected(null)}
              >
                Done
              </button>
            </div>
          </div>
        );
      })()}
    </section>
  );
}
