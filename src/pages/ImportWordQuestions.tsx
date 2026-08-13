import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowBack,
  CloudUpload,
  DeleteSweep,
  Description,
  DownloadDone,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";

import api from "../api/axios";

type PreviewQuestion = {
  id: number;
  question: string;
  selected: boolean;
};

export default function ImportWordQuestions() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] =
    useState<PreviewQuestion[]>([]);
  const [points, setPoints] = useState(1);
  const [timer, setTimer] = useState(30);

  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedQuestions = useMemo(
    () => questions.filter((question) => question.selected),
    [questions]
  );

  const selectFile = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0] ?? null;

    setFile(selectedFile);
    setQuestions([]);
    setErrorMessage("");
  };

  const previewDocument = async () => {
    if (!id || !file) {
      alert("Choisissez d’abord un document Word .docx.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setPreviewing(true);
      setErrorMessage("");

      const response = await api.post(
        `/qcms/${id}/questions/import-word/preview`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setQuestions(response.data?.questions ?? []);
    } catch (error: any) {
      console.error("Erreur prévisualisation Word :", error);

      const validationErrors =
        error.response?.data?.errors;

      if (validationErrors?.file?.[0]) {
        setErrorMessage(validationErrors.file[0]);
      } else {
        setErrorMessage(
          error.response?.data?.message ??
            "Impossible d’analyser ce document Word."
        );
      }
    } finally {
      setPreviewing(false);
    }
  };

  const toggleQuestion = (questionId: number) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              selected: !question.selected,
            }
          : question
      )
    );
  };

  const selectAll = () => {
    setQuestions((current) =>
      current.map((question) => ({
        ...question,
        selected: true,
      }))
    );
  };

  const deselectAll = () => {
    setQuestions((current) =>
      current.map((question) => ({
        ...question,
        selected: false,
      }))
    );
  };

  const importQuestions = async () => {
    if (!id) {
      return;
    }

    if (selectedQuestions.length === 0) {
      alert("Sélectionnez au moins une question à importer.");
      return;
    }

    try {
      setImporting(true);
      setErrorMessage("");

      await api.post(
        `/qcms/${id}/questions/import-word`,
        {
          questions: selectedQuestions.map(
            (question) => question.question
          ),
          points,
          timer,
        }
      );

      alert(
        `${selectedQuestions.length} question(s) importée(s). Vous pouvez maintenant choisir les bonnes réponses et modifier les types de questions.`
      );

      navigate(`/qcms/${id}/questions`);
    } catch (error: any) {
      console.error("Erreur import Word :", error);

      setErrorMessage(
        error.response?.data?.message ??
          "Impossible d’importer les questions."
      );
    } finally {
      setImporting(false);
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
          onClick={() =>
            navigate(`/qcms/${id}/questions`)
          }
          sx={{
            mb: 3,
            color: "#071F4A",
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          Retour à l’éditeur de questions
        </Button>

        <Card
          sx={{
            borderRadius: 3,
            boxShadow:
              "0 6px 25px rgba(7,31,74,0.10)",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 1,
              }}
            >
              <Description
                sx={{
                  color: "#E3062C",
                  fontSize: 38,
                }}
              />

              <Typography
                variant="h4"
                sx={{
                  color: "#071F4A",
                  fontWeight: 800,
                }}
              >
                Importer des questions depuis Word
              </Typography>
            </Box>

            <Typography
              sx={{
                color: "#667085",
                mb: 4,
              }}
            >
              Sélectionnez un fichier .docx contenant vos
              questions. Elles seront créées en Vrai / Faux
              par défaut, puis vous pourrez modifier leur type
              et choisir vous-même les bonnes réponses.
            </Typography>

            {errorMessage && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
            )}

            <Box
              sx={{
                p: 3,
                border: "2px dashed #CBD5E1",
                borderRadius: 3,
                bgcolor: "#F8FAFC",
                mb: 3,
              }}
            >
              <Button
                component="label"
                variant="contained"
                startIcon={<CloudUpload />}
                sx={{
                  bgcolor: "#071F4A",
                  textTransform: "none",
                  fontWeight: 700,
                  "&:hover": {
                    bgcolor: "#0A2A63",
                  },
                }}
              >
                Choisir un document Word
                <input
                  hidden
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={selectFile}
                />
              </Button>

              <Typography
                sx={{
                  mt: 2,
                  color: file ? "#071F4A" : "#667085",
                  fontWeight: file ? 700 : 400,
                }}
              >
                {file
                  ? file.name
                  : "Aucun fichier sélectionné"}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr",
                },
                gap: 2,
                mb: 3,
              }}
            >
              <TextField
                type="number"
                label="Points par question"
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
                type="number"
                label="Minuteur par question (secondes)"
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

            <Button
              fullWidth
              variant="contained"
              disabled={!file || previewing}
              onClick={() => void previewDocument()}
              startIcon={
                previewing ? (
                  <CircularProgress
                    size={18}
                    sx={{ color: "white" }}
                  />
                ) : (
                  <Description />
                )
              }
              sx={{
                bgcolor: "#E3062C",
                py: 1.4,
                textTransform: "none",
                fontWeight: 800,
                "&:hover": {
                  bgcolor: "#C80527",
                },
              }}
            >
              {previewing
                ? "Analyse du document..."
                : "Prévisualiser les questions"}
            </Button>

            {questions.length > 0 && (
              <>
                <Divider sx={{ my: 4 }} />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        color: "#071F4A",
                        fontWeight: 800,
                      }}
                    >
                      {questions.length} question
                      {questions.length > 1 ? "s" : ""}{" "}
                      détectée
                      {questions.length > 1 ? "s" : ""}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: "#667085",
                        mt: 0.5,
                      }}
                    >
                      {selectedQuestions.length} sélectionnée
                      {selectedQuestions.length > 1 ? "s" : ""}
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
                      size="small"
                      startIcon={<DownloadDone />}
                      onClick={selectAll}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                      }}
                    >
                      Tout sélectionner
                    </Button>

                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteSweep />}
                      onClick={deselectAll}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                      }}
                    >
                      Tout décocher
                    </Button>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    mb: 3,
                  }}
                >
                  {questions.map((question, index) => (
                    <Card
                      key={question.id}
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        bgcolor: question.selected
                          ? "#F8FAFF"
                          : "white",
                      }}
                    >
                      <CardContent
                        sx={{
                          py: 1.5,
                          "&:last-child": {
                            pb: 1.5,
                          },
                        }}
                      >
                        <FormControlLabel
                          sx={{
                            width: "100%",
                            alignItems: "flex-start",
                            m: 0,
                          }}
                          control={
                            <Checkbox
                              checked={question.selected}
                              onChange={() =>
                                toggleQuestion(question.id)
                              }
                            />
                          }
                          label={
                            <Typography
                              sx={{
                                color: "#071F4A",
                                pt: 0.8,
                              }}
                            >
                              <strong>
                                {index + 1}.
                              </strong>{" "}
                              {question.question}
                            </Typography>
                          }
                        />
                      </CardContent>
                    </Card>
                  ))}
                </Box>

                <Alert severity="info" sx={{ mb: 3 }}>
                  Les questions seront importées en Vrai /
                  Faux sans bonne réponse définie. Le QCM sera
                  remis en brouillon jusqu’à ce que vous
                  complétiez les réponses.
                </Alert>

                <Button
                  fullWidth
                  variant="contained"
                  disabled={
                    importing ||
                    selectedQuestions.length === 0
                  }
                  onClick={() => void importQuestions()}
                  startIcon={
                    importing ? (
                      <CircularProgress
                        size={18}
                        sx={{ color: "white" }}
                      />
                    ) : (
                      <CloudUpload />
                    )
                  }
                  sx={{
                    bgcolor: "#071F4A",
                    py: 1.4,
                    textTransform: "none",
                    fontWeight: 800,
                    "&:hover": {
                      bgcolor: "#0A2A63",
                    },
                  }}
                >
                  {importing
                    ? "Import en cours..."
                    : `Importer ${selectedQuestions.length} question${
                        selectedQuestions.length > 1
                          ? "s"
                          : ""
                      }`}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}