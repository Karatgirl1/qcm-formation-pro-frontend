
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowBack,
  Assessment,
  ContentCopy,
  Visibility,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

import api from "../api/axios";

type Qcm = {
  id: number;
  title: string;
};

type Session = {
  id: number;
  code: string;
  status: "open" | "closed";
  started_at: string | null;
  participants_count: number;
};

type SessionsResponse = {
  qcm: Qcm;
  sessions: Session[];
};

type CreatedGroup = {
  id: number;
};

function sessionLabel(session: Session) {
  const date = session.started_at
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(session.started_at))
    : "Date inconnue";

  return `${session.code} — ${date} — ${session.participants_count} participant(s)`;
}

export default function ResultGroups() {
  const navigate = useNavigate();

  const [qcms, setQcms] = useState<Qcm[]>([]);
  const [firstQcmId, setFirstQcmId] = useState<number | "">("");
  const [secondQcmId, setSecondQcmId] = useState<number | "">("");

  const [firstSessions, setFirstSessions] = useState<Session[]>([]);
  const [secondSessions, setSecondSessions] = useState<Session[]>([]);

  const [firstSessionId, setFirstSessionId] = useState<number | "">("");
  const [secondSessionId, setSecondSessionId] = useState<number | "">("");

  const [loading, setLoading] = useState(true);
  const [loadingFirstSessions, setLoadingFirstSessions] = useState(false);
  const [loadingSecondSessions, setLoadingSecondSessions] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sharing, setSharing] = useState(false);

  const [groupId, setGroupId] = useState<number | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadQcms = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await api.get<Qcm[]>("/qcms");
        setQcms(response.data ?? []);
      } catch (error: any) {
        setErrorMessage(
          error.response?.data?.message ??
            "Impossible de charger les QCM."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadQcms();
  }, []);

  useEffect(() => {
    if (!firstQcmId) {
      setFirstSessions([]);
      return;
    }

    let cancelled = false;

    const loadSessions = async () => {
      try {
        setLoadingFirstSessions(true);

        const response = await api.get<SessionsResponse>(
          `/qcms/${firstQcmId}/sessions`
        );

        if (!cancelled) {
          setFirstSessions(response.data.sessions ?? []);
        }
      } catch (error: any) {
        if (!cancelled) {
          setErrorMessage(
            error.response?.data?.message ??
              "Impossible de charger les sessions du premier QCM."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingFirstSessions(false);
        }
      }
    };

    void loadSessions();

    return () => {
      cancelled = true;
    };
  }, [firstQcmId]);

  useEffect(() => {
    if (!secondQcmId) {
      setSecondSessions([]);
      return;
    }

    let cancelled = false;

    const loadSessions = async () => {
      try {
        setLoadingSecondSessions(true);

        const response = await api.get<SessionsResponse>(
          `/qcms/${secondQcmId}/sessions`
        );

        if (!cancelled) {
          setSecondSessions(response.data.sessions ?? []);
        }
      } catch (error: any) {
        if (!cancelled) {
          setErrorMessage(
            error.response?.data?.message ??
              "Impossible de charger les sessions du deuxième QCM."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingSecondSessions(false);
        }
      }
    };

    void loadSessions();

    return () => {
      cancelled = true;
    };
  }, [secondQcmId]);

  const resetGroup = () => {
    setGroupId(null);
    setShareUrl("");
    setSuccessMessage("");
    setErrorMessage("");
  };

  const createGroup = async () => {
    if (!firstSessionId || !secondSessionId) {
      setErrorMessage("Sélectionnez les deux sessions.");
      return;
    }

    if (firstSessionId === secondSessionId) {
      setErrorMessage(
        "Vous devez sélectionner deux sessions différentes."
      );
      return;
    }

    try {
      setCreating(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await api.post<CreatedGroup>(
        "/result-groups",
        {
          first_session_id: firstSessionId,
          second_session_id: secondSessionId,
        }
      );

      const createdId = response.data?.id;

      if (!createdId) {
        throw new Error(
          "Le regroupement a été créé, mais son identifiant est introuvable."
        );
      }

      setGroupId(createdId);
      setSuccessMessage(
        "Le regroupement a été créé. Vous pouvez consulter le tableau ou générer son lien de partage."
      );
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message ??
          error.message ??
          "Impossible de créer le regroupement."
      );
    } finally {
      setCreating(false);
    }
  };

  const shareGroup = async () => {
    if (!groupId) {
      return;
    }

    try {
      setSharing(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await api.post(
        `/result-groups/${groupId}/share`
      );

      const token = response.data?.token;

      if (!token) {
        throw new Error(
          "Le lien de partage n’a pas pu être généré."
        );
      }

      const url = `${window.location.origin}/shared-group-results/${token}`;

      setShareUrl(url);

      try {
        await navigator.clipboard.writeText(url);
        setSuccessMessage(
          "Le lien du tableau commun a été copié."
        );
      } catch {
        setSuccessMessage(
          "Le lien est prêt. Copiez-le dans le champ ci-dessous."
        );
      }
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message ??
          error.message ??
          "Impossible de générer le lien de partage."
      );
    } finally {
      setSharing(false);
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
          onClick={() => navigate("/results")}
          sx={{
            mb: 3,
            color: "#071F4A",
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          Retour aux résultats
        </Button>

        <Card
          sx={{
            borderRadius: 3,
            boxShadow: "0 6px 25px rgba(7,31,74,0.08)",
            borderTop: "5px solid #071F4A",
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
              <Assessment
                sx={{ color: "#E3062C", fontSize: 36 }}
              />

              <Typography
                variant="h4"
                sx={{ color: "#071F4A", fontWeight: 800 }}
              >
                Regrouper deux sessions
              </Typography>
            </Box>

            <Typography sx={{ color: "#667085", mb: 4 }}>
              Sélectionnez les deux sessions dont vous souhaitez
              réunir les résultats dans un tableau commun.
            </Typography>

            {errorMessage && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
            )}

            {successMessage && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {successMessage}
              </Alert>
            )}

            {qcms.length === 0 && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Aucun QCM disponible.
              </Alert>
            )}

            <Typography
              variant="h6"
              sx={{ color: "#071F4A", fontWeight: 800, mb: 2 }}
            >
              Première session
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "1fr 1fr",
                },
                gap: 2,
                mb: 4,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>Premier QCM</InputLabel>
                <Select
                  value={firstQcmId}
                  label="Premier QCM"
                  onChange={(event) => {
                    resetGroup();
                    setFirstQcmId(Number(event.target.value));
                    setFirstSessionId("");
                  }}
                >
                  {qcms.map((qcm) => (
                    <MenuItem key={qcm.id} value={qcm.id}>
                      {qcm.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                fullWidth
                disabled={!firstQcmId || loadingFirstSessions}
              >
                <InputLabel>Première session</InputLabel>
                <Select
                  value={firstSessionId}
                  label="Première session"
                  onChange={(event) => {
                    resetGroup();
                    setFirstSessionId(Number(event.target.value));
                  }}
                >
                  {firstSessions.map((session) => (
                    <MenuItem
                      key={session.id}
                      value={session.id}
                    >
                      {sessionLabel(session)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Typography
              variant="h6"
              sx={{ color: "#071F4A", fontWeight: 800, mb: 2 }}
            >
              Deuxième session
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "1fr 1fr",
                },
                gap: 2,
                mb: 4,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>Deuxième QCM</InputLabel>
                <Select
                  value={secondQcmId}
                  label="Deuxième QCM"
                  onChange={(event) => {
                    resetGroup();
                    setSecondQcmId(Number(event.target.value));
                    setSecondSessionId("");
                  }}
                >
                  {qcms.map((qcm) => (
                    <MenuItem key={qcm.id} value={qcm.id}>
                      {qcm.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                fullWidth
                disabled={!secondQcmId || loadingSecondSessions}
              >
                <InputLabel>Deuxième session</InputLabel>
                <Select
                  value={secondSessionId}
                  label="Deuxième session"
                  onChange={(event) => {
                    resetGroup();
                    setSecondSessionId(Number(event.target.value));
                  }}
                >
                  {secondSessions.map((session) => (
                    <MenuItem
                      key={session.id}
                      value={session.id}
                    >
                      {sessionLabel(session)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Button
              variant="contained"
              fullWidth
              disabled={
                creating ||
                !firstSessionId ||
                !secondSessionId ||
                firstSessionId === secondSessionId
              }
              onClick={() => void createGroup()}
              sx={{
                bgcolor: "#E3062C",
                textTransform: "none",
                fontWeight: 800,
                py: 1.4,
                "&:hover": { bgcolor: "#C80527" },
              }}
            >
              {creating
                ? "Création en cours…"
                : "Créer le regroupement"}
            </Button>

            {groupId !== null && (
              <Box
                sx={{
                  mt: 4,
                  p: 3,
                  bgcolor: "#F8FAFC",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "#071F4A",
                    fontWeight: 800,
                    mb: 2,
                  }}
                >
                  Regroupement créé
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => {
                      if (shareUrl) {
                        window.open(
                          shareUrl,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      } else {
                        void shareGroup();
                      }
                    }}
                    sx={{ textTransform: "none" }}
                  >
                    {shareUrl
                      ? "Voir le tableau commun"
                      : "Préparer le lien du tableau"}
                  </Button>

                  <Button
                    variant="contained"
                    startIcon={<ContentCopy />}
                    disabled={sharing}
                    onClick={() => void shareGroup()}
                    sx={{
                      bgcolor: "#071F4A",
                      textTransform: "none",
                      "&:hover": { bgcolor: "#0A2A63" },
                    }}
                  >
                    {sharing
                      ? "Préparation du lien…"
                      : "Copier le lien de partage"}
                  </Button>
                </Box>

                {shareUrl && (
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: "#667085", mb: 1 }}
                    >
                      Lien du tableau commun
                    </Typography>

                    <Box
                      component="input"
                      value={shareUrl}
                      readOnly
                      onFocus={(event) =>
                        event.currentTarget.select()
                      }
                      sx={{
                        width: "100%",
                        boxSizing: "border-box",
                        p: 1.5,
                        border: "1px solid #D0D5DD",
                        borderRadius: 1,
                        color: "#071F4A",
                        bgcolor: "white",
                      }}
                    />
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
