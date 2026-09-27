import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

type Result = {
  score: number;
  total_points: number;
  percentage: number | null;
  completed: boolean;
};

type GlobalResult = {
  score: number;
  total_points: number;
  percentage: number | null;
};

type Participant = {
  first_name: string;
  last_name: string;
  first_result: Result | null;
  second_result: Result | null;
  global_result: GlobalResult | null;
};

type GroupResults = {
  group_id: number;
  first_qcm: {
    title: string;
    session_id: number;
  };
  second_qcm: {
    title: string;
    session_id: number;
  };
  participants: Participant[];
};

function formatResult(result: Result | GlobalResult | null) {
  if (!result) {
    return "—";
  }

  if ("completed" in result && !result.completed) {
    return "Non terminé";
  }

  return `${result.score}/${result.total_points}${
    result.percentage !== null ? ` (${result.percentage} %)` : ""
  }`;
}

export default function SharedGroupResults() {
  const { token } = useParams<{ token: string }>();

  const [data, setData] = useState<GroupResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Lien de partage invalide.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadResults() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<GroupResults>(
          `/public/result-groups/${encodeURIComponent(token!)}`
        );

        if (!cancelled) {
          setData(response.data);
        }
      } catch (err: unknown) {
        if (cancelled) return;

        const apiError = err as {
          response?: {
            status?: number;
            data?: { message?: string };
          };
        };

        if (apiError.response?.status === 404) {
          setError("Ce lien de partage est invalide ou désactivé.");
        } else {
          setError(
            apiError.response?.data?.message ??
              "Impossible de charger les résultats."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadResults();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <main style={{ padding: 24 }}>
        Chargement des résultats…
      </main>
    );
  }

  if (error || !data) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Bilan commun des QCM</h1>
        <p role="alert">
          {error || "Aucun résultat disponible."}
        </p>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: 24,
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <h1>Bilan commun des QCM</h1>

      <p>
        Ce tableau présente les résultats des deux sessions et le score
        cumulé des participants ayant terminé les deux QCM.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead>
            <tr>
              {[
                "Participant",
                `${data.first_qcm.title} — session ${data.first_qcm.session_id}`,
                `${data.second_qcm.title} — session ${data.second_qcm.session_id}`,
                "Résultat global",
              ].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  style={{
                    padding: 12,
                    borderBottom: "2px solid #071F4A",
                    background: "#eef2f8",
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.participants.map((participant, index) => (
              <tr
                key={`${participant.first_name}-${participant.last_name}-${index}`}
              >
                <th
                  scope="row"
                  style={{
                    padding: 12,
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  {participant.first_name} {participant.last_name}
                </th>

                <td
                  style={{
                    padding: 12,
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  {formatResult(participant.first_result)}
                </td>

                <td
                  style={{
                    padding: 12,
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  {formatResult(participant.second_result)}
                </td>

                <td
                  style={{
                    padding: 12,
                    borderBottom: "1px solid #ddd",
                    fontWeight: "bold",
                  }}
                >
                  {formatResult(participant.global_result)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.participants.length === 0 && (
        <p>Aucun participant dans ces sessions.</p>
      )}
    </main>
  );
}