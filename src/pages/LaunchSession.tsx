import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ReactNode } from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import QRCode from "react-qr-code";

import {
  ArrowBack,
  CheckCircle,
  Close,
  ContentCopy,
  Groups,
  HourglassTop,
  Launch,
  PlayArrow,
  Refresh,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  TextField,
  Typography,
} from "@mui/material";

import api from "../api/axios";

type ParticipantAnswer = {
  id: number;
  question_id: number;
};

type Participant = {
  id: number;
  first_name: string;
  last_name: string;
  started_at: string | null;
  completed_at: string | null;
  score: number;
  total_points: number;
  answers_count?: number;
  live_score?: number;
  answers?: ParticipantAnswer[];
};

type SessionQcm = {
  id: number;
  title: string;
  questions?: {
    id: number;
  }[];
};

type QuizSession = {
  id: number;
  code: string;
  status: "open" | "closed";
  started_at?: string | null;
  ended_at?: string | null;
  qcm?: SessionQcm;
  participants?: Participant[];
};

export default function LaunchSession() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [session, setSession] =
    useState<QuizSession | null>(null);

  const [creating, setCreating] = useState(false);
  const [closing, setClosing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const participantUrl = session
    ? `${window.location.origin}/join/${session.code}`
    : "";

  const participants = session?.participants ?? [];

  const totalQuestions =
    session?.qcm?.questions?.length ?? 0;

  const completedParticipants = useMemo(
    () =>
      participants.filter(
        (participant) =>
          participant.completed_at !== null
      ),
    [participants]
  );

  const activeParticipants = useMemo(
    () =>
      participants.filter(
        (participant) =>
          participant.completed_at === null
      ),
    [participants]
  );

  const averageScore = useMemo(() => {
    const results = completedParticipants.filter(
      (participant) =>
        participant.total_points > 0
    );

    if (results.length === 0) {
      return null;
    }

    const totalPercentage = results.reduce(
      (total, participant) => {
        return (
          total +
          (participant.score /
            participant.total_points) *
            100
        );
      },
      0
    );

    return totalPercentage / results.length;
  }, [completedParticipants]);

  const extractErrorMessage = (
    error: any,
    fallback: string
  ): string => {
    console.error(
      "Erreur complète :",
      error
    );

    console.error(
      "Réponse Laravel :",
      error?.response?.data
    );

    const validationErrors =
      error?.response?.data?.errors;

    if (validationErrors) {
      const firstError = Object.values(
        validationErrors
      )[0];

      if (
        Array.isArray(firstError) &&
        firstError.length > 0
      ) {
        return String(firstError[0]);
      }
    }

    return (
      error?.response?.data?.message ??
      error?.message ??
      fallback
    );
  };

  const loadSessionDetails = useCallback(
    async (showLoader = false) => {
      if (!session?.id) {
        return;
      }

      try {
        if (showLoader) {
          setRefreshing(true);
        }

        const response = await api.get(
          `/sessions/${session.id}`
        );

        setSession(response.data);
        setErrorMessage("");
      } catch (error: any) {
        setErrorMessage(
          extractErrorMessage(
            error,
            "Impossible d’actualiser la session."
          )
        );
      } finally {
        if (showLoader) {
          setRefreshing(false);
        }
      }
    },
    [session?.id]
  );

  useEffect(() => {
    if (
      !session?.id ||
      session.status !== "open"
    ) {
      return;
    }

    const intervalId = window.setInterval(
      () => {
        void loadSessionDetails(false);
      },
      3000
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    session?.id,
    session?.status,
    loadSessionDetails,
  ]);

  const createSession = async () => {
    if (!id) {
      setErrorMessage(
        "L’identifiant du QCM est introuvable."
      );

      return;
    }

    try {
      setCreating(true);
      setErrorMessage("");

      const creationResponse = await api.post(
        `/qcms/${id}/sessions`
      );

      const createdSession: QuizSession =
        creationResponse.data;

      const detailsResponse = await api.get(
        `/sessions/${createdSession.id}`
      );

      setSession(detailsResponse.data);
    } catch (error: any) {
      setErrorMessage(
        extractErrorMessage(
          error,
          "Impossible de créer la session."
        )
      );
    } finally {
      setCreating(false);
    }
  };

  const copyParticipantLink = async () => {
    if (!participantUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        participantUrl
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Erreur lors de la copie :",
        error
      );

      alert(
        "La copie automatique a échoué. Sélectionnez le lien manuellement."
      );
    }
  };

  const openParticipantPage = () => {
    if (!participantUrl) {
      return;
    }

    window.open(
      participantUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const closeSession = async () => {
    if (!session) {
      return;
    }

    const confirmed = window.confirm(
      "Voulez-vous vraiment fermer cette session ? Les nouveaux participants ne pourront plus la rejoindre."
    );

    if (!confirmed) {
      return;
    }

    try {
      setClosing(true);
      setErrorMessage("");

      await api.post(
        `/sessions/${session.id}/close`
      );

      setSession((currentSession) => {
        if (!currentSession) {
          return currentSession;
        }

        return {
          ...currentSession,
          status: "closed",
          ended_at:
            new Date().toISOString(),
        };
      });
    } catch (error: any) {
      setErrorMessage(
        extractErrorMessage(
          error,
          "Impossible de fermer la session."
        )
      );
    } finally {
      setClosing(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F4F6FA",
        p: {
          xs: 2,
          md: 4,
        },
      }}
    >
      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
        }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={() =>
            navigate(`/qcms/${id}`)
          }
          sx={{
            mb: 3,
            color: "#071F4A",
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          Retour au QCM
        </Button>

        <Card
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            boxShadow:
              "0 12px 40px rgba(7,31,74,0.14)",
          }}
        >
          <Box
            sx={{
              height: 8,
              bgcolor: "#E3062C",
            }}
          />

          <CardContent
            sx={{
              p: {
                xs: 3,
                md: 5,
              },
            }}
          >
            <Typography
              variant="h3"
              sx={{
                color: "#071F4A",
                fontWeight: 800,
              }}
            >
              Session du QCM
            </Typography>

            <Typography
              sx={{
                color: "#667085",
                mt: 1,
                mb: 4,
              }}
            >
              Créez une session, affichez le QR
              Code et suivez les participants en
              direct.
            </Typography>

            {errorMessage && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  whiteSpace: "pre-wrap",
                }}
              >
                {errorMessage}
              </Alert>
            )}

            {!session ? (
              <Box
                sx={{
                  bgcolor: "#F8FAFC",
                  border:
                    "1px solid #E4E7EC",
                  borderRadius: 3,
                  p: {
                    xs: 3,
                    md: 5,
                  },
                  textAlign: "center",
                }}
              >
                <PlayArrow
                  sx={{
                    fontSize: 75,
                    color: "#E3062C",
                  }}
                />

                <Typography
                  variant="h5"
                  sx={{
                    color: "#071F4A",
                    fontWeight: 700,
                    mt: 2,
                  }}
                >
                  Le QCM est prêt
                </Typography>

                <Typography
                  sx={{
                    color: "#667085",
                    mt: 1,
                    mb: 3,
                  }}
                >
                  Créez une session accessible aux
                  participants.
                </Typography>

                <Button
                  variant="contained"
                  size="large"
                  startIcon={
                    creating ? (
                      <CircularProgress
                        size={20}
                        sx={{
                          color: "white",
                        }}
                      />
                    ) : (
                      <PlayArrow />
                    )
                  }
                  onClick={createSession}
                  disabled={creating}
                  sx={{
                    bgcolor: "#E3062C",
                    px: 4,
                    py: 1.4,
                    textTransform: "none",
                    fontWeight: 800,

                    "&:hover": {
                      bgcolor: "#C80527",
                    },
                  }}
                >
                  {creating
                    ? "Création en cours..."
                    : "Créer et ouvrir la session"}
                </Button>
              </Box>
            ) : (
              <>
                <Alert
                  severity={
                    session.status === "open"
                      ? "success"
                      : "warning"
                  }
                  sx={{
                    mb: 4,
                  }}
                >
                  {session.status === "open"
                    ? "La session est ouverte. Les participants peuvent se connecter."
                    : "La session est fermée."}
                </Alert>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      lg: "420px 1fr",
                    },
                    gap: 4,
                    alignItems: "start",
                  }}
                >
                  <AccessCard
                    participantUrl={
                      participantUrl
                    }
                    sessionCode={session.code}
                    copied={copied}
                    onCopy={
                      copyParticipantLink
                    }
                    onOpen={
                      openParticipantPage
                    }
                  />

                  <Box>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(3, 1fr)",
                        },
                        gap: 2,
                        mb: 3,
                      }}
                    >
                      <StatisticCard
                        title="Connectés"
                        value={
                          participants.length
                        }
                        icon={<Groups />}
                      />

                      <StatisticCard
                        title="En cours"
                        value={
                          activeParticipants.length
                        }
                        icon={<HourglassTop />}
                      />

                      <StatisticCard
                        title="Terminés"
                        value={
                          completedParticipants.length
                        }
                        icon={<CheckCircle />}
                      />
                    </Box>

                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 3,
                      }}
                    >
                      <CardContent
                        sx={{
                          p: 3,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems: "center",
                            gap: 2,
                            mb: 3,
                            flexWrap: "wrap",
                          }}
                        >
                          <Box>
                            <Typography
                              variant="h5"
                              sx={{
                                color:
                                  "#071F4A",
                                fontWeight: 800,
                              }}
                            >
                              Participants en direct
                            </Typography>

                            <Typography
                              variant="body2"
                              sx={{
                                color:
                                  "#667085",
                              }}
                            >
                              Actualisation
                              automatique toutes les
                              trois secondes.
                            </Typography>
                          </Box>

                          <Button
                            startIcon={
                              refreshing ? (
                                <CircularProgress
                                  size={17}
                                />
                              ) : (
                                <Refresh />
                              )
                            }
                            onClick={() =>
                              void loadSessionDetails(
                                true
                              )
                            }
                            disabled={refreshing}
                            sx={{
                              color:
                                "#071F4A",
                              textTransform:
                                "none",
                              fontWeight: 700,
                            }}
                          >
                            Actualiser
                          </Button>
                        </Box>

                        {averageScore !== null && (
                          <Alert
                            severity="info"
                            sx={{
                              mb: 3,
                            }}
                          >
                            Score moyen des
                            participants terminés :{" "}
                            <strong>
                              {averageScore.toFixed(
                                1
                              )}{" "}
                              %
                            </strong>
                          </Alert>
                        )}

                        {participants.length ===
                        0 ? (
                          <Box
                            sx={{
                              textAlign:
                                "center",
                              py: 5,
                              bgcolor:
                                "#F8FAFC",
                              borderRadius: 2,
                            }}
                          >
                            <Groups
                              sx={{
                                fontSize: 55,
                                color:
                                  "#98A2B3",
                              }}
                            />

                            <Typography
                              sx={{
                                color:
                                  "#667085",
                                mt: 1,
                              }}
                            >
                              Aucun participant
                              connecté pour le
                              moment.
                            </Typography>
                          </Box>
                        ) : (
                          participants.map(
                            (participant) => (
                              <ParticipantRow
                                key={
                                  participant.id
                                }
                                participant={
                                  participant
                                }
                                totalQuestions={
                                  totalQuestions
                                }
                              />
                            )
                          )
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                </Box>

                <Divider
                  sx={{
                    my: 4,
                  }}
                />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#667085",
                    }}
                  >
                    {session.status === "open"
                      ? "Les participants peuvent encore rejoindre la session."
                      : "La session n’accepte plus de nouveaux participants."}
                  </Typography>

                  {session.status === "open" && (
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={
                        closing ? (
                          <CircularProgress
                            size={18}
                            sx={{
                              color: "white",
                            }}
                          />
                        ) : (
                          <Close />
                        )
                      }
                      onClick={closeSession}
                      disabled={closing}
                      sx={{
                        textTransform: "none",
                        fontWeight: 800,
                      }}
                    >
                      {closing
                        ? "Fermeture..."
                        : "Fermer la session"}
                    </Button>
                  )}
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

type AccessCardProps = {
  participantUrl: string;
  sessionCode: string;
  copied: boolean;
  onCopy: () => void;
  onOpen: () => void;
};

function AccessCard({
  participantUrl,
  sessionCode,
  copied,
  onCopy,
  onOpen,
}: AccessCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
      }}
    >
      <CardContent
        sx={{
          p: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            bgcolor: "white",
            p: 2,
          }}
        >
          <QRCode
            value={participantUrl}
            size={250}
            bgColor="#FFFFFF"
            fgColor="#071F4A"
            level="H"
          />
        </Box>

        <Typography
          sx={{
            color: "#667085",
            fontWeight: 600,
            textAlign: "center",
            mt: 2,
          }}
        >
          Code de la session
        </Typography>

        <Box
          sx={{
            bgcolor: "#071F4A",
            color: "white",
            borderRadius: 3,
            px: 2,
            py: 2,
            mt: 1,
            mb: 3,
            textAlign: "center",
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              letterSpacing: 6,
            }}
          >
            {sessionCode}
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="Lien participant"
          value={participantUrl}
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
        />

        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            mt: 2,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<ContentCopy />}
            onClick={onCopy}
            sx={{
              color: "#071F4A",
              borderColor: "#071F4A",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            {copied
              ? "Lien copié"
              : "Copier"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<Launch />}
            onClick={onOpen}
            sx={{
              color: "#071F4A",
              borderColor: "#071F4A",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Tester
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

type StatisticCardProps = {
  title: string;
  value: number;
  icon: ReactNode;
};

function StatisticCard({
  title,
  value,
  icon,
}: StatisticCardProps) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow:
          "0 5px 20px rgba(7,31,74,0.08)",
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          p: 2.5,
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: "#071F4A",
            color: "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {icon}
        </Box>

        <Box>
          <Typography
            variant="body2"
            sx={{
              color: "#667085",
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="h4"
            sx={{
              color: "#071F4A",
              fontWeight: 800,
            }}
          >
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

type ParticipantRowProps = {
  participant: Participant;
  totalQuestions: number;
};

function ParticipantRow({
  participant,
  totalQuestions,
}: ParticipantRowProps) {
  const isCompleted =
    participant.completed_at !== null;

  const liveAnsweredQuestions =
    participant.answers_count ??
    participant.answers?.length ??
    0;

  const answeredQuestions = isCompleted
    ? totalQuestions
    : Math.min(
        totalQuestions,
        liveAnsweredQuestions
      );

  const progress =
    totalQuestions > 0
      ? Math.min(
          100,
          (answeredQuestions / totalQuestions) * 100
        )
      : 0;

  const displayedScore = isCompleted
    ? participant.score
    : participant.live_score ?? 0;

  const scorePercentage =
    participant.total_points > 0
      ? (displayedScore /
          participant.total_points) *
        100
      : null;


  return (
    <Box
      sx={{
        p: 2,
        mb: 2,
        border: "1px solid #E4E7EC",
        borderRadius: 2,
        bgcolor: "#FFFFFF",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography
            sx={{
              color: "#071F4A",
              fontWeight: 700,
            }}
          >
            {participant.first_name}{" "}
            {participant.last_name}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "#667085",
            }}
          >
            {answeredQuestions} /{" "}
            {totalQuestions} question
            {totalQuestions > 1 ? "s" : ""}
          </Typography>
        </Box>

        <Chip
          label={
            isCompleted
              ? scorePercentage !== null
                ? `Terminé · ${scorePercentage.toFixed(
                    0
                  )} %`
                : "Terminé"
              : `${displayedScore} pt${displayedScore > 1 ? "s" : ""}`
          }
          color={
            isCompleted
              ? "success"
              : "warning"
          }
          size="small"
        />
      </Box>

      <LinearProgress
        variant="determinate"
        value={
          isCompleted ? 100 : progress
        }
        sx={{
          height: 7,
          borderRadius: 4,
          mt: 2,

          "& .MuiLinearProgress-bar": {
            bgcolor: isCompleted
              ? "#039855"
              : "#E3062C",
          },
        }}
      />
    </Box>
  );
}