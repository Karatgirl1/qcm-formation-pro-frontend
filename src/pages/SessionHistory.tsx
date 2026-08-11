import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowBack,
  CheckCircle,
  ContentCopy,
  Download,
  History,
  LinkOff,
  Share,
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import api from "../api/axios";
import * as XLSX from "xlsx";

type HistorySession = {
  id: number;
  code: string;
  status: "open" | "closed";
  started_at: string | null;
  ended_at: string | null;
  participants_count: number;
  sharing_enabled: boolean;
};

type HistoryResponse = {
  qcm: {
    id: number;
    title: string;
  };
  sessions: HistorySession[];
};

type ParticipantDetail = {
  question_id: number;
  question: string;
  selected_answers: string[];
  correct_answers: string[];
  is_correct: boolean;
  points_awarded: number;
  points_possible: number;
};

type Participant = {
  id: number;
  first_name: string;
  last_name: string;
  completed_at: string | null;
  score: number;
  total_points: number;
  live_score?: number;
  details?: ParticipantDetail[];
};

type SessionDetails = {
  id: number;
  code: string;
  status: "open" | "closed";
  started_at: string | null;
  ended_at: string | null;
  qcm: {
    id: number;
    title: string;
  };
  participants: Participant[];
};

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function SessionHistory() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [history, setHistory] =
    useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedSession, setSelectedSession] =
    useState<SessionDetails | null>(null);
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null);
  const [loadingSessionId, setLoadingSessionId] =
    useState<number | null>(null);
  const [exportingSessionId, setExportingSessionId] =
    useState<number | null>(null);
  const [sharingSessionId, setSharingSessionId] =
    useState<number | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      if (!id) {
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const response = await api.get(
          `/qcms/${id}/sessions`
        );

        setHistory(response.data);
      } catch (error: any) {
        console.error(error);
        setErrorMessage(
          error.response?.data?.message ??
            "Impossible de charger l’historique."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadHistory();
  }, [id]);

  const totalParticipants = useMemo(
    () =>
      history?.sessions.reduce(
        (total, session) =>
          total + session.participants_count,
        0
      ) ?? 0,
    [history]
  );

  const openResults = async (sessionId: number) => {
    try {
      setLoadingSessionId(sessionId);

      const response = await api.get(
        `/sessions/${sessionId}`
      );

      setSelectedSession(response.data);
    } catch (error: any) {
      alert(
        error.response?.data?.message ??
          "Impossible de charger les résultats de cette session."
      );
    } finally {
      setLoadingSessionId(null);
    }
  };


  const shareSessionResults = async (
    sessionId: number
  ) => {
    try {
      setSharingSessionId(sessionId);

      const response = await api.post(
        `/sessions/${sessionId}/share`
      );

      const token = response.data?.share_token;

      if (!token) {
        throw new Error(
          "Le lien de partage n’a pas pu être généré."
        );
      }

      const shareUrl =
        `${window.location.origin}/shared-results/${token}`;

      await navigator.clipboard.writeText(shareUrl);

      setHistory((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          sessions: current.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  sharing_enabled: true,
                }
              : session
          ),
        };
      });

      alert(
        "Le lien de consultation a été copié. Vous pouvez maintenant l’envoyer à la personne de votre choix."
      );
    } catch (error: any) {
      console.error(error);

      alert(
        error.response?.data?.message ??
          error.message ??
          "Impossible de créer le lien de partage."
      );
    } finally {
      setSharingSessionId(null);
    }
  };

  const disableSessionShare = async (
    sessionId: number
  ) => {
    const confirmed = window.confirm(
      "Désactiver ce lien de partage ? La personne qui possède l’ancien lien ne pourra plus consulter les résultats."
    );

    if (!confirmed) {
      return;
    }

    try {
      setSharingSessionId(sessionId);

      await api.delete(
        `/sessions/${sessionId}/share`
      );

      setHistory((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          sessions: current.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  sharing_enabled: false,
                }
              : session
          ),
        };
      });

      alert("Le partage a été désactivé.");
    } catch (error: any) {
      console.error(error);

      alert(
        error.response?.data?.message ??
          "Impossible de désactiver le partage."
      );
    } finally {
      setSharingSessionId(null);
    }
  };

  const exportSessionExcel = async (
    sessionId: number,
    sessionCode: string
  ) => {
    try {
      setExportingSessionId(sessionId);

      const response = await api.get(
        `/sessions/${sessionId}`
      );

      const sessionDetails: SessionDetails =
        response.data;

      const summaryRows = sessionDetails.participants.map(
        (participant) => {
          const percentage =
            participant.total_points > 0
              ? Math.round(
                  (participant.score /
                    participant.total_points) *
                    100
                )
              : 0;

          return {
            Prénom: participant.first_name,
            Nom: participant.last_name,
            Statut: participant.completed_at
              ? "Terminé"
              : "En cours",
            Score: participant.score,
            "Total points": participant.total_points,
            "Réussite (%)": percentage,
          };
        }
      );

      const detailRows =
        sessionDetails.participants.flatMap(
          (participant) =>
            (participant.details ?? []).map(
              (detail, index) => ({
                Prénom: participant.first_name,
                Nom: participant.last_name,
                "N° question": index + 1,
                Question: detail.question,
                "Réponse donnée":
                  detail.selected_answers.length > 0
                    ? detail.selected_answers.join(", ")
                    : "Aucune réponse",
                "Bonne réponse":
                  detail.correct_answers.join(", "),
                Résultat: detail.is_correct
                  ? "Correct"
                  : "Incorrect",
                "Points obtenus":
                  detail.points_awarded,
                "Points possibles":
                  detail.points_possible,
              })
            )
        );

      const workbook = XLSX.utils.book_new();

      const summarySheet =
        XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(
        workbook,
        summarySheet,
        "Résultats"
      );

      const detailSheet =
        XLSX.utils.json_to_sheet(detailRows);
      XLSX.utils.book_append_sheet(
        workbook,
        detailSheet,
        "Détails"
      );

      const safeTitle = (
        sessionDetails.qcm?.title ?? "qcm"
      )
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9-_]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

      XLSX.writeFile(
        workbook,
        `resultats-${safeTitle || "qcm"}-${sessionCode}.xlsx`
      );
    } catch (error: any) {
      console.error(error);

      alert(
        error.response?.data?.message ??
          "Impossible d’exporter cette session."
      );
    } finally {
      setExportingSessionId(null);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#F4F6FA",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (errorMessage || !history) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          {errorMessage || "Historique introuvable."}
        </Alert>
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
          onClick={() => navigate(`/qcms/${id}`)}
          sx={{
            mb: 3,
            color: "#071F4A",
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          Retour au QCM
        </Button>

        <Card
          sx={{
            borderRadius: 3,
            boxShadow: "0 6px 25px rgba(7,31,74,0.10)",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                mb: 1,
              }}
            >
              <History sx={{ color: "#E3062C", fontSize: 36 }} />
              <Typography
                variant="h4"
                sx={{
                  color: "#071F4A",
                  fontWeight: 800,
                }}
              >
                Historique des sessions
              </Typography>
            </Box>

            <Typography sx={{ color: "#667085", mb: 4 }}>
              {history.qcm.title}
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                },
                gap: 2,
                mb: 4,
              }}
            >
              <InfoCard
                title="Sessions"
                value={String(history.sessions.length)}
              />
              <InfoCard
                title="Participations"
                value={String(totalParticipants)}
              />
            </Box>

            {history.sessions.length === 0 ? (
              <Alert severity="info">
                Aucune session n’a encore été créée pour ce QCM.
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                      <TableCell>Code</TableCell>
                      <TableCell>Début</TableCell>
                      <TableCell>Fin</TableCell>
                      <TableCell align="center">
                        Participants
                      </TableCell>
                      <TableCell align="center">
                        Statut
                      </TableCell>
                      <TableCell align="center">
                        Résultats
                      </TableCell>
                      <TableCell align="center">
                        Partage
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {history.sessions.map((session) => (
                      <TableRow key={session.id} hover>
                        <TableCell>
                          <Typography
                            sx={{
                              color: "#071F4A",
                              fontWeight: 800,
                              letterSpacing: 1,
                            }}
                          >
                            {session.code}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {formatDate(session.started_at)}
                        </TableCell>

                        <TableCell>
                          {formatDate(session.ended_at)}
                        </TableCell>

                        <TableCell align="center">
                          {session.participants_count}
                        </TableCell>

                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={
                              session.status === "open"
                                ? "Ouverte"
                                : "Fermée"
                            }
                            color={
                              session.status === "open"
                                ? "success"
                                : "default"
                            }
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              justifyContent: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={
                                loadingSessionId ===
                                session.id ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <Visibility />
                                )
                              }
                              onClick={() =>
                                void openResults(session.id)
                              }
                              disabled={
                                loadingSessionId === session.id
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
                              size="small"
                              variant="contained"
                              startIcon={
                                exportingSessionId ===
                                session.id ? (
                                  <CircularProgress
                                    size={16}
                                    sx={{ color: "white" }}
                                  />
                                ) : (
                                  <Download />
                                )
                              }
                              onClick={() =>
                                void exportSessionExcel(
                                  session.id,
                                  session.code
                                )
                              }
                              disabled={
                                exportingSessionId ===
                                session.id
                              }
                              sx={{
                                bgcolor: "#071F4A",
                                textTransform: "none",
                                fontWeight: 700,
                                "&:hover": {
                                  bgcolor: "#0A2A63",
                                },
                              }}
                            >
                              Excel
                            </Button>
                          </Box>
                        </TableCell>

                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              justifyContent: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={
                                session.sharing_enabled ? (
                                  <ContentCopy />
                                ) : (
                                  <Share />
                                )
                              }
                              onClick={() =>
                                void shareSessionResults(
                                  session.id
                                )
                              }
                              disabled={
                                sharingSessionId ===
                                session.id
                              }
                              sx={{
                                color: "#071F4A",
                                borderColor: "#071F4A",
                                textTransform: "none",
                                fontWeight: 700,
                              }}
                            >
                              {session.sharing_enabled
                                ? "Copier le lien"
                                : "Partager"}
                            </Button>

                            {session.sharing_enabled && (
                              <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                startIcon={<LinkOff />}
                                onClick={() =>
                                  void disableSessionShare(
                                    session.id
                                  )
                                }
                                disabled={
                                  sharingSessionId ===
                                  session.id
                                }
                                sx={{
                                  textTransform: "none",
                                  fontWeight: 700,
                                }}
                              >
                                Désactiver
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>

      <Dialog
        open={selectedSession !== null}
        onClose={() => setSelectedSession(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            color: "#071F4A",
            fontWeight: 800,
          }}
        >
          Résultats de la session{" "}
          {selectedSession?.code}
        </DialogTitle>

        <DialogContent dividers>
          {!selectedSession ||
          selectedSession.participants.length === 0 ? (
            <Alert severity="info">
              Aucun participant pour cette session.
            </Alert>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {selectedSession.participants.map(
                (participant) => {
                  const percentage =
                    participant.total_points > 0
                      ? Math.round(
                          (participant.score /
                            participant.total_points) *
                            100
                        )
                      : null;

                  return (
                    <Card
                      key={participant.id}
                      variant="outlined"
                      sx={{ borderRadius: 2 }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems: "center",
                            gap: 2,
                            flexWrap: "wrap",
                          }}
                        >
                          <Box>
                            <Typography
                              sx={{
                                color: "#071F4A",
                                fontWeight: 800,
                              }}
                            >
                              {participant.first_name}{" "}
                              {participant.last_name}
                            </Typography>

                            <Typography
                              variant="body2"
                              sx={{
                                color: "#667085",
                                mt: 0.5,
                              }}
                            >
                              {participant.completed_at
                                ? `Score : ${participant.score} / ${participant.total_points}${
                                    percentage !== null
                                      ? ` · ${percentage} %`
                                      : ""
                                  }`
                                : "En cours"}
                            </Typography>
                          </Box>

                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() =>
                              setSelectedParticipant(
                                participant
                              )
                            }
                            sx={{
                              color: "#071F4A",
                              borderColor: "#071F4A",
                              textTransform: "none",
                              fontWeight: 700,
                            }}
                          >
                            Détail
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                }
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setSelectedSession(null)}
            sx={{
              color: "#071F4A",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={selectedParticipant !== null}
        onClose={() => setSelectedParticipant(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            color: "#071F4A",
            fontWeight: 800,
          }}
        >
          Détail de {selectedParticipant?.first_name}{" "}
          {selectedParticipant?.last_name}
        </DialogTitle>

        <DialogContent dividers>
          {!selectedParticipant ||
          (selectedParticipant.details ?? []).length === 0 ? (
            <Alert severity="info">
              Aucune réponse détaillée enregistrée.
            </Alert>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {(selectedParticipant.details ?? []).map(
                (detail, index) => (
                  <Card
                    key={detail.question_id}
                    variant="outlined"
                    sx={{
                      borderColor: detail.is_correct
                        ? "#A6F4C5"
                        : "#FECDCA",
                      bgcolor: detail.is_correct
                        ? "#F6FEF9"
                        : "#FFFBFA",
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          gap: 2,
                          mb: 2,
                        }}
                      >
                        <Typography
                          sx={{
                            color: "#071F4A",
                            fontWeight: 800,
                          }}
                        >
                          {index + 1}. {detail.question}
                        </Typography>

                        <Chip
                          size="small"
                          icon={
                            detail.is_correct ? (
                              <CheckCircle />
                            ) : undefined
                          }
                          color={
                            detail.is_correct
                              ? "success"
                              : "error"
                          }
                          label={
                            detail.is_correct
                              ? "Correct"
                              : "Incorrect"
                          }
                        />
                      </Box>

                      <Typography
                        variant="body2"
                        sx={{ color: "#667085" }}
                      >
                        Réponse donnée
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          mb: 2,
                          color: detail.is_correct
                            ? "#027A48"
                            : "#B42318",
                        }}
                      >
                        {detail.selected_answers.length > 0
                          ? detail.selected_answers.join(", ")
                          : "Aucune réponse"}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{ color: "#667085" }}
                      >
                        Bonne réponse
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          color: "#027A48",
                          mb: 2,
                        }}
                      >
                        {detail.correct_answers.join(", ")}
                      </Typography>

                      <Divider sx={{ mb: 1.5 }} />

                      <Typography
                        variant="body2"
                        sx={{
                          color: "#071F4A",
                          fontWeight: 700,
                        }}
                      >
                        Points : {detail.points_awarded} /{" "}
                        {detail.points_possible}
                      </Typography>
                    </CardContent>
                  </Card>
                )
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setSelectedParticipant(null)}
            sx={{
              color: "#071F4A",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography
          variant="body2"
          sx={{ color: "#667085" }}
        >
          {title}
        </Typography>

        <Typography
          variant="h4"
          sx={{
            color: "#071F4A",
            fontWeight: 800,
            mt: 0.5,
          }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}