import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowBack, Save } from "@mui/icons-material";
import api from "../api/axios";

export default function CreateQcm() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(20);
  const [mode, setMode] = useState("training");
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);

  const submitQcm = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      alert("Le titre du QCM est obligatoire.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/qcms", {
        title,
        description,
        duration,
        mode,
        is_published: isPublished,
      });

      alert("Le QCM a été créé avec succès.");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Erreur création QCM :", error);

      alert(
        error.response?.data?.message ??
          "Impossible de créer le QCM."
      );
    } finally {
      setLoading(false);
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
      <Box sx={{ maxWidth: 900, mx: "auto" }}>
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
            <Typography
              variant="h4"
              sx={{
                color: "#071F4A",
                fontWeight: 700,
                mb: 1,
              }}
            >
              Créer un nouveau QCM
            </Typography>

            <Typography sx={{ color: "#667085", mb: 4 }}>
              Renseignez les informations principales du questionnaire.
            </Typography>

            <Box component="form" onSubmit={submitQcm}>
              <TextField
                fullWidth
                required
                label="Titre du QCM"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Exemple : Arbitrage kumité – Niveau régional"
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                multiline
                minRows={4}
                label="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Présentez brièvement le contenu et les objectifs du QCM."
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                type="number"
                label="Durée totale en minutes"
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

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="mode-label">Mode du QCM</InputLabel>

                <Select
                  labelId="mode-label"
                  label="Mode du QCM"
                  value={mode}
                  onChange={(event) => setMode(event.target.value)}
                >
                  <MenuItem value="training">
                    Mode entraînement
                  </MenuItem>

                  <MenuItem value="exam">
                    Mode examen
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={isPublished}
                    onChange={(event) =>
                      setIsPublished(event.target.checked)
                    }
                  />
                }
                label="Publier immédiatement ce QCM"
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
                  onClick={() => navigate("/dashboard")}
                  sx={{
                    borderColor: "#071F4A",
                    color: "#071F4A",
                    textTransform: "none",
                    fontWeight: 700,
                  }}
                >
                  Annuler
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  disabled={loading}
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
                  {loading ? "Enregistrement..." : "Créer le QCM"}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}