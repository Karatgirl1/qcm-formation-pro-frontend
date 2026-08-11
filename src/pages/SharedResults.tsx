import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import api from "../api/axios";

type SharedParticipant = {
  first_name: string;
  last_name: string;
  score: number;
  total_points: number;
  percentage: number | null;
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
      <Box sx={{ maxWidth: 1000, mx: "auto" }}>
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
              Participants
            </Typography>

            {data.participants.length === 0 ? (
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
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {data.participants.map(
                      (participant, index) => (
                        <TableRow
                          key={`${participant.last_name}-${participant.first_name}-${index}`}
                          hover
                        >
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
              Consultation en lecture seule. Le détail des
              questions et des réponses n’est pas partagé.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}