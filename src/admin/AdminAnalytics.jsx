const STATUSES = ["Pending", "In Progress", "Resolved"];

export default function AdminAnalytics({ complaints }) {
  const total = complaints.length;
  const resolved = complaints.filter(
    (complaint) => complaint.status === "Resolved"
  ).length;
  const resolutionRate = total === 0
    ? 0
    : Math.round((resolved / total) * 100);
  const categories = complaints.reduce((counts, complaint) => {
    const category = complaint.category || "Uncategorized";
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});
  const categoryEntries = Object.entries(categories).sort(
    ([, countA], [, countB]) => countB - countA
  );

  return (
    <section>
      <div className="admin-section-heading">
        <div>
          <h2>Complaint Analytics</h2>
          <p>Overview of complaint statuses and reported categories.</p>
        </div>
      </div>

      <div className="admin-analytics-grid">
        <div className="admin-panel">
          <h3>Resolution rate</h3>
          <p>Complaints resolved</p>
          <div className="admin-big-number">{resolutionRate}%</div>
          <div
            className="admin-progress-track"
            role="progressbar"
            aria-label="Resolution rate"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={resolutionRate}
          >
            <div
              className="admin-progress-fill"
              style={{ width: `${resolutionRate}%` }}
            />
          </div>
          <p>{resolved} of {total} complaints resolved</p>
        </div>

        <div className="admin-panel">
          <h3>By status</h3>
          {STATUSES.map((status) => {
            const count = complaints.filter(
              (complaint) => complaint.status === status
            ).length;
            const percentage = total === 0
              ? 0
              : Math.round((count / total) * 100);

            return (
              <div className="admin-category" key={status}>
                <div className="admin-category-label">
                  <span>{status}</span>
                  <span>{count} ({percentage}%)</span>
                </div>
                <div
                  className="admin-progress-track"
                  role="progressbar"
                  aria-label={`${status} complaints`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percentage}
                >
                  <div
                    className="admin-progress-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="admin-panel">
          <h3>By category</h3>
          {categoryEntries.length === 0 ? (
            <p>No complaints to analyze yet.</p>
          ) : (
            categoryEntries.map(([category, count]) => {
              const percentage = total === 0
                ? 0
                : Math.round((count / total) * 100);

              return (
                <div className="admin-category" key={category}>
                  <div className="admin-category-label">
                    <span>{category}</span>
                    <span>{count}</span>
                  </div>
                  <div
                    className="admin-progress-track"
                    role="progressbar"
                    aria-label={`${category} complaints`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percentage}
                  >
                    <div
                      className="admin-progress-fill"
                      style={{ width: `${percentage}%` }}
                    />
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