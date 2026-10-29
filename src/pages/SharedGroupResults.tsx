import { useEffect, useState } from "react";
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

type AnswerDetail = {
  question_id: number;
  question: string;
  selected_answers: string[];
  text_answers: string[];
  correct_answers: string[];
  is_correct: boolean;
  points_awarded: number;
  points_possible: number;
};

type Result = {
  score: number;
  total_points: number;
  percentage: number | null;
  completed: boolean;
  details: AnswerDetail[];
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
  first_qcm: { title: string; session_id: number };
  second_qcm: { title: string; session_id: number };
  participants: Participant[];
};

function formatResult(result: Result | GlobalResult | null) {
  if (!result) return "—";
  if ("completed" in result && !result.completed) return "Non terminé";
  return `${result.score}/${result.total_points}${
    result.percentage !== null ? ` (${result.percentage} %)` : ""
  }`;
}

function DetailSection({ title, result }: { title: string; result: Result | null }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, color: "#071F4A", mb: 1 }}>
        {title}
      </Typography>
      {!result ? (
        <Alert severity="info">Le candidat n'a pas participé à cette session.</Alert>
      ) : (
        <>
          <Typography sx={{ mb: 2, fontWeight: 700 }}>
            Résultat : {formatResult(result)}
          </Typography>
          {(result.details ?? []).length === 0 ? (
            <Alert severity="info">Aucun détail de réponse disponible.</Alert>
          ) : (
            result.details.map((detail, index) => {
              const answer = detail.text_answers?.length
                ? detail.text_answers.join(", ")
                : detail.selected_answers?.length
                  ? detail.selected_answers.join(", ")
                  : "Aucune réponse";
              return (
                <Card
                  key={`${detail.question_id}-${index}`}
                  variant="outlined"
                  sx={{ mb: 1.5, borderRadius: 2, bgcolor: detail.is_correct ? "#F6FEF9" : "#FFFBFA" }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 1 }}>
                      <Typography sx={{ fontWeight: 800 }}>
                        {index + 1}. {detail.question}
                      </Typography>
                      <Chip
                        size="small"
                        color={detail.is_correct ? "success" : "error"}
                        label={detail.is_correct ? "Correct" : "Incorrect"}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">Réponse du candidat</Typography>
                    <Typography sx={{ fontWeight: 700, mb: 1 }}>{answer}</Typography>
                    {detail.correct_answers?.length > 0 && (
                      <>
                        <Typography variant="body2" color="text.secondary">Réponse attendue</Typography>
                        <Typography sx={{ color: "#027A48", fontWeight: 700, mb: 1 }}>
                          {detail.correct_answers.join(", ")}
                        </Typography>
                      </>
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Points : {detail.points_awarded} / {detail.points_possible}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })
          )}
        </>
      )}
    </Box>
  );
}

export default function SharedGroupResults() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<GroupResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

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
        if (!cancelled) setData(response.data);
      } catch (err: unknown) {
        if (cancelled) return;
        const apiError = err as { response?: { status?: number; data?: { message?: string } } };
        if (apiError.response?.status === 404) {
          setError("Ce lien de partage est invalide ou désactivé.");
        } else {
          setError(apiError.response?.data?.message ?? "Impossible de charger les résultats.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadResults();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress /></Box>;
  }

  if (error || !data) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Bilan commun des QCM</Typography>
        <Alert severity="error">{error || "Aucun résultat disponible."}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#F4F6FA", minHeight: "100vh", p: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "#071F4A", mb: 2 }}>
          Bilan commun des QCM
        </Typography>
        <Typography sx={{ mb: 3 }}>
          Ce tableau présente les résultats des deux sessions et le score cumulé des participants ayant terminé les deux QCM.
        </Typography>
        <TableContainer component={Card} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#EEF2F8" }}>
                <TableCell sx={{ fontWeight: 800 }}>Participant</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>
                  {data.first_qcm.title} — session {data.first_qcm.session_id}
                </TableCell>
                <TableCell sx={{ fontWeight: 800 }}>
                  {data.second_qcm.title} — session {data.second_qcm.session_id}
                </TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Résultat global</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Détails</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.participants.map((participant, index) => (
                <TableRow key={`${participant.first_name}-${participant.last_name}-${index}`} hover>
                  <TableCell>{participant.first_name} {participant.last_name}</TableCell>
                  <TableCell>{formatResult(participant.first_result)}</TableCell>
                  <TableCell>{formatResult(participant.second_result)}</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>
                    {formatResult(participant.global_result)}
                  </TableCell>
                  <TableCell>
                    <Button variant="outlined" size="small" onClick={() => setSelectedParticipant(participant)}>
                      Voir le détail
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {data.participants.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>Aucun participant dans ces sessions.</Alert>
        )}
      </Box>
      <Dialog
        open={selectedParticipant !== null}
        onClose={() => setSelectedParticipant(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#071F4A" }}>
          {selectedParticipant
            ? `Résultats de ${selectedParticipant.first_name} ${selectedParticipant.last_name}`
            : "Détail des résultats"}
        </DialogTitle>
        <DialogContent dividers>
          {selectedParticipant && (
            <>
              <Typography sx={{ mb: 3, fontWeight: 800 }}>
                Résultat global : {formatResult(selectedParticipant.global_result)}
              </Typography>
              <DetailSection title={data.first_qcm.title} result={selectedParticipant.first_result} />
              <DetailSection title={data.second_qcm.title} result={selectedParticipant.second_result} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setSelectedParticipant(null)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
