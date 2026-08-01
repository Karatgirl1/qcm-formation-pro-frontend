import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ContentCopy,
  Delete,
  Edit,
  PlayArrow,
  Visibility,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";

import api from "../api/axios";

type Qcm = {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  is_published: boolean | number;
};

type Props = {
  qcm: Qcm;
};

export default function QcmCard({ qcm }: Props) {
  const navigate = useNavigate();

  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] =
    useState(false);

  const isPublished =
    qcm.is_published === true ||
    qcm.is_published === 1;

  const deleteQcm = async () => {
    const confirmed = window.confirm(
      `Supprimer le QCM « ${qcm.title} » ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      await api.delete(`/qcms/${qcm.id}`);

      window.location.reload();
    } catch (error: any) {
      alert(
        error.response?.data?.message ??
          "Impossible de supprimer le QCM."
      );
    } finally {
      setDeleting(false);
    }
  };

  const duplicateQcm = async () => {
    try {
      setDuplicating(true);

      await api.post("/qcms", {
        title: `${qcm.title} - Copie`,
        description: qcm.description ?? "",
        duration: qcm.duration,
      });

      window.location.reload();
    } catch (error: any) {
      alert(
        error.response?.data?.message ??
          "Impossible de dupliquer le QCM."
      );
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        mb: 3,
        borderLeft: `6px solid ${
          isPublished ? "#039855" : "#98A2B3"
        }`,
        boxShadow:
          "0 5px 20px rgba(7,31,74,0.08)",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography
          variant="h5"
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
            mt: 1,
            mb: 2,
          }}
        >
          {qcm.description || "Aucune description"}
        </Typography>

        <Typography sx={{ color: "#344054", mb: 2 }}>
          Durée : {qcm.duration} minutes
        </Typography>

        <Chip
          label={
            isPublished ? "Publié" : "Brouillon"
          }
          color={
            isPublished ? "success" : "default"
          }
          size="small"
        />

        <Box
          sx={{
            mt: 3,
            display: "flex",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Button
            startIcon={<Visibility />}
            variant="outlined"
            onClick={() =>
              navigate(`/qcms/${qcm.id}`)
            }
          >
            Voir
          </Button>

          <Button
            startIcon={<Edit />}
            variant="outlined"
            onClick={() =>
              navigate(`/qcms/${qcm.id}/edit`)
            }
          >
            Modifier
          </Button>

          <Button
            startIcon={<PlayArrow />}
            variant="contained"
            disabled={!isPublished}
            onClick={() =>
              navigate(`/qcms/${qcm.id}/launch`)
            }
            sx={{
              bgcolor: "#E3062C",

              "&:hover": {
                bgcolor: "#C80527",
              },
            }}
          >
            Lancer
          </Button>

          <Button
            startIcon={
              duplicating ? (
                <CircularProgress size={17} />
              ) : (
                <ContentCopy />
              )
            }
            variant="outlined"
            disabled={duplicating}
            onClick={duplicateQcm}
          >
            Dupliquer
          </Button>

          <Button
            startIcon={
              deleting ? (
                <CircularProgress size={17} />
              ) : (
                <Delete />
              )
            }
            variant="outlined"
            color="error"
            disabled={deleting}
            onClick={deleteQcm}
          >
            Supprimer
          </Button>
        </Box>

        {!isPublished && (
          <Typography
            variant="body2"
            sx={{
              color: "#B54708",
              mt: 2,
            }}
          >
            Publiez ce QCM avant de pouvoir lancer une
            session.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}