import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Add,
  ArrowBack,
  Edit,
  Quiz,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";

import api from "../api/axios";

type Answer = {
  id: number;
  answer: string;
  is_correct: boolean;
};

type Question = {
  id: number;
  question: string;
  type: string;
  points: number;
  timer: number;
  order: number;
  answers?: Answer[];
};

type Qcm = {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  is_published: boolean | number;
  created_at?: string;
  updated_at?: string;
  questions?: Question[];
};

export default function ShowQcm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [qcm, setQcm] = useState<Qcm | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadQcm = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await api.get(`/qcms/${id}`);

        setQcm(response.data);
      } catch (error: any) {
        console.error("Erreur chargement QCM :", error);

        setErrorMessage(
          error.response?.data?.message ??
            "Impossible de charger ce QCM."
        );
      } finally {
        setLoading(false);
      }
    };

    loadQcm();
  }, [id]);

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

  if (errorMessage || !qcm) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#F4F6FA",
          p: 4,
        }}
      >
        <Alert severity="error">
          {errorMessage || "QCM introuvable."}
        </Alert>

        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/dashboard")}
          sx={{
            mt: 3,
            color: "#071F4A",
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          Retour au tableau de bord
        </Button>
      </Box>
    );
  }

  const isPublished =
    qcm.is_published === true || qcm.is_published === 1;

  const questions = qcm.questions ?? [];

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
          onClick={() => navigate("/dashboard")}
          sx={{
            mb: 3,
            color: "#071F4A",
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          Retour au tableau de bord
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
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 3,
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="h3"
                  sx={{
                    color: "#071F4A",
                    fontWeight: 700,
                  }}
                >
                  {qcm.title}
                </Typography>

                <Typography
                  sx={{
                    color: "#667085",
                    mt: 2,
                    maxWidth: 750,
                  }}
                >
                  {qcm.description || "Aucune description"}
                </Typography>
              </Box>

              <Chip
                label={isPublished ? "Publié" : "Brouillon"}
                color={isPublished ? "success" : "default"}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 2,
                mt: 4,
              }}
            >
              <InformationCard
                title="Durée"
                value={`${qcm.duration} minutes`}
              />

              <InformationCard
                title="Questions"
                value={`${questions.length} question${
                  questions.length > 1 ? "s" : ""
                }`}
              />

              <InformationCard
                title="Statut"
                value={isPublished ? "Publié" : "Brouillon"}
              />
            </Box>

            <Box
              sx={{
                mt: 4,
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() =>
                  navigate(`/qcms/${qcm.id}/questions`)
                }
                sx={{
                  bgcolor: "#E3062C",
                  textTransform: "none",
                  fontWeight: 700,

                  "&:hover": {
                    bgcolor: "#C80527",
                  },
                }}
              >
                Ajouter une question
              </Button>

              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() =>
                  navigate(`/qcms/${qcm.id}/edit`)
                }
                sx={{
                  color: "#071F4A",
                  borderColor: "#071F4A",
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                Modifier le QCM
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card
          sx={{
            mt: 3,
            borderRadius: 3,
            boxShadow: "0 6px 25px rgba(7,31,74,0.08)",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Quiz sx={{ color: "#071F4A" }} />

              <Typography
                variant="h5"
                sx={{
                  color: "#071F4A",
                  fontWeight: 700,
                }}
              >
                Questions du QCM
              </Typography>
            </Box>

            {questions.length === 0 ? (
              <Box
                sx={{
                  mt: 3,
                  p: 3,
                  bgcolor: "#F8FAFC",
                  border: "1px dashed #CBD5E1",
                  borderRadius: 2,
                }}
              >
                <Typography sx={{ color: "#667085" }}>
                  Ce QCM ne contient encore aucune question.
                </Typography>

                <Button
                  startIcon={<Add />}
                  onClick={() =>
                    navigate(`/qcms/${qcm.id}/questions`)
                  }
                  sx={{
                    mt: 2,
                    color: "#E3062C",
                    textTransform: "none",
                    fontWeight: 700,
                  }}
                >
                  Créer la première question
                </Button>
              </Box>
            ) : (
              <Box sx={{ mt: 3 }}>
                {questions.map((question, index) => (
                  <Box
                    key={question.id}
                    sx={{
                      p: 2.5,
                      mb: 2,
                      border: "1px solid #E4E7EC",
                      borderRadius: 2,
                      bgcolor: "#FFFFFF",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#E3062C",
                        fontWeight: 700,
                        mb: 0.5,
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
                        mt: 1,
                        color: "#667085",
                      }}
                    >
                      {question.points} point
                      {question.points > 1 ? "s" : ""} ·{" "}
                      {question.timer} seconde
                      {question.timer > 1 ? "s" : ""}
                    </Typography>
                  </Box>
                ))}

                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() =>
                    navigate(`/qcms/${qcm.id}/questions`)
                  }
                  sx={{
                    mt: 1,
                    color: "#071F4A",
                    borderColor: "#071F4A",
                    textTransform: "none",
                    fontWeight: 700,
                  }}
                >
                  Gérer les questions
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

type InformationCardProps = {
  title: string;
  value: string;
};

function InformationCard({
  title,
  value,
}: InformationCardProps) {
  return (
    <Box
      sx={{
        bgcolor: "#F8FAFC",
        border: "1px solid #E4E7EC",
        borderRadius: 2,
        p: 2.5,
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: "#667085" }}
      >
        {title}
      </Typography>

      <Typography
        variant="h6"
        sx={{
          color: "#071F4A",
          fontWeight: 700,
          mt: 0.5,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}