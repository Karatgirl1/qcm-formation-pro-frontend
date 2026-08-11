import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  LinearProgress,
  Radio,
  Typography,
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
    training_mode: boolean;
    questions: Question[];
  };
};

export default function ParticipantQuiz() {
  const navigate = useNavigate();
  const { code = "" } = useParams();

  const [session, setSession] =
    useState<PublicSession | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayQuestionNumber, setDisplayQuestionNumber] =
    useState(1);
  const [selectedAnswerIds, setSelectedAnswerIds] =
    useState<number[]>([]);

  const [timeLeft, setTimeLeft] = useState(30);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Empêche un double envoi si le bouton et le timer
  // se déclenchent quasiment en même temps.
  const submitLockRef = useRef(false);

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
        setCurrentIndex(0);
        setDisplayQuestionNumber(1);
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

    void loadSession();
  }, [code, navigate, participantId]);

  const currentQuestion =
    session?.qcm.questions[currentIndex];

  // Réinitialise le compteur à chaque nouvelle question.
  useEffect(() => {
    if (!currentQuestion) {
      return;
    }

    setSelectedAnswerIds([]);
    setTimeLeft(
      Math.max(1, Number(currentQuestion.timer ?? 30))
    );
    submitLockRef.current = false;
  }, [currentQuestion?.id]);

  const selectAnswer = (answerId: number) => {
    if (!currentQuestion || submitting) {
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
      submitLockRef.current
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

    submitLockRef.current = true;

    try {
      setSubmitting(true);

      // Si le participant a choisi une réponse,
      // elle est enregistrée avant de continuer.
      if (selectedAnswerIds.length > 0) {
        await api.post(
          `/public/participants/${participantId}/answers`,
          {
            question_id: currentQuestion.id,
            selected_answer_ids: selectedAnswerIds,
          }
        );
      }

      const isLastQuestion =
        currentIndex ===
        session.qcm.questions.length - 1;

      if (isLastQuestion) {
        const completeResponse = await api.post(
          `/public/participants/${participantId}/complete`
        );

        const participantResult =
          completeResponse.data?.participant;

        navigate("/participant/finished", {
          replace: true,
          state: {
            trainingMode:
              session.qcm.training_mode === true,
            score: participantResult?.score ?? 0,
            totalPoints:
              participantResult?.total_points ?? 0,
            qcmTitle: session.qcm.title,
          },
        });

        return;
      }

      setCurrentIndex((current) => current + 1);
      setDisplayQuestionNumber((current) => current + 1);
    } catch (error: any) {
      console.error(error);

      submitLockRef.current = false;

      alert(
        error.response?.data?.message ??
          "Impossible d’enregistrer la réponse."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Vrai compte à rebours : -1 chaque seconde.
  // À 0, passage automatique à la question suivante.
  useEffect(() => {
    if (
      !currentQuestion ||
      submitting ||
      submitLockRef.current
    ) {
      return;
    }

    if (timeLeft <= 0) {
      void submitAnswer(true);
      return;
    }

    const timerId = window.setTimeout(() => {
      setTimeLeft((current) =>
        Math.max(0, current - 1)
      );
    }, 1000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [
    timeLeft,
    currentQuestion?.id,
    submitting,
  ]);

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

  const questionNumber = Math.min(
    displayQuestionNumber,
    totalQuestions
  );

  const progress =
    (questionNumber / totalQuestions) * 100;

  const initialTime = Math.max(
    1,
    Number(currentQuestion.timer ?? 30)
  );

  const timerProgress =
    (timeLeft / initialTime) * 100;

  const timerUrgent = timeLeft <= 5;

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
          Question {questionNumber} sur{" "}
          {totalQuestions}
        </Typography>

        <Box
          sx={{
            mb: 2,
            px: 2,
            py: 1.25,
            borderRadius: 2,
            bgcolor: "#FFF4E5",
            border: "1px solid #F79009",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "#7A2E0E",
              fontWeight: 700,
            }}
          >
            Diagnostic — currentIndex: {currentIndex} ·
            displayQuestionNumber: {displayQuestionNumber} ·
            questionId: {currentQuestion.id} ·
            questionText: {currentQuestion.question}
          </Typography>
        </Box>

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
          <CardContent
            sx={{ p: { xs: 3, md: 5 } }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
                mb: 3,
                flexWrap: "wrap",
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: "#071F4A",
                  fontWeight: 800,
                  flex: 1,
                }}
              >
                {currentQuestion.question}
              </Typography>

              <Box
                sx={{
                  minWidth: 105,
                  textAlign: "center",
                  bgcolor: timerUrgent
                    ? "#FEE4E2"
                    : "#EEF4FF",
                  borderRadius: 3,
                  px: 2,
                  py: 1.5,
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 900,
                    color: timerUrgent
                      ? "#D92D20"
                      : "#071F4A",
                    lineHeight: 1,
                  }}
                >
                  {timeLeft}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    color: timerUrgent
                      ? "#D92D20"
                      : "#667085",
                    fontWeight: 700,
                  }}
                >
                {timeLeft > 1 ? "secondes" : "seconde"}
                </Typography>
              </Box>
            </Box>

            <LinearProgress
              variant="determinate"
              value={timerProgress}
              sx={{
                height: 7,
                borderRadius: 4,
                mb: 4,
                "& .MuiLinearProgress-bar": {
                  bgcolor: timerUrgent
                    ? "#E3062C"
                    : "#071F4A",
                  transition:
                    "transform 0.95s linear",
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
                        cursor: submitting
                          ? "default"
                          : "pointer",
                        opacity: submitting ? 0.7 : 1,
                      }}
                    >
                      {currentQuestion.type ===
                      "multiple_choice" ? (
                        <Checkbox
                          checked={selected}
                          disabled={submitting}
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                          onChange={() =>
                            selectAnswer(answer.id)
                          }
                        />
                      ) : (
                        <Radio
                          checked={selected}
                          disabled={submitting}
                          onClick={(event) =>
                            event.stopPropagation()
                          }
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
              onClick={() => void submitAnswer(false)}
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