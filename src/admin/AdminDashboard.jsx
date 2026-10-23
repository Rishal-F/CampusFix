
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "../student/StudentPages";
import { api } from "../api/client";
import AdminIssues from "./AdminIssues";
import AdminAnalytics from "./AdminAnalytics";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const [escalations, setEscalations] = useState([]);
  const [escalationError, setEscalationError] = useState("");

  const refreshIssues = useCallback(async (showSuccess = false) => {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await api.listIssues();
      if (!Array.isArray(result.issues)) {
        throw new Error("The server returned an invalid issue list.");
      }
      setIssues(result.issues);
      if (showSuccess) setSuccessMessage("Issue records refreshed successfully.");
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load issue reports.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshEscalations = useCallback(async () => {
    setEscalationError("");
    try {
      const result = await api.listEscalations();
      if (!Array.isArray(result.issues)) {
        throw new Error("The server returned an invalid escalation list.");
      }
      setEscalations(result.issues);
    } catch (error) {
      setEscalationError(error instanceof Error ? error.message : "Unable to load escalations.");
    }
  }, []);

  const refreshAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError("");
    try {
      setAnalytics(await api.getAdminAnalytics());
    } catch (error) {
      setAnalyticsError(error instanceof Error ? error.message : "Unable to load analytics.");
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshIssues();
    refreshEscalations();
  }, [refreshIssues, refreshEscalations]);

  useEffect(() => {
    if (activeTab === "analytics") refreshAnalytics();
  }, [activeTab, refreshAnalytics]);

  const updateIssue = useCallback(async (request, successText) => {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await request();
      const refreshed = await refreshIssues();
      await refreshEscalations();
      if (activeTab === "analytics") await refreshAnalytics();
      if (!refreshed) {
        throw new Error("The update was saved, but the issue list could not be refreshed.");
      }
      setSuccessMessage(successText);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update issue.");
      throw error;
    }
  }, [activeTab, refreshAnalytics, refreshEscalations, refreshIssues]);

  const total = issues.length;
  const needsReview = issues.filter((issue) => issue.status === "reported").length;
  const inProgress = issues.filter(
    (issue) => issue.status === "assigned" || issue.status === "in_progress"
  ).length;
  const resolved = issues.filter(
    (issue) => issue.status === "resolved" || issue.status === "closed"
  ).length;
  const statistics = [
    { title: "Total reports", value: total, description: "All submitted campus issues", symbol: "▤" },
    { title: "Needs review", value: needsReview, description: "Awaiting initial review", symbol: "◷" },
    { title: "In progress", value: inProgress, description: "Assigned or being worked on", symbol: "⚙" },
    { title: "Resolved", value: resolved, description: "Resolved or closed reports", symbol: "✓" }
  ];
  const recentIssues = [...issues]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  const escalationIds = new Set(escalations.map((issue) => String(issue.id)));

  const getStatusClass = (status) => {
    if (status === "resolved" || status === "closed") {
      return "bg-emerald-50 text-emerald-700";
    }

    if (status === "reported") {
      return "bg-amber-50 text-amber-700";
    }

    return "bg-blue-50 text-blue-700";
  };

  const formatStatus = (status) => ({
    reported: "Reported",
    assigned: "Assigned",
    in_progress: "In progress",
    resolved: "Resolved",
    closed: "Closed",
  })[status] || status;

  const formatDate = (date) => {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? "Unknown date" : parsed.toLocaleString();
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
              Review reports and monitor issue status from the CampusFix database.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refreshIssues(true)}
            disabled={isLoading}
            className="rounded-full border border-[#deded9] bg-[#fffefa] px-4 py-2 text-xs font-semibold text-[#111318] hover:bg-[#ecece8] disabled:opacity-50"
          >
            {isLoading ? "Refreshing..." : "Refresh reports"}
          </button>
        </div>

        {isLoading && (
          <p className="mb-5 rounded-lg bg-[#fffefa] p-4 text-sm text-slate-600" role="status">
            Loading reports from CampusFix...
          </p>
        )}
        {errorMessage && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
            <p>{errorMessage}</p>
            <button type="button" className="mt-2 font-semibold underline" onClick={() => refreshIssues()}>
              Try again
            </button>
          </div>
        )}
        {successMessage && (
          <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700" role="status">
            {successMessage}
          </p>
        )}
        {escalationError && (
          <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800" role="status">
            Escalations could not be loaded: {escalationError}
          </p>
        )}

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

            {!isLoading && !errorMessage && <section className="mb-9 grid grid-cols-2 gap-3 lg:grid-cols-4">
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
            </section>}

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
                      {recentIssues.map((item) => (
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
                            <span className="mt-1 block text-[10px] text-slate-400">
                              {item.reporter_name} · {formatDate(item.created_at)}
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
                              {formatStatus(item.status)}
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

                      {!isLoading && !errorMessage && recentIssues.length === 0 && (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-4 py-8 text-center text-slate-500"
                          >
                            No issue reports yet.
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
            issues={issues}
            escalations={escalations}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onRefresh={async () => {
              await refreshIssues(true);
              await refreshEscalations();
            }}
            onLoadIssue={(id) => api.getIssue(id)}
            onUpdatePriority={(id, priority) => updateIssue(
              () => api.updateIssuePriority(id, priority),
              "Priority updated successfully.",
            )}
            onUpdateStatus={(id, status, note) => updateIssue(
              () => api.updateIssueStatus(id, status, note),
              "Status updated successfully.",
            )}
            onResolve={(id, note) => updateIssue(
              () => api.resolveIssue(id, note),
              "Issue resolved and resolution note saved.",
            )}
          />
        )}

        {/* ADMIN ANALYTICS PAGE */}

        {activeTab === "analytics" && (
          analyticsLoading
            ? <p className="rounded-lg bg-[#fffefa] p-4 text-sm text-slate-600" role="status">Loading database analytics...</p>
            : analyticsError
              ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{analyticsError}<button type="button" className="ml-3 font-semibold underline" onClick={refreshAnalytics}>Try again</button></div>
              : analytics && <AdminAnalytics analytics={analytics} />
        )}

      </div>
    </AppShell>
  );
}
