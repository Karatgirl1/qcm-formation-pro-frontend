import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowBack,
  Delete,
  OpenInNew,
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

type ActiveSession = {
  id: number;
  code: string;
  status: string;
  started_at: string | null;
  participants_count: number;
  qcm: {
    id: number;
    title: string;
  };
};

export default function ActiveSessions() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] =
    useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadSessions = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get("/sessions/active");
      setSessions(response.data?.sessions ?? []);
    } catch (error: any) {
      console.error(error);

      setErrorMessage(
        error.response?.data?.message ??
          "Impossible de charger les sessions actives."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  const deleteSession = async (session: ActiveSession) => {
    const confirmed = window.confirm(
      `Supprimer définitivement la session ${session.code} de « ${session.qcm.title} » ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(session.id);

      await api.delete(`/sessions/${session.id}`);

      setSessions((current) =>
        current.filter((item) => item.id !== session.id)
      );
    } catch (error: any) {
      console.error(error);

      alert(
        error.response?.data?.message ??
          "Impossible de supprimer cette session."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F4F6FA",
        p: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1000, mx: "auto" }}>
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

        <Typography
          variant="h3"
          sx={{
            color: "#071F4A",
            fontWeight: 800,
            mb: 1,
          }}
        >
          Sessions en cours
        </Typography>

        <Typography
          sx={{
            color: "#667085",
            mb: 4,
          }}
        >
          Retrouvez ici toutes les sessions actuellement ouvertes.
        </Typography>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : sessions.length === 0 ? (
          <Alert severity="info">
            Aucune session n’est actuellement en cours.
          </Alert>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {sessions.map((session) => (
              <Card
                key={session.id}
                sx={{
                  borderRadius: 3,
                  boxShadow:
                    "0 6px 25px rgba(7,31,74,0.08)",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          color: "#071F4A",
                          fontWeight: 800,
                        }}
                      >
                        {session.qcm.title}
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          flexWrap: "wrap",
                          mt: 1.5,
                        }}
                      >
                        <Chip
                          label={`Code : ${session.code}`}
                          variant="outlined"
                        />

                        <Chip
                          label={`${session.participants_count} participant${
                            session.participants_count > 1
                              ? "s"
                              : ""
                          }`}
                        />

                        <Chip
                          label="En cours"
                          color="success"
                        />
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <Button
                        variant="outlined"
                        startIcon={<OpenInNew />}
                        onClick={() =>
                          navigate(
                            `/qcms/${session.qcm.id}/sessions`
                          )
                        }
                        sx={{
                          color: "#071F4A",
                          borderColor: "#071F4A",
                          textTransform: "none",
                          fontWeight: 700,
                        }}
                      >
                        Voir
                      </Button>

                      <Button
                        color="error"
                        variant="outlined"
                        startIcon={<Delete />}
                        disabled={deletingId === session.id}
                        onClick={() =>
                          void deleteSession(session)
                        }
                        sx={{
                          textTransform: "none",
                          fontWeight: 700,
                        }}
                      >
                        {deletingId === session.id
                          ? "Suppression..."
                          : "Supprimer"}
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}