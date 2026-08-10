import { useLocation, useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

import { CheckCircle } from "@mui/icons-material";

type FinishedState = {
  trainingMode?: boolean;
  score?: number;
  totalPoints?: number;
  qcmTitle?: string;
};

export default function ParticipantFinished() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state ?? {}) as FinishedState;

  const trainingMode = state.trainingMode === true;
  const score = Number(state.score ?? 0);
  const totalPoints = Number(state.totalPoints ?? 0);
  const qcmTitle = state.qcmTitle ?? "QCM";

  const percentage =
    totalPoints > 0
      ? Math.round((score / totalPoints) * 100)
      : 0;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F4F6FA",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 620,
          borderRadius: 4,
          boxShadow: "0 12px 40px rgba(7,31,74,0.14)",
          overflow: "hidden",
        }}
      >
        <Box sx={{ height: 8, bgcolor: "#E3062C" }} />

        <CardContent
          sx={{
            p: { xs: 3, md: 5 },
            textAlign: "center",
          }}
        >
          <CheckCircle
            sx={{
              fontSize: 80,
              color: "#039855",
              mb: 2,
            }}
          />

          <Typography
            variant="h4"
            sx={{
              color: "#071F4A",
              fontWeight: 800,
              mb: 1,
            }}
          >
            Questionnaire terminé
          </Typography>

          <Typography
            sx={{
              color: "#667085",
              mb: 3,
            }}
          >
            Merci pour votre participation à{" "}
            <strong>{qcmTitle}</strong>.
          </Typography>

          {trainingMode ? (
            <Box
              sx={{
                bgcolor: "#EEF4FF",
                borderRadius: 3,
                p: 3,
                mb: 3,
              }}
            >
              <Typography
                sx={{
                  color: "#667085",
                  fontWeight: 700,
                  mb: 1,
                }}
              >
                Votre score
              </Typography>

              <Typography
                variant="h3"
                sx={{
                  color: "#071F4A",
                  fontWeight: 900,
                  mb: 1,
                }}
              >
                {score} / {totalPoints}
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  color: "#E3062C",
                  fontWeight: 800,
                }}
              >
                {percentage} %
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "#667085",
                  mt: 2,
                }}
              >
                Mode entraînement : votre score est affiché.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                bgcolor: "#F8FAFC",
                borderRadius: 3,
                p: 3,
                mb: 3,
              }}
            >
              <Typography
                sx={{
                  color: "#667085",
                  fontWeight: 600,
                }}
              >
                Votre réponse a bien été enregistrée.
                Le score n’est pas affiché en mode examen.
              </Typography>
            </Box>
          )}

          <Button
            variant="contained"
            onClick={() => navigate("/", { replace: true })}
            sx={{
              bgcolor: "#071F4A",
              px: 4,
              py: 1.2,
              textTransform: "none",
              fontWeight: 800,
              "&:hover": {
                bgcolor: "#0A2A63",
              },
            }}
          >
            Retour à l’accueil
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}