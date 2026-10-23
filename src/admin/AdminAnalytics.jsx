const STATUSES = [
  ["reported", "Reported"],
  ["assigned", "Assigned"],
  ["in_progress", "In progress"],
  ["resolved", "Resolved"],
  ["closed", "Closed"],
];
const PRIORITIES = ["low", "medium", "high", "urgent"];

export default function AdminAnalytics({ analytics }) {
  const total = analytics.total || 0;
  const resolved = analytics.resolved || 0;
  const resolutionRate = total === 0 ? 0 : Math.round((resolved / total) * 100);
  const categoryEntries = analytics.byCategory || [];

  return (
    <section>
      <div className="admin-section-heading">
        <div>
          <h2>Complaint Analytics</h2>
          <p>Statistics queried from the CampusFix database.</p>
        </div>
      </div>

      <div className="admin-analytics-grid">
        <div className="admin-panel">
          <h3>Resolution rate</h3>
          <p>Resolved or closed reports</p>
          <div className="admin-big-number">{resolutionRate}%</div>
          <div
            className="admin-progress-track"
            role="progressbar"
            aria-label="Resolution rate"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={resolutionRate}
          >
            <div className="admin-progress-fill" style={{ width: `${resolutionRate}%` }} />
          </div>
          <p>{resolved} of {total} reports resolved or closed</p>
        </div>

        <div className="admin-panel">
          <h3>By status</h3>
          {STATUSES.map(([status, label]) => {
            const count = analytics.byStatus?.[status] || 0;
            const percentage = total === 0 ? 0 : Math.round((count / total) * 100);
            return (
              <div className="admin-category" key={status}>
                <div className="admin-category-label">
                  <span>{label}</span>
                  <span>{count} ({percentage}%)</span>
                </div>
                <div
                  className="admin-progress-track"
                  role="progressbar"
                  aria-label={`${label} reports`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percentage}
                >
                  <div className="admin-progress-fill" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="admin-panel">
          <h3>By priority</h3>
          {PRIORITIES.map((priority) => (
            <div className="admin-category-label" key={priority}>
              <span className="capitalize">{priority}</span>
              <span>{analytics.byPriority?.[priority] || 0}</span>
            </div>
          ))}
        </div>

        <div className="admin-panel">
          <h3>By category</h3>
          {categoryEntries.length === 0 ? (
            <p>No reports to analyze yet.</p>
          ) : (
            categoryEntries.map(({ category, count }) => {
              const percentage = total === 0 ? 0 : Math.round((count / total) * 100);
              return (
                <div className="admin-category" key={category}>
                  <div className="admin-category-label">
                    <span>{category}</span>
                    <span>{count}</span>
                  </div>
                  <div
                    className="admin-progress-track"
                    role="progressbar"
                    aria-label={`${category} reports`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percentage}
                  >
                    <div className="admin-progress-fill" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
