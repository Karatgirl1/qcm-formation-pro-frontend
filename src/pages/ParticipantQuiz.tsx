import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { VolumeUp } from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  LinearProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Radio,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import api from "../api/axios";

type Answer = {
  id: number;
  answer: string;
  points_min?: number | null;
  points_max?: number | null;
};

type Question = {
  id: number;
  question: string;
  type:
    | "true_false"
    | "single_choice"
    | "multiple_choice"
    | "free_text"
    | "competency_scale";
  points: number;
  timer: number | null;
  image?: string | null;
  video?: string | null;
  answer_count?: number | null;
  answers: Answer[];
};

type PublicSession = {
  id: number;
  code: string;
  accommodated_mode: boolean;
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
  const [textAnswers, setTextAnswers] =
    useState<string[]>([]);
  const [awardedPoints, setAwardedPoints] =
    useState<number | "">("");

  const [timeLeft, setTimeLeft] = useState(30);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

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
    setAwardedPoints("");

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    if (currentQuestion.type === "free_text") {
      const answerCount = Math.max(
        1,
        Number(currentQuestion.answer_count ?? 1)
      );

      setTextAnswers(
        Array.from({ length: answerCount }, () => "")
      );
    } else {
      setTextAnswers([]);
    }

    setTimeLeft(
      Math.max(1, Number(currentQuestion.timer ?? 30))
    );
    submitLockRef.current = false;
  }, [currentQuestion?.id]);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const readQuestionAloud = () => {
    if (!currentQuestion) {
      return;
    }

    if (!("speechSynthesis" in window)) {
      alert(
        "La lecture à voix haute n’est pas disponible sur ce navigateur."
      );
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      currentQuestion.question
    );

    utterance.lang = "fr-FR";
    utterance.rate = 0.9;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

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

  const updateTextAnswer = (
    index: number,
    value: string
  ) => {
    setTextAnswers((current) =>
      current.map((answer, currentIndex) =>
        currentIndex === index ? value : answer
      )
    );
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

    if (!timerExpired) {
      if (
        currentQuestion.type === "free_text" &&
        textAnswers.some(
          (answer) => !answer.trim()
        )
      ) {
        alert(
          "Merci de renseigner toutes les réponses demandées."
        );
        return;
      }

      if (
        currentQuestion.type === "competency_scale" &&
        selectedAnswerIds.length === 0
      ) {
        alert("Sélectionnez un niveau de compétence.");
        return;
      }

      if (
        currentQuestion.type === "competency_scale" &&
        awardedPoints === ""
      ) {
        alert("Sélectionnez le nombre de points à attribuer.");
        return;
      }

      if (
        currentQuestion.type !== "free_text" &&
        currentQuestion.type !== "competency_scale" &&
        selectedAnswerIds.length === 0
      ) {
        alert("Sélectionnez une réponse.");
        return;
      }
    }

    submitLockRef.current = true;

    try {
      setSubmitting(true);

      if (currentQuestion.type === "free_text") {
        const cleanedTextAnswers = textAnswers
          .map((answer) => answer.trim())
          .filter((answer) => answer !== "");

        if (cleanedTextAnswers.length > 0) {
          await api.post(
            `/public/participants/${participantId}/answers`,
            {
              question_id: currentQuestion.id,
              text_answers: cleanedTextAnswers,
            }
          );
        }
      } else if (
        currentQuestion.type === "competency_scale" &&
        selectedAnswerIds.length > 0 &&
        awardedPoints !== ""
      ) {
        await api.post(
          `/public/participants/${participantId}/answers`,
          {
            question_id: currentQuestion.id,
            selected_answer_ids: selectedAnswerIds,
            awarded_points: awardedPoints,
          }
        );
      } else if (selectedAnswerIds.length > 0) {
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
      session?.accommodated_mode === true ||
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
    session?.accommodated_mode,
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

        {session.accommodated_mode && (
          <Typography
            variant="body2"
            sx={{
              color: "#027A48",
              fontWeight: 700,
              mb: 1.5,
            }}
          >
            Mode aménagé — aucun temps limite
          </Typography>
        )}

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

              {session.accommodated_mode ? (
                <Button
                  variant="outlined"
                  startIcon={<VolumeUp />}
                  onClick={readQuestionAloud}
                  disabled={submitting}
                  sx={{
                    color: "#071F4A",
                    borderColor: "#071F4A",
                    textTransform: "none",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {isSpeaking
                    ? "Relire la question"
                    : "Lire la question à voix haute"}
                </Button>
              ) : (
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
              )}
            </Box>

            {!session.accommodated_mode && (
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
            )}

            {session.accommodated_mode && (
              <Box sx={{ mb: 4 }} />
            )}

            <Box>
              {currentQuestion.type === "free_text" ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  {textAnswers.map((answer, index) => (
                    <TextField
                      key={index}
                      fullWidth
                      required
                      disabled={submitting}
                      label={
                        textAnswers.length > 1
                          ? `Réponse ${index + 1}`
                          : "Votre réponse"
                      }
                      value={answer}
                      onChange={(event) =>
                        updateTextAnswer(
                          index,
                          event.target.value
                        )
                      }
                      placeholder="Saisissez votre réponse"
                    />
                  ))}

                  {textAnswers.length > 1 && (
                    <Typography
                      variant="body2"
                      sx={{ color: "#667085" }}
                    >
                      Toutes les réponses doivent être
                      renseignées.
                    </Typography>
                  )}
                </Box>
              ) : currentQuestion.type === "competency_scale" ? (
                <Box>
                  {currentQuestion.answers.map((answer) => {
                    const selected =
                      selectedAnswerIds.includes(answer.id);

                    const min = Number(answer.points_min ?? 0);
                    const max = Number(answer.points_max ?? min);
                    const pointOptions = Array.from(
                      { length: Math.max(0, max - min + 1) },
                      (_, index) => min + index
                    );

                    return (
                      <Box
                        key={answer.id}
                        sx={{
                          border: selected
                            ? "2px solid #071F4A"
                            : "1px solid #D0D5DD",
                          bgcolor: selected
                            ? "#EEF4FF"
                            : "white",
                          borderRadius: 2,
                          p: 2,
                          mb: 2,
                        }}
                      >
                        <Box
                          onClick={() => {
                            selectAnswer(answer.id);
                            setAwardedPoints("");
                          }}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            cursor: submitting
                              ? "default"
                              : "pointer",
                          }}
                        >
                          <Radio
                            checked={selected}
                            disabled={submitting}
                            onChange={() => {
                              selectAnswer(answer.id);
                              setAwardedPoints("");
                            }}
                          />

                          <Box sx={{ flex: 1 }}>
                            <Typography
                              sx={{
                                color: "#071F4A",
                                fontWeight: selected ? 800 : 600,
                              }}
                            >
                              {answer.answer}
                            </Typography>

                            <Typography
                              variant="body2"
                              sx={{ color: "#667085" }}
                            >
                              De {min} à {max} points
                            </Typography>
                          </Box>
                        </Box>

                        {selected && (
                          <FormControl
                            fullWidth
                            sx={{ mt: 2 }}
                            disabled={submitting}
                          >
                            <InputLabel>
                              Points attribués
                            </InputLabel>

                            <Select
                              label="Points attribués"
                              value={awardedPoints}
                              onChange={(event) =>
                                setAwardedPoints(
                                  Number(event.target.value)
                                )
                              }
                            >
                              {pointOptions.map((point) => (
                                <MenuItem
                                  key={point}
                                  value={point}
                                >
                                  {point} point
                                  {point > 1 ? "s" : ""}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                currentQuestion.answers.map(
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
                          opacity: submitting
                            ? 0.7
                            : 1,
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
                )
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