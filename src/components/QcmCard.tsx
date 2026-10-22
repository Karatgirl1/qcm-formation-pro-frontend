import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ContentCopy,
  Delete,
  DriveFileMove,
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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

import api from "../api/axios";

export type Qcm = {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  is_published: boolean | number;
  folder_id: number | null;
};

export type QcmFolder = {
  id: number;
  name: string;
  parent_id: number | null;
  qcms_count?: number;
};

type Props = {
  qcm: Qcm;
  folders?: QcmFolder[];
  onRefresh?: () => void;
};

export default function QcmCard({
  qcm,
  folders = [],
  onRefresh,
}: Props) {
  const navigate = useNavigate();

  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [moving, setMoving] = useState(false);

  const isPublished =
    qcm.is_published === true || qcm.is_published === 1;

  const refresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  const deleteQcm = async () => {
    if (!window.confirm(`Supprimer le QCM « ${qcm.title} » ?`)) {
      return;
    }

    try {
      setDeleting(true);
      await api.delete(`/qcms/${qcm.id}`);
      refresh();
    } catch (error: any) {
      window.alert(
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
      await api.post(`/qcms/${qcm.id}/duplicate`);
      refresh();
    } catch (error: any) {
      window.alert(
        error.response?.data?.message ??
          "Impossible de dupliquer le QCM."
      );
    } finally {
      setDuplicating(false);
    }
  };

  const moveQcm = async (folderId: number | null) => {
    try {
      setMoving(true);

      await api.patch(`/qcms/${qcm.id}/folder`, {
        folder_id: folderId,
      });

      refresh();
    } catch (error: any) {
      window.alert(
        error.response?.data?.message ??
          "Impossible de déplacer le QCM."
      );
    } finally {
      setMoving(false);
    }
  };

  const folderLabel = (folder: QcmFolder): string => {
    const names = [folder.name];
    const visited = new Set<number>([folder.id]);
    let parentId = folder.parent_id;

    while (parentId !== null && !visited.has(parentId)) {
      visited.add(parentId);
      const parent = folders.find((f) => f.id === parentId);

      if (!parent) break;

      names.unshift(parent.name);
      parentId = parent.parent_id;
    }

    return names.join(" / ");
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        mb: 3,
        borderLeft: `6px solid ${
          isPublished ? "#039855" : "#98A2B3"
        }`,
        boxShadow: "0 5px 20px rgba(7,31,74,0.08)",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography
          variant="h5"
          sx={{ color: "#071F4A", fontWeight: 700 }}
        >
          {qcm.title}
        </Typography>

        <Typography sx={{ color: "#667085", mt: 1, mb: 2 }}>
          {qcm.description || "Aucune description"}
        </Typography>

        <Typography sx={{ color: "#344054", mb: 2 }}>
          Durée : {qcm.duration} minutes
        </Typography>

        <Chip
          label={isPublished ? "Publié" : "Brouillon"}
          color={isPublished ? "success" : "default"}
          size="small"
        />

        <Box sx={{ mt: 2, maxWidth: 400 }}>
          <FormControl fullWidth size="small" disabled={moving}>
            <InputLabel id={`folder-${qcm.id}`}>
              Ranger dans un dossier
            </InputLabel>

            <Select
              labelId={`folder-${qcm.id}`}
              value={qcm.folder_id ?? ""}
              label="Ranger dans un dossier"
              onChange={(event) => {
                const value = event.target.value;

                void moveQcm(
                  value === "" ? null : Number(value)
                );
              }}
              startAdornment={
                <DriveFileMove
                  sx={{ mr: 1, color: "#071F4A" }}
                />
              }
            >
              <MenuItem value="">QCM non classés</MenuItem>

              {folders.map((folder) => (
                <MenuItem key={folder.id} value={folder.id}>
                  {folderLabel(folder)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

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
            onClick={() => navigate(`/qcms/${qcm.id}`)}
          >
            Voir
          </Button>

          <Button
            startIcon={<Edit />}
            variant="outlined"
            onClick={() => navigate(`/qcms/${qcm.id}/edit`)}
          >
            Modifier
          </Button>

          <Button
            startIcon={<PlayArrow />}
            variant="contained"
            disabled={!isPublished}
            onClick={() => navigate(`/qcms/${qcm.id}/launch`)}
            sx={{
              bgcolor: "#E3062C",
              "&:hover": { bgcolor: "#C80527" },
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
            sx={{ color: "#B54708", mt: 2 }}
          >
            Publiez ce QCM avant de pouvoir lancer une session.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
