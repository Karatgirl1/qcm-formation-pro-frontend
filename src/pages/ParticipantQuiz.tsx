import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  LinearProgress,
  Radio,
  Typography,
  Alert,
} from "@mui/material";

import api from "../api/axios";

type Answer = {
  id: number;
  answer: string;
};

type Question = {
  id: number;
  question: string;
  type:
    | "true_false"
    | "single_choice"
    | "multiple_choice";
  points: number;
  timer: number | null;
  image?: string | null;
  video?: string | null;
  answers: Answer[];
};

type PublicSession = {
  id: number;
  code: string;

  qcm: {
    id: number;
    title: string;
    description: string | null;
    questions: Question[];
  };
};

export default function ParticipantQuiz() {
  const navigate = useNavigate();
  const { code = "" } = useParams();

  const [session, setSession] =
    useState<PublicSession | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswerIds, setSelectedAnswerIds] =
    useState<number[]>([]);

  const [timeLeft, setTimeLeft] = useState(30);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const participantId =
    sessionStorage.getItem("participant_id");

  useEffect(() => {
    if (!participantId) {
      navigate(`/join/${code}`, {
        replace: true,
      });

      return;
    }

    const loadSession = async () => {
      try {
        const response = await api.get(
          `/public/sessions/${code}`
        );

        setSession(response.data);
      } catch (error: any) {
        console.error(error);

        setErrorMessage(
          error.response?.data?.message ??
            "Impossible de charger le questionnaire."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [code, navigate, participantId]);

  const currentQuestion =
    session?.qcm.questions[currentIndex];

  useEffect(() => {
    if (!currentQuestion) {
      return;
    }

    setSelectedAnswerIds([]);
    setTimeLeft(currentQuestion.timer ?? 30);
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (!currentQuestion || submitting) {
      return;
    }

    if (timeLeft <= 0) {
      void submitAnswer(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      setTimeLeft((current) => current - 1);
    }, 1000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [timeLeft, currentQuestion?.id, submitting]);

  const selectAnswer = (answerId: number) => {
    if (!currentQuestion) {
      return;
    }

    if (
      currentQuestion.type === "multiple_choice"
    ) {
      setSelectedAnswerIds((current) =>
        current.includes(answerId)
          ? current.filter((id) => id !== answerId)
          : [...current, answerId]
      );

      return;
    }

    setSelectedAnswerIds([answerId]);
  };

  async function submitAnswer(
    timerExpired = false
  ) {
    if (
      !session ||
      !currentQuestion ||
      !participantId ||
      submitting
    ) {
      return;
    }

    if (
      selectedAnswerIds.length === 0 &&
      !timerExpired
    ) {
      alert("Sélectionnez une réponse.");
      return;
    }

    try {
      setSubmitting(true);

      if (selectedAnswerIds.length > 0) {
        console.log("ENVOI REPONSE", {
  participant_id: participantId,
  question_id: currentQuestion.id,
  selected_answer_ids: selectedAnswerIds,
});
        await api.post(
          `/public/participants/${participantId}/answers`,
          {
            question_id: currentQuestion.id,
            selected_answer_ids:
              selectedAnswerIds,
          }
        );
      }

      const isLastQuestion =
        currentIndex ===
        session.qcm.questions.length - 1;

      if (isLastQuestion) {
        await api.post(
          `/public/participants/${participantId}/complete`
        );

        navigate("/participant/finished", {
          replace: true,
        });

        return;
      }

      setCurrentIndex((current) => current + 1);
    } catch (error: any) {
      console.error(error);

      alert(
        error.response?.data?.message ??
          "Impossible d’enregistrer la réponse."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#071F4A",
        }}
      >
        <CircularProgress sx={{ color: "white" }} />
      </Box>
    );
  }

  if (errorMessage || !session || !currentQuestion) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          {errorMessage ||
            "Le questionnaire ne contient aucune question."}
        </Alert>
      </Box>
    );
  }

  const totalQuestions =
    session.qcm.questions.length;

  const progress =
    ((currentIndex + 1) / totalQuestions) * 100;

  const initialTime =
    currentQuestion.timer ?? 30;

  const timerProgress =
    initialTime > 0
      ? (timeLeft / initialTime) * 100
      : 0;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F4F6FA",
        p: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 850, mx: "auto" }}>
        <Typography
          sx={{
            color: "#071F4A",
            fontWeight: 700,
            mb: 1,
          }}
        >
          {session.qcm.title}
        </Typography>

        <Typography sx={{ color: "#667085", mb: 1 }}>
          Question {currentIndex + 1} sur{" "}
          {totalQuestions}
        </Typography>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 9,
            borderRadius: 5,
            mb: 3,

            "& .MuiLinearProgress-bar": {
              bgcolor: "#E3062C",
            },
          }}
        />

        <Card
          sx={{
            borderRadius: 4,
            boxShadow:
              "0 10px 35px rgba(7,31,74,0.12)",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
                mb: 3,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: "#071F4A",
                  fontWeight: 800,
                }}
              >
                {currentQuestion.question}
              </Typography>

              <Box
                sx={{
                  minWidth: 80,
                  textAlign: "center",
                  bgcolor:
                    timeLeft <= 5
                      ? "#FEE4E2"
                      : "#EEF4FF",
                  borderRadius: 3,
                  p: 1.5,
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color:
                      timeLeft <= 5
                        ? "#D92D20"
                        : "#071F4A",
                  }}
                >
                  {timeLeft}s
                </Typography>
              </Box>
            </Box>

            <LinearProgress
              variant="determinate"
              value={timerProgress}
              sx={{
                height: 6,
                borderRadius: 3,
                mb: 4,

                "& .MuiLinearProgress-bar": {
                  bgcolor:
                    timeLeft <= 5
                      ? "#E3062C"
                      : "#071F4A",
                },
              }}
            />

            <Box>
              {currentQuestion.answers.map(
                (answer) => {
                  const selected =
                    selectedAnswerIds.includes(
                      answer.id
                    );

                  return (
                    <Box
                      key={answer.id}
                      onClick={() =>
                        selectAnswer(answer.id)
                      }
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        border: selected
                          ? "2px solid #071F4A"
                          : "1px solid #D0D5DD",
                        bgcolor: selected
                          ? "#EEF4FF"
                          : "white",
                        borderRadius: 2,
                        p: 1.5,
                        mb: 2,
                        cursor: "pointer",
                      }}
                    >
                      {currentQuestion.type ===
                      "multiple_choice" ? (
                        <Checkbox
                          checked={selected}
                          onChange={() =>
                            selectAnswer(answer.id)
                          }
                        />
                      ) : (
                        <Radio
                          checked={selected}
                          onChange={() =>
                            selectAnswer(answer.id)
                          }
                        />
                      )}

                      <Typography
                        sx={{
                          color: "#071F4A",
                          fontWeight: selected
                            ? 700
                            : 500,
                        }}
                      >
                        {answer.answer}
                      </Typography>
                    </Box>
                  );
                }
              )}
            </Box>

            <Button
              fullWidth
              variant="contained"
              disabled={submitting}
              onClick={() => submitAnswer(false)}
              sx={{
                bgcolor: "#E3062C",
                mt: 2,
                py: 1.4,
                textTransform: "none",
                fontWeight: 800,

                "&:hover": {
                  bgcolor: "#C80527",
                },
              }}
            >
              {submitting
                ? "Enregistrement..."
                : currentIndex ===
                    totalQuestions - 1
                  ? "Terminer le QCM"
                  : "Question suivante"}
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}