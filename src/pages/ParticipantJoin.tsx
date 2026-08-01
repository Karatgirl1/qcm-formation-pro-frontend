import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
  Alert,
} from "@mui/material";

import api from "../api/axios";

type PublicSession = {
  id: number;
  code: string;
  status: string;

  qcm: {
    id: number;
    title: string;
    description: string | null;
    questions: unknown[];
  };
};

export default function ParticipantJoin() {
  const navigate = useNavigate();
  const { code = "" } = useParams();

  const [session, setSession] =
    useState<PublicSession | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await api.get(
          `/public/sessions/${code}`
        );

        setSession(response.data);
      } catch (error: any) {
        console.error(error);

        setErrorMessage(
          error.response?.data?.message ??
            "Cette session est indisponible."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [code]);

  const joinSession = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      alert("Renseignez votre prénom et votre nom.");
      return;
    }

    try {
      setJoining(true);

      const response = await api.post(
        `/public/sessions/${code}/join`,
        {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        }
      );

      sessionStorage.setItem(
        "participant_id",
        String(response.data.id)
      );

      sessionStorage.setItem(
        "participant_code",
        code.toUpperCase()
      );

      sessionStorage.setItem(
        "participant_name",
        `${firstName.trim()} ${lastName.trim()}`
      );

      sessionStorage.setItem(
        "participant_qcm_title",
        session?.qcm.title ?? "QCM Formation Pro"
      );

      navigate(`/play/${code.toUpperCase()}`);
    } catch (error: any) {
      console.error(error);

      alert(
        error.response?.data?.message ??
          "Impossible de rejoindre la session."
      );
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
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
        bgcolor: "#071F4A",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 550,
          borderRadius: 4,
          boxShadow: "0 15px 50px rgba(0,0,0,0.25)",
        }}
      >
        <Box
          sx={{
            height: 8,
            bgcolor: "#E3062C",
          }}
        />

        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Typography
            variant="h4"
            sx={{
              color: "#071F4A",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            QCM Formation Pro
          </Typography>

          {errorMessage ? (
            <Alert severity="error" sx={{ mt: 4 }}>
              {errorMessage}
            </Alert>
          ) : (
            <>
              <Typography
                variant="h5"
                sx={{
                  color: "#071F4A",
                  fontWeight: 700,
                  textAlign: "center",
                  mt: 4,
                }}
              >
                {session?.qcm.title}
              </Typography>

              <Typography
                sx={{
                  color: "#667085",
                  textAlign: "center",
                  mt: 1,
                  mb: 4,
                }}
              >
                {session?.qcm.description ||
                  "Identifiez-vous pour commencer le questionnaire."}
              </Typography>

              <Box
                component="form"
                onSubmit={joinSession}
              >
                <TextField
                  fullWidth
                  required
                  label="Prénom"
                  value={firstName}
                  onChange={(event) =>
                    setFirstName(event.target.value)
                  }
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  required
                  label="Nom"
                  value={lastName}
                  onChange={(event) =>
                    setLastName(event.target.value)
                  }
                  sx={{ mb: 3 }}
                />

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={joining}
                  sx={{
                    bgcolor: "#E3062C",
                    py: 1.5,
                    textTransform: "none",
                    fontWeight: 800,
                    fontSize: 17,

                    "&:hover": {
                      bgcolor: "#C80527",
                    },
                  }}
                >
                  {joining
                    ? "Connexion..."
                    : "Commencer le QCM"}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}