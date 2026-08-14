import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowBack,
  Assessment,
  History,
  Visibility,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";

import api from "../api/axios";

type QcmResultSummary = {
  id: number;
  title: string;
  description: string | null;
  sessions_count: number;
  closed_sessions_count: number;
  active_sessions_count: number;
  participants_count: number;
  completed_participants_count: number;
  average_result: number | null;
  last_session_at: string | null;
};

type ResultsResponse = {
  qcms: QcmResultSummary[];
};

function formatDate(value: string | null) {
  if (!value) {
    return "Aucune session";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function Results() {
  const navigate = useNavigate();

  const [qcms, setQcms] = useState<QcmResultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await api.get<ResultsResponse>(
          "/results/qcms"
        );

        setQcms(response.data?.qcms ?? []);
      } catch (error: any) {
        console.error(
          "Erreur lors du chargement des résultats :",
          error
        );

        setErrorMessage(
          error.response?.data?.message ??
            "Impossible de charger les résultats."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadResults();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#F4F6FA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F4F6FA",
        p: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/dashboard")}
          sx={{
            mb: 3,
            color: "#071F4A",
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          Retour au tableau de bord
        </Button>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 1,
          }}
        >
          <Assessment
            sx={{
              color: "#E3062C",
              fontSize: 38,
            }}
          />

          <Typography
            variant="h3"
            sx={{
              color: "#071F4A",
              fontWeight: 800,
            }}
          >
            Résultats par QCM
          </Typography>
        </Box>

        <Typography
          sx={{
            color: "#667085",
            mb: 4,
          }}
        >
          Consultez les statistiques de chaque QCM puis ouvrez
          son historique pour voir le détail des sessions.
        </Typography>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        {qcms.length === 0 ? (
          <Alert severity="info">
            Aucun QCM n’est encore disponible.
          </Alert>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, 1fr)",
              },
              gap: 3,
            }}
          >
            {qcms.map((qcm) => (
              <Card
                key={qcm.id}
                sx={{
                  borderRadius: 3,
                  boxShadow:
                    "0 6px 25px rgba(7,31,74,0.08)",
                  borderTop: "5px solid #071F4A",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      color: "#071F4A",
                      fontWeight: 800,
                    }}
                  >
                    {qcm.title}
                  </Typography>

                  <Typography
                    sx={{
                      color: "#667085",
                      mt: 1,
                      minHeight: 48,
                    }}
                  >
                    {qcm.description || "Aucune description"}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1,
                      mt: 2.5,
                    }}
                  >
                    <Chip
                      label={`${qcm.sessions_count} session${
                        qcm.sessions_count > 1 ? "s" : ""
                      }`}
                      icon={<History />}
                    />

                    <Chip
                      label={`${qcm.participants_count} participation${
                        qcm.participants_count > 1 ? "s" : ""
                      }`}
                    />

                    {qcm.active_sessions_count > 0 && (
                      <Chip
                        label={`${qcm.active_sessions_count} active${
                          qcm.active_sessions_count > 1 ? "s" : ""
                        }`}
                        color="success"
                      />
                    )}
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                      },
                      gap: 2,
                      mt: 3,
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: "#F8FAFC",
                        borderRadius: 2,
                        p: 2,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "#667085" }}
                      >
                        Résultat moyen
                      </Typography>

                      <Typography
                        variant="h4"
                        sx={{
                          color: "#071F4A",
                          fontWeight: 800,
                          mt: 0.5,
                        }}
                      >
                        {qcm.average_result === null
                          ? "—"
                          : `${qcm.average_result} %`}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        bgcolor: "#F8FAFC",
                        borderRadius: 2,
                        p: 2,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "#667085" }}
                      >
                        QCM terminés
                      </Typography>

                      <Typography
                        variant="h4"
                        sx={{
                          color: "#071F4A",
                          fontWeight: 800,
                          mt: 0.5,
                        }}
                      >
                        {qcm.completed_participants_count}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      color: "#667085",
                      mt: 2.5,
                    }}
                  >
                    Dernière session :{" "}
                    {formatDate(qcm.last_session_at)}
                  </Typography>

                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Visibility />}
                    onClick={() =>
                      navigate(`/qcms/${qcm.id}/sessions`)
                    }
                    sx={{
                      mt: 3,
                      bgcolor: "#E3062C",
                      textTransform: "none",
                      fontWeight: 800,
                      py: 1.2,
                      "&:hover": {
                        bgcolor: "#C80527",
                      },
                    }}
                  >
                    Voir les résultats
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}