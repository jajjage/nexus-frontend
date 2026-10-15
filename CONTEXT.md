# Nexus Frontend

Nexus Frontend is the web application for customer self-service, reseller workflows, and admin operations.

## Language

**Admin Activity Overview**:
A compact admin-facing summary of a user's wallet, top-up, payment, webhook, and snapshot activity before detailed drill-downs.
_Avoid_: User details summary, activity feed, dashboard stats

**Dashboard Announcement Modal**:
A time-bound in-app announcement shown as a modal when an eligible mobile user enters the dashboard.
_Avoid_: Alert notification, promo popup

**Targeted Announcement**:
An admin-created announcement whose audience is either all users or selected individual users.
_Avoid_: User blast, notification campaign

**Active User**:
A customer-facing user who has performed meaningful product activity within the configured recent-activity window.

**At-Risk User**:
A previously active customer-facing user whose meaningful activity has fallen below the expected engagement pattern for the configured early-warning window.

**Churned User**:
A previously active customer-facing user who has performed no meaningful product activity for the configured churn window.

**Dormant User**:
A customer-facing user who has performed no meaningful product activity for the configured extended-inactivity window, which is longer than the churn window.

Initial default windows are 30 days for At-Risk, 90 days for Churned, and 180 days for Dormant. These windows are configurable and apply only after a user has completed meaningful activity. A user who has never completed meaningful activity is classified separately as Never Activated.

Lifecycle segments are mutually exclusive and ordered by current state: Never Activated, Active, At Risk, Churned, then Dormant. A successful meaningful action immediately returns a Churned or Dormant user to Active; failed actions do not. The prior segment and reactivation date remain available for reporting.

Lifecycle classification is separate from outreach execution. The initial capability classifies, filters, inspects, and exports users; automated outreach requires consent and channel preferences, opt-out and suppression handling, frequency caps, and outreach history. Initial outreach should prioritize learning why users stopped or failed to activate; discounts or other incentives are later experiments, not the default treatment.

The recommended feedback prompt is: “Why haven’t you been using Nexus recently?” Suggested reasons are technical problem, could not find what was needed, pricing or value, no longer needed, switched service, needs help getting started, and other. The response may include optional free text and a support contact.

Outreach eligibility excludes users without required consent or who opted out; deleted, suspended, blocked, or fraud-flagged accounts; invalid, bounced, or complained-about contacts; users already contacted within the frequency-cap window; users with unresolved support cases unless the message is support-related; and recently reactivated users.

Recommended outreach frequency is no more than one lifecycle message per user every 30 days and no more than three lifecycle messages in any rolling 180-day period. Outreach stops immediately when the user responds, opts out, or reactivates through meaningful activity.

The users page exposes lifecycle as a filterable segment with row badges, segment counts, last meaningful activity, days inactive, activation date, last reactivation, prior segment history, and export of the filtered segment. Never Activated, Churned, and Dormant remain visibly distinct.

Lifecycle is a full vertical-slice capability: the backend derives state from authoritative activity records, exposes the segment and supporting dates through the API, and the frontend filters, displays, and exports it. Lifecycle state is not a frontend-only label.

Lifecycle timestamps are stored in UTC. Classification uses elapsed 24-hour periods from the latest meaningful activity on the server. Dates are displayed in the tenant’s configured time zone, and the same server-side calculation powers counts, filters, exports, and user details.

The initial 30/90/180-day thresholds are centrally configured and versioned rather than editable by individual admins. Threshold changes record the previous values, new values, actor, and effective date. Tenant-level threshold configuration is deferred until a demonstrated reporting or campaign-isolation need exists.

Lifecycle transitions, outreach attempts, responses, opt-outs, and suppression events are retained for 24 months. Aggregate reporting may outlive that period without retaining unnecessary personal details. Retention can later become configurable for legal or tenant-specific requirements.

**Meaningful User Activity**:
An authenticated action that demonstrates product use or business intent; passive exposure such as receiving a message does not count by itself.

For lifecycle classification, this includes successful purchases or top-ups, wallet funding or payment activity, successful API requests for API users, reseller transactions, and user-initiated support interactions. Login counts only when paired with a meaningful product action. Notifications received, email opens, passive app opens, failed requests, and admin actions do not count by themselves.
