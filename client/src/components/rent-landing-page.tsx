import React, { useEffect, useState } from "react";

// WARNING: Do not commit real tokens to public repos. Use env vars in production!
const MONDAY_API_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjUzOTcyMTg4NCwiYWFpIjoxMSwidWlkIjo3ODE3NzU4NCwiaWFkIjoiMjAyNS0wNy0xNlQxMjowMDowOC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NTUxNjQ0NSwicmduIjoidXNlMSJ9.s43_kjRmv-QaZ92LYdRlEvrq9CYqxKhh3XXpR-8nhKU";
const BOARD_ID = "8740450373";

interface ColumnValue {
  id: string;
  value: string;
  text: string;
}

interface Subitem {
  id: string;
  name: string;
  column_values: ColumnValue[];
}

interface Item {
  id: string;
  name: string;
  subitems: Subitem[];
}

const MONDAY_QUERY = `query {\n  boards(ids: ${BOARD_ID}, state: all) {\n    items_page(limit: 100) {\n      items {\n        id\n        name\n        subitems {\n          id\n          name\n          column_values {\n            id\n            value\n            text\n          }\n        }\n      }\n    }\n  }\n}`;

async function fetchMondayData() {
  const res = await fetch("/.netlify/functions/monday-vacant-apartments", {
    method: "POST"
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  // Try to parse as JSON, but handle HTML or invalid JSON gracefully
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new SyntaxError("Response was not valid JSON. Possible server error or misconfiguration.");
  }
  if (!data?.units) {
    throw new Error("No units data returned from API.");
  }
  return data.units;
}

interface Unit {
  id: string;
  name: string;
  propertyName: string;
  unitType: string;
  status: string;
}

const RentLandingPage: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMondayData()
      .then((units: Unit[]) => {
        setUnits(units);
        setLoading(false);
      })
      .catch((err) => {
        let msg = "Failed to load data.";
        if (err instanceof SyntaxError) {
          msg = "Server returned invalid data. Please check your backend/API.";
        } else if (err instanceof Error && err.message) {
          msg = err.message;
        }
        setError(msg);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (units.length === 0) return <div>No vacant apartments found.</div>;

  return (
    <div className="rent-cards">
      {units.map((unit) => (
        <div key={unit.id} className="rent-card">
          {/* If you add an image link to the Netlify function, render it here! */}
          <h3>{unit.name}</h3>
          <ul>
            <li><strong>Property:</strong> {unit.propertyName}</li>
            <li><strong>Type:</strong> {unit.unitType}</li>
            <li><strong>Status:</strong> {unit.status}</li>
          </ul>
        </div>
      ))}
    </div>
  );
};

export default RentLandingPage;
