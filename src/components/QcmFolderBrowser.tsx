
import { useEffect, useState } from "react";
import type { MouseEvent, ReactNode } from "react";

import {
  Add,
  ChevronRight,
  Delete,
  DriveFileMove,
  Edit,
  ExpandMore,
  Folder,
  FolderOpen,
  MoreVert,
} from "@mui/icons-material";

import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";

import api from "../api/axios";
import type { QcmFolder } from "./QcmCard";

type SelectedFolder = number | null | "all";

type Props = {
  folders: QcmFolder[];
  selectedFolderId: SelectedFolder;
  onSelectFolder: (id: SelectedFolder) => void;
  onRefresh: () => void;
};

export default function QcmFolderBrowser({
  folders,
  selectedFolderId,
  onSelectFolder,
  onRefresh,
}: Props) {
  const [expanded, setExpanded] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const [menuAnchor, setMenuAnchor] =
    useState<HTMLElement | null>(null);

  const [menuFolder, setMenuFolder] =
    useState<QcmFolder | null>(null);

  useEffect(() => {
    if (
      selectedFolderId === "all" ||
      selectedFolderId === null
    ) {
      return;
    }

    const ancestors: number[] = [];
    const visited = new Set<number>();

    let current = folders.find(
      (folder) => folder.id === selectedFolderId
    );

    while (
      current &&
      current.parent_id !== null
    ) {
      const parentId = current.parent_id;

      if (visited.has(parentId)) break;

      visited.add(parentId);
      ancestors.push(parentId);

      current = folders.find(
        (folder) => folder.id === parentId
      );
    }

    setExpanded((previous) => [
      ...new Set([...previous, ...ancestors]),
    ]);
  }, [selectedFolderId, folders]);

  const errorMessage = (error: unknown): string => {
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error
    ) {
      const response = (
        error as {
          response?: {
            data?: {
              message?: string;
              errors?: Record<string, string[]>;
            };
          };
        }
      ).response;

      const firstError = response?.data?.errors
        ? Object.values(response.data.errors)[0]?.[0]
        : undefined;

      return (
        firstError ??
        response?.data?.message ??
        "Une erreur est survenue."
      );
    }

    return "Une erreur est survenue.";
  };

  const createFolder = async (
    parentId: number | null = null
  ) => {
    const name = window.prompt(
      parentId === null
        ? "Nom du nouveau dossier :"
        : "Nom du nouveau sous-dossier :"
    );

    if (!name?.trim()) return;

    try {
      setBusy(true);

      await api.post("/qcm-folders", {
        name: name.trim(),
        parent_id: parentId,
      });

      if (parentId !== null) {
        setExpanded((previous) => [
          ...new Set([...previous, parentId]),
        ]);
      }

      onRefresh();
    } catch (error) {
      window.alert(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const renameFolder = async (folder: QcmFolder) => {
    const name = window.prompt(
      "Nouveau nom du dossier :",
      folder.name
    );

    if (!name?.trim() || name.trim() === folder.name) {
      return;
    }

    try {
      setBusy(true);

      await api.patch(`/qcm-folders/${folder.id}`, {
        name: name.trim(),
      });

      onRefresh();
    } catch (error) {
      window.alert(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const isDescendant = (
    candidateId: number,
    ancestorId: number
  ): boolean => {
    const visited = new Set<number>();

    let current = folders.find(
      (folder) => folder.id === candidateId
    );

    while (
      current &&
      current.parent_id !== null
    ) {
      const parentId = current.parent_id;

      if (parentId === ancestorId) {
        return true;
      }

      if (visited.has(parentId)) break;

      visited.add(parentId);

      current = folders.find(
        (folder) => folder.id === parentId
      );
    }

    return false;
  };

  const moveFolder = async (folder: QcmFolder) => {
    const available = folders.filter(
      (candidate) =>
        candidate.id !== folder.id &&
        !isDescendant(candidate.id, folder.id)
    );

    const options = available
      .map(
        (candidate) =>
          `${candidate.id} : ${candidate.name}`
      )
      .join("\n");

    const answer = window.prompt(
      "Déplacer le dossier vers :\n\n" +
        "0 : Racine (dossier principal)\n" +
        options +
        "\n\nSaisissez le numéro du dossier parent :",
      String(folder.parent_id ?? 0)
    );

    if (answer === null) return;

    const id = Number(answer.trim());

    if (
      answer.trim() === "" ||
      !Number.isInteger(id)
    ) {
      window.alert("Veuillez saisir un numéro valide.");
      return;
    }

    if (
      id !== 0 &&
      !available.some(
        (candidate) => candidate.id === id
      )
    ) {
      window.alert("Dossier parent invalide.");
      return;
    }

    try {
      setBusy(true);

      await api.patch(`/qcm-folders/${folder.id}`, {
        parent_id: id === 0 ? null : id,
      });

      if (id !== 0) {
        setExpanded((previous) => [
          ...new Set([...previous, id]),
        ]);
      }

      onRefresh();
    } catch (error) {
      window.alert(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const deleteFolder = async (folder: QcmFolder) => {
    const confirmed = window.confirm(
      `Supprimer le dossier « ${folder.name} » ?\n\n` +
        "Les QCM seront conservés dans " +
        "« QCM non classés ».\n" +
        "Les sous-dossiers seront remontés d'un niveau."
    );

    if (!confirmed) return;

    try {
      setBusy(true);

      await api.delete(`/qcm-folders/${folder.id}`);

      if (selectedFolderId === folder.id) {
        onSelectFolder("all");
      }

      onRefresh();
    } catch (error) {
      window.alert(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const toggleExpanded = (id: number) => {
    setExpanded((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id]
    );
  };

  const openMenu = (
    event: MouseEvent<HTMLElement>,
    folder: QcmFolder
  ) => {
    event.stopPropagation();

    setMenuAnchor(event.currentTarget);
    setMenuFolder(folder);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuFolder(null);
  };

  const runMenuAction = (
    action: (folder: QcmFolder) => Promise<void>
  ) => {
    const folder = menuFolder;

    closeMenu();

    if (folder) {
      void action(folder);
    }
  };

  const renderFolders = (
    parentId: number | null,
    level = 0,
    visited = new Set<number>()
  ): ReactNode => {
    return folders
      .filter(
        (folder) =>
          folder.parent_id === parentId &&
          !visited.has(folder.id)
      )
      .map((folder) => {
        const nextVisited = new Set(visited);
        nextVisited.add(folder.id);

        const hasChildren = folders.some(
          (candidate) =>
            candidate.parent_id === folder.id
        );

        const isExpanded = expanded.includes(folder.id);
        const isSelected =
          selectedFolderId === folder.id;

        return (
          <Box key={folder.id}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                pl: Math.min(level * 1.5, 8),
                borderRadius: 1.5,
                bgcolor: isSelected
                  ? "rgba(227,6,44,0.65)"
                  : "transparent",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.12)",
                },
              }}
            >
              <IconButton
                size="small"
                sx={{ color: "white", p: 0.5 }}
                disabled={!hasChildren}
                onClick={() =>
                  toggleExpanded(folder.id)
                }
              >
                {hasChildren ? (
                  isExpanded ? (
                    <ExpandMore />
                  ) : (
                    <ChevronRight />
                  )
                ) : (
                  <Box sx={{ width: 20 }} />
                )}
              </IconButton>

              <Box
                onClick={() => {
                  onSelectFolder(folder.id);

                  if (hasChildren && !isExpanded) {
                    toggleExpanded(folder.id);
                  }
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  flexGrow: 1,
                  minWidth: 0,
                  cursor: "pointer",
                  py: 1,
                }}
              >
                {isExpanded ? (
                  <FolderOpen
                    sx={{
                      color: "#FFD166",
                      fontSize: 21,
                    }}
                  />
                ) : (
                  <Folder
                    sx={{
                      color: "#FFD166",
                      fontSize: 21,
                    }}
                  />
                )}

                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    color: "white",
                    fontWeight: 600,
                  }}
                >
                  {folder.name}
                </Typography>
              </Box>

              <Tooltip title="Options du dossier">
                <IconButton
                  size="small"
                  onClick={(event) =>
                    openMenu(event, folder)
                  }
                  sx={{ color: "white" }}
                >
                  <MoreVert />
                </IconButton>
              </Tooltip>
            </Box>

            {hasChildren && isExpanded && (
              <Box>
                {renderFolders(
                  folder.id,
                  level + 1,
                  nextVisited
                )}
              </Box>
            )}
          </Box>
        );
      });
  };

  return (
    <Box sx={{ mt: 1, color: "white" }}>
      <Typography
        sx={{
          color: "white",
          fontWeight: 700,
          fontSize: 15,
          mb: 1,
        }}
      >
        Mes dossiers
      </Typography>

      <Button
        fullWidth
        size="small"
        startIcon={
          busy ? (
            <CircularProgress size={16} />
          ) : (
            <Add />
          )
        }
        disabled={busy}
        onClick={() => void createFolder()}
        sx={{
          color: "white",
          textTransform: "none",
          justifyContent: "flex-start",
          mb: 1,
          border:
            "1px solid rgba(255,255,255,0.25)",
        }}
      >
        Nouveau dossier
      </Button>

      <Button
        fullWidth
        onClick={() => onSelectFolder(null)}
        sx={{
          color: "white",
          textTransform: "none",
          justifyContent: "flex-start",
          bgcolor:
            selectedFolderId === null
              ? "rgba(227,6,44,0.65)"
              : "transparent",
        }}
      >
        <Folder
          sx={{
            mr: 1,
            color: "#FFD166",
          }}
        />
        QCM non classés
      </Button>

      {folders.length === 0 ? (
        <Typography
          variant="caption"
          sx={{
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Aucun dossier créé.
        </Typography>
      ) : (
        <Box sx={{ mt: 1 }}>
          {renderFolders(null)}
        </Box>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
      >
        <MenuItem
          onClick={() =>
            runMenuAction((folder) =>
              createFolder(folder.id)
            )
          }
        >
          <Add sx={{ mr: 1 }} />
          Nouveau sous-dossier
        </MenuItem>

        <MenuItem
          onClick={() =>
            runMenuAction(renameFolder)
          }
        >
          <Edit sx={{ mr: 1 }} />
          Renommer
        </MenuItem>

        <MenuItem
          onClick={() =>
            runMenuAction(moveFolder)
          }
        >
          <DriveFileMove sx={{ mr: 1 }} />
          Déplacer le dossier
        </MenuItem>

        <MenuItem
          onClick={() =>
            runMenuAction(deleteFolder)
          }
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1 }} />
          Supprimer
        </MenuItem>
      </Menu>
    </Box>
  );
}
