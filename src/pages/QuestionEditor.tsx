import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Add,
  ArrowBack,
  Cancel,
  Delete,
  Edit,
  Save,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Radio,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import api from "../api/axios";

type QuestionType =
  | "true_false"
  | "single_choice"
  | "multiple_choice"
  | "free_text"
  | "competency_scale";

type AnswerForm = {
  answer: string;
  is_correct: boolean;
  points_min?: number | null;
  points_max?: number | null;
};

type Answer = {
  id: number;
  answer: string;
  is_correct: boolean;
  points_min?: number | null;
  points_max?: number | null;
};

type Question = {
  id: number;
  question: string;
  type: QuestionType;
  points: number;
  timer: number;
  explanation?: string | null;
  answers: Answer[];
};

export default function QuestionEditor() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [editingQuestionId, setEditingQuestionId] =
    useState<number | null>(null);

  const [questionText, setQuestionText] = useState("");
  const [type, setType] =
    useState<QuestionType>("single_choice");
  const [points, setPoints] = useState(1);
  const [timer, setTimer] = useState(20);
  const [explanation, setExplanation] = useState("");

  const [answers, setAnswers] = useState<AnswerForm[]>([
    { answer: "", is_correct: false },
    { answer: "", is_correct: false },
  ]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get(
        `/qcms/${id}/questions`
      );

      setQuestions(response.data);
    } catch (error: any) {
      console.error(
        "Erreur de chargement des questions :",
        error
      );

      setErrorMessage(
        error.response?.data?.message ??
          "Impossible de charger les questions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [id]);

  const resetForm = () => {
    setEditingQuestionId(null);
    setQuestionText("");
    setType("single_choice");
    setPoints(1);
    setTimer(20);
    setExplanation("");

    setAnswers([
      { answer: "", is_correct: false },
      { answer: "", is_correct: false },
    ]);
  };

  const changeType = (newType: QuestionType) => {
    setType(newType);

    if (newType === "true_false") {
      setAnswers([
        { answer: "Vrai", is_correct: true },
        { answer: "Faux", is_correct: false },
      ]);
      return;
    }

    if (newType === "free_text") {
      setAnswers([
        { answer: "", is_correct: true },
      ]);
      return;
    }

    if (newType === "competency_scale") {
      setPoints(10);
      setAnswers([
        {
          answer: "A - Maîtrisé",
          is_correct: false,
          points_min: 8,
          points_max: 10,
        },
        {
          answer: "B - Partiellement maîtrisé",
          is_correct: false,
          points_min: 5,
          points_max: 7,
        },
        {
          answer: "C - En cours d’acquisition",
          is_correct: false,
          points_min: 2,
          points_max: 4,
        },
        {
          answer: "D - Non acquis",
          is_correct: false,
          points_min: 0,
          points_max: 1,
        },
      ]);
      return;
    }

    setAnswers([
      { answer: "", is_correct: false },
      { answer: "", is_correct: false },
    ]);
  };

  const updateAnswerText = (
    index: number,
    value: string
  ) => {
    setAnswers((currentAnswers) =>
      currentAnswers.map((answer, currentIndex) =>
        currentIndex === index
          ? {
              ...answer,
              answer: value,
            }
          : answer
      )
    );
  };

  const updateAnswerPoints = (
    index: number,
    field: "points_min" | "points_max",
    value: number
  ) => {
    setAnswers((currentAnswers) =>
      currentAnswers.map((answer, currentIndex) =>
        currentIndex === index
          ? {
              ...answer,
              [field]: value,
            }
          : answer
      )
    );
  };

  const toggleCorrectAnswer = (index: number) => {
    if (
      type === "single_choice" ||
      type === "true_false"
    ) {
      setAnswers((currentAnswers) =>
        currentAnswers.map((answer, currentIndex) => ({
          ...answer,
          is_correct: currentIndex === index,
        }))
      );

      return;
    }

    setAnswers((currentAnswers) =>
      currentAnswers.map((answer, currentIndex) =>
        currentIndex === index
          ? {
              ...answer,
              is_correct: !answer.is_correct,
            }
          : answer
      )
    );
  };

  const addAnswer = () => {
    if (answers.length >= 10) {
      alert("Vous pouvez ajouter au maximum 10 réponses.");
      return;
    }

    setAnswers((currentAnswers) => [
      ...currentAnswers,
      {
        answer: "",
        is_correct: false,
        ...(type === "competency_scale"
          ? { points_min: 0, points_max: 0 }
          : {}),
      },
    ]);
  };

  const removeAnswer = (index: number) => {
    const minimumAnswers =
      type === "free_text" ? 1 : 2;

    if (answers.length <= minimumAnswers) {
      alert(
        type === "free_text"
          ? "Une question à réponse libre doit contenir au moins une réponse attendue."
          : "Une question doit contenir au moins deux réponses."
      );
      return;
    }

    setAnswers((currentAnswers) =>
      currentAnswers.filter(
        (_, currentIndex) => currentIndex !== index
      )
    );
  };

  const startEditing = (question: Question) => {
    setEditingQuestionId(question.id);
    setQuestionText(question.question);
    setType(question.type);
    setPoints(question.points);
    setTimer(question.timer ?? 20);
    setExplanation(question.explanation ?? "");

    setAnswers(
      question.answers.map((answer) => ({
        answer: answer.answer,
        is_correct: answer.is_correct,
        points_min: answer.points_min ?? null,
        points_max: answer.points_max ?? null,
      }))
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const cancelEditing = () => {
    resetForm();
  };

  const validateForm = () => {
    if (!questionText.trim()) {
      alert("Le texte de la question est obligatoire.");
      return false;
    }

    if (points < 1 || points > 100) {
      alert("Les points doivent être compris entre 1 et 100.");
      return false;
    }

    if (timer < 1 || timer > 3600) {
      alert(
        "Le minuteur doit être compris entre 1 et 3600 secondes."
      );
      return false;
    }

    if (
      type === "free_text" &&
      answers.length < 1
    ) {
      alert(
        "Ajoutez au moins une réponse attendue."
      );
      return false;
    }

    if (
      type !== "free_text" &&
      answers.length < 2
    ) {
      alert(
        "Une question doit contenir au moins deux réponses."
      );
      return false;
    }

    if (answers.some((answer) => !answer.answer.trim())) {
      alert("Toutes les réponses doivent être renseignées.");
      return false;
    }

    if (
      type !== "free_text" &&
      type !== "competency_scale"
    ) {
      const correctAnswers = answers.filter(
        (answer) => answer.is_correct
      );

      if (correctAnswers.length === 0) {
        alert("Sélectionnez au moins une bonne réponse.");
        return false;
      }

      if (
        (type === "single_choice" ||
          type === "true_false") &&
        correctAnswers.length !== 1
      ) {
        alert(
          "Ce type de question doit avoir exactement une bonne réponse."
        );
        return false;
      }
    }

    if (type === "competency_scale") {
      for (const answer of answers) {
        if (
          answer.points_min === null ||
          answer.points_min === undefined ||
          answer.points_max === null ||
          answer.points_max === undefined
        ) {
          alert(
            "Indiquez les points minimum et maximum pour chaque niveau."
          );
          return false;
        }

        if (answer.points_min > answer.points_max) {
          alert(
            "Pour chaque niveau, le maximum doit être supérieur ou égal au minimum."
          );
          return false;
        }
      }
    }

    return true;
  };

  const saveQuestion = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      question: questionText.trim(),
      type,
      points,
      timer,
      image: null,
      video: null,
      explanation: explanation.trim() || null,

      answers: answers.map((answer, index) => ({
        answer: answer.answer.trim(),
        is_correct:
          type === "free_text"
            ? true
            : type === "competency_scale"
              ? false
              : answer.is_correct,
        points_min:
          type === "competency_scale"
            ? answer.points_min
            : null,
        points_max:
          type === "competency_scale"
            ? answer.points_max
            : null,
        order: index + 1,
      })),
    };

    try {
      setSaving(true);

      if (editingQuestionId !== null) {
        await api.put(
          `/questions/${editingQuestionId}`,
          payload
        );
      } else {
        await api.post(
          `/qcms/${id}/questions`,
          payload
        );
      }

      const message =
        editingQuestionId !== null
          ? "Question modifiée avec succès."
          : "Question ajoutée avec succès.";

      resetForm();
      await loadQuestions();

      alert(message);
    } catch (error: any) {
      console.error(
        "Erreur lors de l’enregistrement :",
        error
      );

      const validationErrors =
        error.response?.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(
          validationErrors
        )[0];

        if (Array.isArray(firstError)) {
          alert(String(firstError[0]));
          return;
        }
      }

      alert(
        error.response?.data?.message ??
          "Impossible d’enregistrer la question."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteQuestion = async (
    questionId: number
  ) => {
    const confirmation = window.confirm(
      "Voulez-vous vraiment supprimer cette question ?"
    );

    if (!confirmation) {
      return;
    }

    try {
      await api.delete(`/questions/${questionId}`);

      if (editingQuestionId === questionId) {
        resetForm();
      }

      await loadQuestions();

      alert("Question supprimée avec succès.");
    } catch (error: any) {
      console.error(
        "Erreur lors de la suppression :",
        error
      );

      alert(
        error.response?.data?.message ??
          "Impossible de supprimer la question."
      );
    }
  };

  const getTypeLabel = (
    questionType: QuestionType
  ) => {
    if (questionType === "true_false") {
      return "Vrai / Faux";
    }

    if (questionType === "multiple_choice") {
      return "Choix multiples";
    }

    if (questionType === "free_text") {
      return "Réponse libre";
    }

    if (questionType === "competency_scale") {
      return "Évaluation de compétence";
    }

    return "Choix unique";
  };

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

        <Typography
          variant="h3"
          sx={{
            color: "#071F4A",
            fontWeight: 700,
          }}
        >
          Éditeur de questions
        </Typography>

        <Typography
          sx={{
            color: "#667085",
            mt: 1,
            mb: 4,
          }}
        >
          Créez, modifiez et supprimez les questions du QCM.
        </Typography>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        <Card
          sx={{
            borderRadius: 3,
            boxShadow:
              "0 6px 25px rgba(7,31,74,0.10)",
            mb: 4,
            borderTop: editingQuestionId
              ? "5px solid #071F4A"
              : "5px solid #E3062C",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Typography
              variant="h5"
              sx={{
                color: "#071F4A",
                fontWeight: 700,
                mb: 3,
              }}
            >
              {editingQuestionId !== null
                ? "Modifier la question"
                : "Ajouter une question"}
            </Typography>

            <Box component="form" onSubmit={saveQuestion}>
              <TextField
                fullWidth
                required
                multiline
                minRows={3}
                label="Texte de la question"
                value={questionText}
                onChange={(event) =>
                  setQuestionText(event.target.value)
                }
                sx={{ mb: 3 }}
              />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "2fr 1fr 1fr",
                  },
                  gap: 2,
                  mb: 3,
                }}
              >
                <FormControl fullWidth>
                  <InputLabel>Type de question</InputLabel>

                  <Select
                    label="Type de question"
                    value={type}
                    onChange={(event) =>
                      changeType(
                        event.target.value as QuestionType
                      )
                    }
                  >
                    <MenuItem value="true_false">
                      Vrai / Faux
                    </MenuItem>

                    <MenuItem value="single_choice">
                      Choix unique
                    </MenuItem>

                    <MenuItem value="multiple_choice">
                      Choix multiples
                    </MenuItem>

                    <MenuItem value="free_text">
                      Réponse libre
                    </MenuItem>

                    <MenuItem value="competency_scale">
                      Évaluation de compétence
                    </MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  type="number"
                  label="Points"
                  value={points}
                  onChange={(event) =>
                    setPoints(Number(event.target.value))
                  }
                  slotProps={{
                    htmlInput: {
                      min: 1,
                      max: 100,
                    },
                  }}
                />

                <TextField
                  fullWidth
                  type="number"
                  label="Minuteur en secondes"
                  value={timer}
                  onChange={(event) =>
                    setTimer(Number(event.target.value))
                  }
                  slotProps={{
                    htmlInput: {
                      min: 1,
                      max: 3600,
                    },
                  }}
                />
              </Box>

              <Typography
                variant="h6"
                sx={{
                  color: "#071F4A",
                  fontWeight: 700,
                  mb: 1,
                }}
              >
                {type === "free_text"
                  ? "Réponse(s) attendue(s)"
                  : "Réponses"}
              </Typography>

              {type === "free_text" && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Ajoutez une ou plusieurs réponses attendues.
                  Le participant devra toutes les saisir
                  correctement pour obtenir les points de la
                  question. Une seule erreur donnera 0 point.
                </Alert>
              )}

              {answers.map((answer, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 2,
                  }}
                >
                  {type !== "free_text" &&
                    type !== "competency_scale" &&
                    (type === "multiple_choice" ? (
                      <Checkbox
                        checked={answer.is_correct}
                        onChange={() =>
                          toggleCorrectAnswer(index)
                        }
                      />
                    ) : (
                      <Radio
                        checked={answer.is_correct}
                        onChange={() =>
                          toggleCorrectAnswer(index)
                        }
                      />
                    ))}

                  <TextField
                    fullWidth
                    required
                    label={
                      type === "free_text"
                        ? `Réponse attendue ${index + 1}`
                        : `Réponse ${index + 1}`
                    }
                    value={answer.answer}
                    disabled={type === "true_false"}
                    onChange={(event) =>
                      updateAnswerText(
                        index,
                        event.target.value
                      )
                    }
                  />

                  {type === "competency_scale" && (
                    <>
                      <TextField
                        type="number"
                        label="Minimum"
                        value={answer.points_min ?? 0}
                        onChange={(event) =>
                          updateAnswerPoints(
                            index,
                            "points_min",
                            Number(event.target.value)
                          )
                        }
                        slotProps={{
                          htmlInput: { min: 0, max: 1000 },
                        }}
                        sx={{ width: 120 }}
                      />

                      <TextField
                        type="number"
                        label="Maximum"
                        value={answer.points_max ?? 0}
                        onChange={(event) =>
                          updateAnswerPoints(
                            index,
                            "points_max",
                            Number(event.target.value)
                          )
                        }
                        slotProps={{
                          htmlInput: { min: 0, max: 1000 },
                        }}
                        sx={{ width: 120 }}
                      />
                    </>
                  )}

                  {type !== "true_false" && (
                    <Button
                      type="button"
                      color="error"
                      onClick={() => removeAnswer(index)}
                      sx={{ minWidth: 48 }}
                    >
                      <Delete />
                    </Button>
                  )}
                </Box>
              ))}

              {type !== "true_false" && (
                <Button
                  type="button"
                  startIcon={<Add />}
                  onClick={addAnswer}
                  sx={{
                    mb: 3,
                    textTransform: "none",
                    fontWeight: 700,
                  }}
                >
                  {type === "free_text"
                    ? "Ajouter une réponse attendue"
                    : "Ajouter une réponse"}
                </Button>
              )}

              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Explication pédagogique facultative"
                value={explanation}
                onChange={(event) =>
                  setExplanation(event.target.value)
                }
                sx={{ mb: 3 }}
              />

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={
                    saving ? (
                      <CircularProgress
                        size={18}
                        sx={{ color: "white" }}
                      />
                    ) : (
                      <Save />
                    )
                  }
                  disabled={saving}
                  sx={{
                    bgcolor: "#E3062C",
                    textTransform: "none",
                    fontWeight: 700,
                    px: 3,

                    "&:hover": {
                      bgcolor: "#C80527",
                    },
                  }}
                >
                  {saving
                    ? "Enregistrement..."
                    : editingQuestionId !== null
                      ? "Enregistrer les modifications"
                      : "Enregistrer la question"}
                </Button>

                {editingQuestionId !== null && (
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={cancelEditing}
                    disabled={saving}
                    sx={{
                      color: "#071F4A",
                      borderColor: "#071F4A",
                      textTransform: "none",
                      fontWeight: 700,
                    }}
                  >
                    Annuler la modification
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Typography
          variant="h5"
          sx={{
            color: "#071F4A",
            fontWeight: 700,
            mb: 2,
          }}
        >
          Questions enregistrées ({questions.length})
        </Typography>

        {loading ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : questions.length === 0 ? (
          <Alert severity="info">
            Aucune question n’a encore été enregistrée.
          </Alert>
        ) : (
          questions.map((question, index) => (
            <Card
              key={question.id}
              sx={{
                borderRadius: 3,
                mb: 2,
                borderLeft: "5px solid #071F4A",
                boxShadow:
                  "0 5px 20px rgba(7,31,74,0.08)",
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
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#E3062C",
                        fontWeight: 700,
                        mb: 1,
                      }}
                    >
                      Question {index + 1}
                    </Typography>

                    <Typography
                      variant="h6"
                      sx={{
                        color: "#071F4A",
                        fontWeight: 700,
                      }}
                    >
                      {question.question}
                    </Typography>

                    <Typography
                      sx={{
                        color: "#667085",
                        mt: 1,
                      }}
                    >
                      {getTypeLabel(question.type)}
                      {" · "}
                      {question.points} point
                      {question.points > 1 ? "s" : ""}
                      {" · "}
                      {question.timer} seconde
                      {question.timer > 1 ? "s" : ""}
                    </Typography>
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
                      startIcon={<Edit />}
                      onClick={() =>
                        startEditing(question)
                      }
                      sx={{
                        color: "#071F4A",
                        borderColor: "#071F4A",
                        textTransform: "none",
                        fontWeight: 700,
                      }}
                    >
                      Modifier
                    </Button>

                    <Button
                      color="error"
                      variant="outlined"
                      startIcon={<Delete />}
                      onClick={() =>
                        deleteQuestion(question.id)
                      }
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                      }}
                    >
                      Supprimer
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ mt: 2 }}>
                  {question.answers.map((answer) => (
                    <Box
                      key={answer.id}
                      sx={{
                        mt: 1,
                        px: 1.5,
                        py: 1,
                        borderRadius: 1.5,
                        bgcolor:
                          question.type !== "competency_scale" &&
                          answer.is_correct
                            ? "#ECFDF3"
                            : "#F8FAFC",
                        border:
                          question.type !== "competency_scale" &&
                          answer.is_correct
                            ? "1px solid #ABEFC6"
                            : "1px solid #E4E7EC",
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight:
                            question.type === "competency_scale" ||
                            answer.is_correct
                              ? 700
                              : 400,
                          color:
                            question.type !== "competency_scale" &&
                            answer.is_correct
                              ? "#027A48"
                              : "#344054",
                        }}
                      >
                        {question.type === "competency_scale"
                          ? "•"
                          : answer.is_correct
                            ? "✓"
                            : "•"}{" "}
                        {answer.answer}
                        {question.type === "competency_scale" &&
                          ` — ${answer.points_min ?? 0} à ${
                            answer.points_max ?? 0
                          } pts`}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {question.explanation && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor: "#FFF8E7",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#071F4A",
                        fontWeight: 700,
                      }}
                    >
                      Explication pédagogique
                    </Typography>

                    <Typography
                      sx={{
                        color: "#667085",
                        mt: 0.5,
                      }}
                    >
                      {question.explanation}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    </Box>
  );
}