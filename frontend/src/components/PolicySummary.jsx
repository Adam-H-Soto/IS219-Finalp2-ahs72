export default function PolicySummary({ summary }) {
  if (!summary) return null;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.planName}>{summary.plan_name}</h2>
          <span style={styles.planTypeBadge}>{summary.plan_type}</span>
        </div>
      </div>

      <Section title="Costs">
        <Row label="Individual Deductible" value={summary.deductible_individual} />
        <Row label="Family Deductible" value={summary.deductible_family} />
        <Row label="OOP Max (Individual)" value={summary.out_of_pocket_max_individual} />
        <Row label="OOP Max (Family)" value={summary.out_of_pocket_max_family} />
      </Section>

      <Section title="Copays">
        <Row label="Primary Care" value={summary.primary_care_copay} />
        <Row label="Specialist" value={summary.specialist_copay} />
        <Row label="Emergency Room" value={summary.emergency_room_copay} />
      </Section>

      {summary.covered_services?.length > 0 && (
        <Section title="Covered Services">
          <TagList items={summary.covered_services} color="var(--accent)" />
        </Section>
      )}

      {summary.exclusions?.length > 0 && (
        <Section title="Exclusions">
          <TagList items={summary.exclusions} color="var(--danger)" />
        </Section>
      )}

      {summary.notes?.length > 0 && (
        <Section title="Notes">
          <ul style={styles.notesList}>
            {summary.notes.map((note, i) => (
              <li key={i} style={styles.note}>
                {note}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={styles.rowValue}>{value || "Not specified"}</span>
    </div>
  );
}

function TagList({ items, color }) {
  return (
    <div style={styles.tagList}>
      {items.map((item, i) => (
        <span
          key={i}
          style={{
            ...styles.tag,
            color,
            backgroundColor: color === "var(--accent)"
              ? "rgba(0, 201, 167, 0.1)"
              : "rgba(255, 107, 107, 0.1)",
            borderColor: color === "var(--accent)"
              ? "rgba(0, 201, 167, 0.2)"
              : "rgba(255, 107, 107, 0.2)",
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    overflow: "hidden",
  },
  header: {
    padding: "16px 18px",
    borderBottom: "1px solid var(--border)",
    backgroundColor: "var(--bg-secondary)",
  },
  planName: {
    fontFamily: "var(--font-display)",
    fontSize: 18,
    fontWeight: 400,
    color: "var(--text-primary)",
    marginBottom: 6,
  },
  planTypeBadge: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    color: "var(--accent)",
    backgroundColor: "var(--accent-dim)",
    border: "1px solid var(--border-accent)",
    borderRadius: 4,
    padding: "2px 8px",
  },
  section: {
    padding: "14px 18px",
    borderBottom: "1px solid var(--border)",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    marginBottom: 10,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 6,
    marginBottom: 6,
    borderBottom: "1px solid rgba(139,156,200,0.06)",
  },
  rowLabel: {
    fontSize: 13,
    color: "var(--text-secondary)",
  },
  rowValue: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-primary)",
    textAlign: "right",
  },
  tagList: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    fontSize: 12,
    padding: "3px 10px",
    borderRadius: 20,
    border: "1px solid",
  },
  notesList: {
    paddingLeft: 16,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  note: {
    fontSize: 13,
    color: "var(--text-secondary)",
    lineHeight: 1.5,
  },
};
