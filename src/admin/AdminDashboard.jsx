
import { useState } from "react";
import { AppShell } from "../student/StudentPages";
import AdminIssues from "./AdminIssues";
import AdminAnalytics from "./AdminAnalytics";
import { initialComplaints } from "./adminMockData";
import "./AdminDashboard.css";

const STORAGE_KEY = "campusfix-admin-demo-complaints";

// Load saved complaints or use initial demo data
function loadComplaints() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Unable to load complaints:", error);
  }

  return initialComplaints;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [complaints, setComplaints] = useState(loadComplaints);

  // Update complaint and record activity history
  function updateComplaint(id, changes) {
    const timestamp = new Date().toISOString();

    const updated = complaints.map((complaint) => {
      if (complaint.id !== id) {
        return complaint;
      }

      const history = [...(complaint.history || [])];

      const fields = [
        ["status", "Status"],
        ["priority", "Priority"],
        ["department", "Department"]
      ];

      // Record status, priority and department changes
      fields.forEach(([key, label]) => {
        if (
          changes[key] !== undefined &&
          changes[key] !== complaint[key]
        ) {
          history.push({
            id: crypto.randomUUID(),
            action: `${label} changed from "${complaint[key]}" to "${changes[key]}"`,
            timestamp: timestamp,
            by: "Admin (Demo)"
          });
        }
      });

      // Record resolution notes
      if (
        changes.resolutionNote !== undefined &&
        changes.resolutionNote !== complaint.resolutionNote
      ) {
        history.push({
          id: crypto.randomUUID(),
          action: `Resolution recorded: ${changes.resolutionNote}`,
          timestamp: timestamp,
          by: "Admin (Demo)"
        });
      }

      return {
        ...complaint,
        ...changes,
        history: history
      };
    });

    // Update React state
    setComplaints(updated);

    // Save updated complaints in localStorage
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error("Unable to save changes:", error);
      alert("Changes were not saved in browser storage.");
    }
  }

  // Dashboard statistics
  const total = complaints.length;

  const pending = complaints.filter(
    (item) => item.status === "Pending"
  ).length;

  const inProgress = complaints.filter(
    (item) => item.status === "In Progress"
  ).length;

  const resolved = complaints.filter(
    (item) => item.status === "Resolved"
  ).length;

  const statistics = [
    {
      title: "Total reports",
      value: total,
      description: "All reported campus issues",
      symbol: "▤"
    },
    {
      title: "Needs review",
      value: pending,
      description: "Waiting for administrator review",
      symbol: "◷"
    },
    {
      title: "In progress",
      value: inProgress,
      description: "Currently being handled",
      symbol: "⚙"
    },
    {
      title: "Resolved",
      value: resolved,
      description: "Successfully completed",
      symbol: "✓"
    }
  ];

  // Display five most recent complaints
  const recentComplaints = [...complaints]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  // Complaint status styling
  const getStatusClass = (status) => {
    if (status === "Resolved") {
      return "bg-emerald-50 text-emerald-700";
    }

    if (status === "Pending") {
      return "bg-amber-50 text-amber-700";
    }

    return "bg-blue-50 text-blue-700";
  };

  return (
    <AppShell
      title="Admin overview"
      subtitle="Operations workspace for reviewing, managing and resolving campus issue reports."
    >
      <div className="campus-admin-module">

        {/* ADMIN NAVIGATION */}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Issue operations
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Review complaints, assign departments and track resolutions.
            </p>
          </div>

          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-700">
            Preview mode
          </span>
        </div>

        {/* ADMIN TABS */}

        <nav
          className="mb-8 flex flex-wrap gap-2 border-b border-[#deded9] pb-4"
          aria-label="Admin sections"
        >
          {[
            ["overview", "Overview"],
            ["complaints", "Manage complaints"],
            ["analytics", "Analytics"]
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`rounded-full px-5 py-2.5 text-xs font-semibold transition-colors ${
                activeTab === key
                  ? "bg-[#111318] text-white"
                  : "border border-[#deded9] bg-[#fffefa] text-[#111318] hover:bg-[#ecece8]"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* OVERVIEW PAGE */}

        {activeTab === "overview" && (
          <>
            {/* DASHBOARD STATISTICS */}

            <section className="mb-9 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {statistics.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-[#deded9] bg-[#fffefa] p-4 shadow-sm sm:p-5"
                >
                  <div className="mb-4 grid h-9 w-9 place-items-center rounded-lg bg-[#ecece8] text-lg text-[#111318]">
                    {item.symbol}
                  </div>

                  <p className="mb-2 text-xs text-slate-500">
                    {item.title}
                  </p>

                  <strong
                    className="block text-3xl font-bold"
                    style={{
                      fontFamily: "var(--font-heading)"
                    }}
                  >
                    {item.value}
                  </strong>

                  <p className="mt-2 text-[11px] text-slate-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </section>

            {/* RECENT COMPLAINTS */}

            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h2
                    className="text-lg font-bold tracking-tight"
                    style={{
                      fontFamily: "var(--font-heading)"
                    }}
                  >
                    Recent issue reports
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Latest complaints reported across campus.
                  </p>
                </div>

                <button
                  type="button"
                  className="text-xs font-semibold text-[#111318] underline underline-offset-4"
                  onClick={() => setActiveTab("complaints")}
                >
                  View all reports →
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#deded9] bg-[#fffefa] shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] border-collapse text-left">

                    <thead>
                      <tr className="border-b border-[#deded9] text-[10px] uppercase tracking-wide text-slate-400">
                        <th className="px-4 py-4">Issue</th>
                        <th className="px-4 py-4">Category</th>
                        <th className="px-4 py-4">Priority</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-4 py-4">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentComplaints.map((item) => (
                        <tr
                          key={item.id}
                          className="border-t border-[#ecece8] text-xs text-slate-600"
                        >
                          <td className="px-4 py-4">
                            <span className="mb-1 block text-[10px] font-bold text-[#111318]">
                              {item.id}
                            </span>

                            <span className="font-semibold">
                              {item.title}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            {item.category}
                          </td>

                          <td className="px-4 py-4">
                            {item.priority}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`campus-status inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${getStatusClass(item.status)}`}
                            >
                              {item.status}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <button
                              type="button"
                              onClick={() => setActiveTab("complaints")}
                              className="font-semibold text-[#111318] underline underline-offset-4"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}

                      {recentComplaints.length === 0 && (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-4 py-8 text-center text-slate-500"
                          >
                            No complaints available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}

        {/* COMPLAINT MANAGEMENT PAGE */}

        {activeTab === "complaints" && (
          <AdminIssues
            complaints={complaints}
            onUpdate={updateComplaint}
          />
        )}

        {/* ADMIN ANALYTICS PAGE */}

        {activeTab === "analytics" && (
          <AdminAnalytics complaints={complaints} />
        )}

      </div>
    </AppShell>
  );
}
