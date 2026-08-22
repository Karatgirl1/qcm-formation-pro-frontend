import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import api from "../api/axios";

type SharedParticipantDetail = {
  question_id: number;
  question: string;
  selected_answers: string[];
  text_answers: string[];
  correct_answers: string[];
  is_correct: boolean;
  points_awarded: number;
  points_possible: number;
};

type SharedParticipant = {
  id: number;
  first_name: string;
  last_name: string;
  score: number;
  total_points: number;
  percentage: number | null;
  details: SharedParticipantDetail[];
};

type RankedParticipant = SharedParticipant & {
  rank: number;
};

type SharedResultsResponse = {
  session: {
    code: string;
    status: "open" | "closed";
    started_at: string | null;
    ended_at: string | null;
    qcm_title: string;
  };
  participants: SharedParticipant[];
};

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function SharedResults() {
  const { token = "" } = useParams();

  const [data, setData] =
    useState<SharedResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [selectedParticipant, setSelectedParticipant] =
    useState<RankedParticipant | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await api.get(
          `/public/results/${token}`
        );

        setData(response.data);
      } catch (error: any) {
        console.error(error);

        setErrorMessage(
          error.response?.data?.message ??
            "Impossible de consulter ces résultats."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadResults();
  }, [token]);

  const rankedParticipants = useMemo(() => {
    if (!data) {
      return [];
    }

    const sorted = [...data.participants].sort(
      (first, second) => {
        const firstPercentage =
          first.percentage ?? -1;
        const secondPercentage =
          second.percentage ?? -1;

        if (
          secondPercentage !== firstPercentage
        ) {
          return (
            secondPercentage - firstPercentage
          );
        }

        if (second.score !== first.score) {
          return second.score - first.score;
        }

        const lastNameComparison =
          first.last_name.localeCompare(
            second.last_name,
            "fr-FR",
            { sensitivity: "base" }
          );

        if (lastNameComparison !== 0) {
          return lastNameComparison;
        }

        return first.first_name.localeCompare(
          second.first_name,
          "fr-FR",
          { sensitivity: "base" }
        );
      }
    );

    let previousPercentage: number | null =
      null;
    let previousRank = 0;

    return sorted.map(
      (participant, index) => {
        let rank = index + 1;

        if (
          participant.percentage !== null &&
          previousPercentage !== null &&
          participant.percentage ===
            previousPercentage
        ) {
          rank = previousRank;
        }

        previousPercentage =
          participant.percentage;
        previousRank = rank;

        return {
          ...participant,
          rank,
        };
      }
    );
  }, [data]);

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

  if (errorMessage || !data) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#F4F6FA",
          p: { xs: 2, md: 4 },
        }}
      >
        <Box sx={{ maxWidth: 850, mx: "auto" }}>
          <Alert severity="error">
            {errorMessage ||
              "Ce lien de partage n’est plus disponible."}
          </Alert>
        </Box>
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
      <Box sx={{ maxWidth: 1050, mx: "auto" }}>
        <Card
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            boxShadow:
              "0 12px 40px rgba(7,31,74,0.12)",
          }}
        >
          <Box
            sx={{
              height: 8,
              bgcolor: "#E3062C",
            }}
          />

          <CardContent
            sx={{ p: { xs: 3, md: 5 } }}
          >
            <Typography
              variant="h3"
              sx={{
                color: "#071F4A",
                fontWeight: 800,
              }}
            >
              Résultats de la session
            </Typography>

            <Typography
              variant="h5"
              sx={{
                color: "#071F4A",
                fontWeight: 700,
                mt: 2,
              }}
            >
              {data.session.qcm_title}
            </Typography>

            <Box
              sx={{
                mt: 2,
                display: "flex",
                gap: 1.5,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Chip
                label={`Session ${data.session.code}`}
                variant="outlined"
              />

              <Chip
                label={
                  data.session.status === "closed"
                    ? "Session terminée"
                    : "Session en cours"
                }
                color={
                  data.session.status === "closed"
                    ? "default"
                    : "success"
                }
              />
            </Box>

            <Typography
              sx={{
                color: "#667085",
                mt: 2,
                mb: 4,
              }}
            >
              Début :{" "}
              {formatDate(data.session.started_at)}
              {data.session.ended_at
                ? ` · Fin : ${formatDate(
                    data.session.ended_at
                  )}`
                : ""}
            </Typography>

            <Typography
              variant="h5"
              sx={{
                color: "#071F4A",
                fontWeight: 800,
                mb: 2,
              }}
            >
              Classement des participants
            </Typography>

            {rankedParticipants.length === 0 ? (
              <Alert severity="info">
                Aucun participant n’est enregistré pour
                cette session.
              </Alert>
            ) : (
              <TableContainer
                sx={{
                  border: "1px solid #E4E7EC",
                  borderRadius: 2,
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow
                      sx={{ bgcolor: "#F8FAFC" }}
                    >
                      <TableCell align="center">
                        <strong>Classement</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Nom</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Prénom</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Score</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Résultat</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Détails</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rankedParticipants.map(
                      (participant, index) => (
                        <TableRow
                          key={`${participant.id}-${index}`}
                          hover
                        >
                          <TableCell align="center">
                            <Typography
                              sx={{
                                fontWeight: 900,
                                color: "#071F4A",
                              }}
                            >
                              {participant.rank === 1
                                ? "🥇 1er"
                                : participant.rank === 2
                                  ? "🥈 2e"
                                  : participant.rank === 3
                                    ? "🥉 3e"
                                    : `${participant.rank}e`}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {participant.last_name}
                          </TableCell>

                          <TableCell>
                            {participant.first_name}
                          </TableCell>

                          <TableCell align="center">
                            {participant.score} /{" "}
                            {participant.total_points}
                          </TableCell>

                          <TableCell align="center">
                            <Typography
                              sx={{
                                color:
                                  participant.percentage ===
                                  null
                                    ? "#667085"
                                    : participant.percentage >=
                                        50
                                      ? "#027A48"
                                      : "#B42318",
                                fontWeight: 800,
                              }}
                            >
                              {participant.percentage ===
                              null
                                ? "—"
                                : `${participant.percentage} %`}
                            </Typography>
                          </TableCell>

                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
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
                              Voir
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Typography
              variant="body2"
              sx={{
                color: "#98A2B3",
                mt: 3,
                textAlign: "center",
              }}
            >
              Lien de consultation destiné au formateur.
              Il permet de consulter le classement et le
              détail des réponses.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Dialog
        open={selectedParticipant !== null}
        onClose={() =>
          setSelectedParticipant(null)
        }
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            color: "#071F4A",
            fontWeight: 800,
          }}
        >
          {selectedParticipant
            ? `Résultats de ${selectedParticipant.first_name} ${selectedParticipant.last_name}`
            : "Détail des résultats"}
        </DialogTitle>

        <DialogContent dividers>
          {selectedParticipant && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {selectedParticipant.details.length ===
              0 ? (
                <Alert severity="info">
                  Aucun détail de réponse n’est disponible.
                </Alert>
              ) : (
                selectedParticipant.details.map(
                  (detail, index) => {
                    const participantAnswer =
                      detail.text_answers.length > 0
                        ? detail.text_answers.join(", ")
                        : detail.selected_answers.length >
                            0
                          ? detail.selected_answers.join(
                              ", "
                            )
                          : "Aucune réponse";

                    return (
                      <Card
                        key={`${detail.question_id}-${index}`}
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
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
                              alignItems:
                                "flex-start",
                              mb: 2,
                            }}
                          >
                            <Typography
                              sx={{
                                color: "#071F4A",
                                fontWeight: 800,
                              }}
                            >
                              {index + 1}.{" "}
                              {detail.question}
                            </Typography>

                            <Chip
                              size="small"
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
                            sx={{
                              color: "#667085",
                              mb: 0.5,
                            }}
                          >
                            Réponse du candidat
                          </Typography>

                          <Typography
                            sx={{
                              color: "#071F4A",
                              fontWeight: 700,
                              mb: 2,
                            }}
                          >
                            {participantAnswer}
                          </Typography>

                          {detail.correct_answers.length >
                            0 && (
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#667085",
                                  mb: 0.5,
                                }}
                              >
                                Réponse attendue
                              </Typography>

                              <Typography
                                sx={{
                                  color: "#027A48",
                                  fontWeight: 700,
                                  mb: 2,
                                }}
                              >
                                {detail.correct_answers.join(
                                  ", "
                                )}
                              </Typography>
                            </>
                          )}

                          <Typography
                            variant="body2"
                            sx={{
                              color: "#071F4A",
                              fontWeight: 700,
                            }}
                          >
                            Points :{" "}
                            {detail.points_awarded} /{" "}
                            {detail.points_possible}
                          </Typography>
                        </CardContent>
                      </Card>
                    );
                  }
                )
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() =>
              setSelectedParticipant(null)
            }
            variant="contained"
            sx={{
              bgcolor: "#071F4A",
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