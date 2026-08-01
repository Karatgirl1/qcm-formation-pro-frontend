import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowBack,
  Save,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import api from "../api/axios";

export default function EditQcm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(20);
  const [isPublished, setIsPublished] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadQcm = async () => {
      try {
        const response = await api.get(`/qcms/${id}`);
        const qcm = response.data;

        setTitle(qcm.title ?? "");
        setDescription(qcm.description ?? "");
        setDuration(Number(qcm.duration ?? 20));

        setIsPublished(
          qcm.is_published === true ||
            qcm.is_published === 1
        );
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

  const updateQcm = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!title.trim()) {
      alert("Le titre du QCM est obligatoire.");
      return;
    }

    if (duration < 1) {
      alert("La durée doit être supérieure à zéro.");
      return;
    }

    try {
      setSaving(true);

      await api.put(`/qcms/${id}`, {
        title: title.trim(),
        description: description.trim(),
        duration,
        is_published: isPublished,
      });

      alert("Le QCM a été modifié avec succès.");

      navigate(`/qcms/${id}`);
    } catch (error: any) {
      console.error("Erreur modification QCM :", error);

      alert(
        error.response?.data?.message ??
          "Impossible de modifier le QCM."
      );
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F4F6FA",
        p: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 900, mx: "auto" }}>
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

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        <Card
          sx={{
            borderRadius: 3,
            boxShadow: "0 6px 25px rgba(7,31,74,0.10)",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Typography
              variant="h4"
              sx={{
                color: "#071F4A",
                fontWeight: 700,
                mb: 1,
              }}
            >
              Modifier le QCM
            </Typography>

            <Typography sx={{ color: "#667085", mb: 4 }}>
              Modifiez les informations générales du questionnaire.
            </Typography>

            <Box component="form" onSubmit={updateQcm}>
              <TextField
                fullWidth
                required
                label="Titre du QCM"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                multiline
                minRows={4}
                label="Description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                required
                type="number"
                label="Durée en minutes"
                value={duration}
                onChange={(event) =>
                  setDuration(Number(event.target.value))
                }
                slotProps={{
                  htmlInput: {
                    min: 1,
                  },
                }}
                sx={{ mb: 3 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={isPublished}
                    onChange={(event) =>
                      setIsPublished(event.target.checked)
                    }
                  />
                }
                label={
                  isPublished
                    ? "QCM publié"
                    : "QCM en brouillon"
                }
                sx={{ mb: 4 }}
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/qcms/${id}`)}
                  sx={{
                    color: "#071F4A",
                    borderColor: "#071F4A",
                    textTransform: "none",
                    fontWeight: 700,
                  }}
                >
                  Annuler
                </Button>

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
                    : "Enregistrer les modifications"}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}