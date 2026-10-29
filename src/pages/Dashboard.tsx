import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";
import QcmCard from "../components/QcmCard";
import QcmFolderBrowser from "../components/QcmFolderBrowser";

import type {
  Qcm,
  QcmFolder,
} from "../components/QcmCard";

import {
  Add,
  Assessment,
  Dashboard as DashboardIcon,
  Home,
  Logout,
  Quiz,
} from "@mui/icons-material";

import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";

const drawerWidth = 290;

type DashboardStatistics = {
  qcms_count: number;
  participants_count: number;
  average_result: number | null;
  active_sessions_count: number;
};

type SelectedFolder = number | null | "all";

export default function Dashboard() {
  const navigate = useNavigate();

  const [qcms, setQcms] = useState<Qcm[]>([]);
  const [folders, setFolders] = useState<QcmFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] =
    useState<SelectedFolder>("all");

  const [statistics, setStatistics] =
    useState<DashboardStatistics>({
      qcms_count: 0,
      participants_count: 0,
      average_result: null,
      active_sessions_count: 0,
    });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const topRef = useRef<HTMLDivElement | null>(null);
  const qcmsRef = useRef<HTMLDivElement | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        qcmsResponse,
        statisticsResponse,
        foldersResponse,
      ] = await Promise.all([
        api.get<Qcm[]>("/qcms"),
        api.get<DashboardStatistics>("/statistics"),
        api.get<QcmFolder[]>("/qcm-folders"),
      ]);

      setQcms(qcmsResponse.data);
      setStatistics(statisticsResponse.data);
      setFolders(foldersResponse.data);
    } catch (err) {
      console.error(
        "Erreur lors du chargement du tableau de bord :",
        err
      );

      setError(
        "Impossible de charger les données du tableau de bord."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const scrollTo = (
    ref: React.RefObject<HTMLDivElement | null>
  ) => {
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const selectFolder = (id: SelectedFolder) => {
    setSelectedFolderId(id);

    window.setTimeout(() => {
      scrollTo(qcmsRef);
    }, 50);
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const selectedFolder =
    typeof selectedFolderId === "number"
      ? folders.find(
          (folder) => folder.id === selectedFolderId
        )
      : null;

  const visibleQcms = qcms.filter((qcm) => {
    if (selectedFolderId === "all") {
      return qcm.folder_id == null;
    }

    if (selectedFolderId === null) {
      return qcm.folder_id == null;
    }

    return Number(qcm.folder_id) === selectedFolderId;
  });

  const sectionTitle =
    selectedFolderId === "all"
      ? "QCM non classés"
      : selectedFolderId === null
        ? "QCM non classés"
        : selectedFolder?.name ?? "Mes QCM";

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#F4F6FA",
      }}
    >
      {/* Menu latéral */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "#071F4A",
            color: "white",
            borderRight: "none",
            overflowY: "auto",
          },
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            bgcolor: "white",
            p: 2,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Box
            component="img"
            src="/logo-karate.png"
            alt="Fédération Française de Karaté"
            sx={{
              width: 170,
              maxHeight: 100,
              objectFit: "contain",
            }}
          />
        </Box>

        <Box sx={{ p: 2.5 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 2,
            }}
          >
            QCM Formation Pro
          </Typography>

          <List>
            <ListItemButton
              onClick={() => {
                setSelectedFolderId("all");
                scrollTo(topRef);
              }}
              sx={{
                bgcolor: "#E3062C",
                borderRadius: 2,
                mb: 1,
                "&:hover": {
                  bgcolor: "#C80527",
                },
              }}
            >
              <ListItemIcon sx={{ color: "white" }}>
                <Home />
              </ListItemIcon>
              <ListItemText primary="Tableau de bord" />
            </ListItemButton>

            <ListItemButton
              onClick={() => selectFolder("all")}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ color: "white" }}>
                <Quiz />
              </ListItemIcon>
              <ListItemText primary="Mes QCM" />
            </ListItemButton>

            <ListItemButton
              onClick={() => navigate("/qcms/create")}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ color: "white" }}>
                <Add />
              </ListItemIcon>
              <ListItemText primary="Nouveau QCM" />
            </ListItemButton>
          </List>

          <Divider
            sx={{
              bgcolor: "rgba(255,255,255,0.25)",
              my: 2,
            }}
          />

          {/* Dossiers toujours visibles */}
          <QcmFolderBrowser
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={selectFolder}
            onRefresh={() => void loadDashboard()}
          />

          <Divider
            sx={{
              bgcolor: "rgba(255,255,255,0.25)",
              my: 2,
            }}
          />

          <List>
            <ListItemButton
              onClick={() => navigate("/results")}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ color: "white" }}>
                <Assessment />
              </ListItemIcon>
              <ListItemText primary="Résultats" />
            </ListItemButton>

            <ListItemButton
              onClick={logout}
              sx={{
                borderRadius: 2,
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.10)",
                },
              }}
            >
              <ListItemIcon sx={{ color: "white" }}>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Déconnexion" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      {/* Partie principale */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
        }}
      >
        {/* Barre supérieure */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            bgcolor: "white",
            color: "#071F4A",
            borderBottom: "3px solid #E3062C",
          }}
        >
          <Toolbar sx={{ minHeight: 78 }}>
            <DashboardIcon sx={{ mr: 2 }} />

            <Typography
              variant="h5"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
              }}
            >
              QCM Formation Pro
            </Typography>

            <Avatar
              sx={{
                bgcolor: "#071F4A",
                mr: 1.5,
              }}
            >
              C
            </Avatar>

            <Box>
              <Typography sx={{ fontWeight: 700 }}>
                Cécile
              </Typography>
              <Typography variant="body2">
                Formateur
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        <Box
          ref={topRef}
          sx={{ p: { xs: 2, md: 4 } }}
        >
          <Typography
            variant="h4"
            sx={{
              color: "#071F4A",
              fontWeight: 700,
            }}
          >
            Bonjour Cécile 👋
          </Typography>

          <Typography
            sx={{
              color: "#5E6780",
              mt: 1,
              mb: 4,
            }}
          >
            Voici un aperçu de vos activités.
          </Typography>

          {/* Cartes statistiques */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                xl: "repeat(3, 1fr)",
              },
              gap: 3,
            }}
          >
            <StatCard
              title="Mes QCM"
              value={String(statistics.qcms_count)}
              subtitle="QCM créés"
              icon={<Quiz />}
              color="#071F4A"
            />

            <Box
              onClick={() => navigate("/results")}
              sx={{
                cursor: "pointer",
                transition: "transform 0.15s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                },
              }}
            >
              <StatCard
                title="Résultat moyen"
                value={
                  statistics.average_result === null
                    ? "—"
                    : `${statistics.average_result} %`
                }
                subtitle="Cliquez pour consulter les résultats"
                icon={<Assessment />}
                color="#071F4A"
              />
            </Box>

            <Box
              onClick={() => navigate("/sessions/active")}
              sx={{
                cursor: "pointer",
                transition: "transform 0.15s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                },
              }}
            >
              <StatCard
                title="Sessions actives"
                value={String(
                  statistics.active_sessions_count
                )}
                subtitle="Cliquez pour gérer les sessions en cours"
                icon={<DashboardIcon />}
                color="#E3062C"
              />
            </Box>
          </Box>

          {/* Zone des QCM */}
          <Card
            ref={qcmsRef}
            sx={{
              mt: 4,
              scrollMarginTop: 24,
              borderRadius: 3,
              boxShadow:
                "0 6px 25px rgba(7,31,74,0.08)",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 2,
                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    variant="h5"
                    sx={{
                      color: "#071F4A",
                      fontWeight: 700,
                    }}
                  >
                    {sectionTitle}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: "#667085",
                      mt: 0.5,
                    }}
                  >
                    {visibleQcms.length} QCM
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() =>
                    navigate("/qcms/create")
                  }
                  sx={{
                    bgcolor: "#E3062C",
                    borderRadius: 2,
                    px: 3,
                    py: 1.2,
                    fontWeight: 700,
                    textTransform: "none",
                    "&:hover": {
                      bgcolor: "#C80527",
                    },
                  }}
                >
                  Nouveau QCM
                </Button>
              </Box>

              {loading ? (
                <Typography>
                  Chargement des QCM...
                </Typography>
              ) : error ? (
                <Typography color="error">
                  {error}
                </Typography>
              ) : visibleQcms.length === 0 ? (
                <Typography sx={{ color: "#667085" }}>
                  Aucun QCM dans cette rubrique.
                </Typography>
              ) : (
                visibleQcms.map((qcm) => (
                  <QcmCard
                    key={qcm.id}
                    qcm={qcm}
                    folders={folders}
                    onRefresh={() =>
                      void loadDashboard()
                    }
                  />
                ))
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
};

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: StatCardProps) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow:
          "0 6px 25px rgba(7,31,74,0.08)",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              bgcolor: color,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              "& svg": {
                fontSize: 30,
              },
            }}
          >
            {icon}
          </Box>

          <Box>
            <Typography sx={{ color: "#39415A" }}>
              {title}
            </Typography>

            <Typography
              variant="h4"
              sx={{
                color: "#071F4A",
                fontWeight: 700,
              }}
            >
              {value}
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: "#667085" }}
            >
              {subtitle}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
