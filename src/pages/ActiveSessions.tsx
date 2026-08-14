import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowBack,
  ContentCopy,
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
  TextField,
  Typography,
} from "@mui/material";

import { QRCodeSVG } from "qrcode.react";

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
  const [copiedSessionId, setCopiedSessionId] =
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

  const getParticipantUrl = (code: string) =>
    `${window.location.origin}/join/${code}`;

  const copyParticipantLink = async (
    session: ActiveSession
  ) => {
    const participantUrl = getParticipantUrl(session.code);

    try {
      await navigator.clipboard.writeText(participantUrl);

      setCopiedSessionId(session.id);

      window.setTimeout(() => {
        setCopiedSessionId((current) =>
          current === session.id ? null : current
        );
      }, 2000);
    } catch (error) {
      console.error(error);
      alert(
        "Impossible de copier automatiquement le lien. Vous pouvez le sélectionner manuellement."
      );
    }
  };

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
          Retrouvez ici toutes les sessions actuellement ouvertes,
          leur QR code et le lien à transmettre aux participants.
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
              gap: 3,
            }}
          >
            {sessions.map((session) => {
              const participantUrl =
                getParticipantUrl(session.code);

              return (
                <Card
                  key={session.id}
                  sx={{
                    borderRadius: 3,
                    boxShadow:
                      "0 6px 25px rgba(7,31,74,0.08)",
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 2,
                        flexWrap: "wrap",
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 240 }}>
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

                    <Box
                      sx={{
                        mt: 3,
                        pt: 3,
                        borderTop: "1px solid #E4E7EC",
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "220px 1fr",
                        },
                        gap: 3,
                        alignItems: "center",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: {
                            xs: "center",
                            md: "flex-start",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            bgcolor: "white",
                            p: 2,
                            borderRadius: 2,
                            border: "1px solid #E4E7EC",
                          }}
                        >
                          <QRCodeSVG
                            value={participantUrl}
                            size={180}
                            level="M"
                            marginSize={2}
                          />
                        </Box>
                      </Box>

                      <Box>
                        <Typography
                          sx={{
                            color: "#071F4A",
                            fontWeight: 800,
                            mb: 1,
                          }}
                        >
                          Lien participant
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{
                            color: "#667085",
                            mb: 2,
                          }}
                        >
                          Les participants peuvent scanner le QR code
                          ou utiliser ce lien pour rejoindre directement
                          la session.
                        </Typography>

                        <TextField
                          fullWidth
                          value={participantUrl}
                          slotProps={{
                            htmlInput: {
                              readOnly: true,
                            },
                          }}
                          sx={{ mb: 1.5 }}
                        />

                        <Button
                          variant="contained"
                          startIcon={<ContentCopy />}
                          onClick={() =>
                            void copyParticipantLink(session)
                          }
                          sx={{
                            bgcolor: "#E3062C",
                            textTransform: "none",
                            fontWeight: 800,
                            "&:hover": {
                              bgcolor: "#C80527",
                            },
                          }}
                        >
                          {copiedSessionId === session.id
                            ? "Lien copié"
                            : "Copier le lien"}
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}