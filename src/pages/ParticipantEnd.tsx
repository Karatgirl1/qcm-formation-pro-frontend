import { CheckCircle } from "@mui/icons-material";

import {
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

export default function ParticipantEnd() {
  const participantName =
    sessionStorage.getItem("participant_name") ??
    "Participant";

  const qcmTitle =
    sessionStorage.getItem(
      "participant_qcm_title"
    ) ?? "QCM Formation Pro";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#071F4A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 600,
          borderRadius: 4,
          textAlign: "center",
          boxShadow: "0 15px 50px rgba(0,0,0,0.25)",
        }}
      >
        <Box sx={{ height: 8, bgcolor: "#E3062C" }} />

        <CardContent sx={{ p: { xs: 4, md: 6 } }}>
          <CheckCircle
            sx={{
              fontSize: 85,
              color: "#039855",
            }}
          />

          <Typography
            variant="h3"
            sx={{
              color: "#071F4A",
              fontWeight: 800,
              mt: 2,
            }}
          >
            Merci {participantName}
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: "#344054",
              mt: 3,
            }}
          >
            Votre questionnaire « {qcmTitle} » est
            terminé.
          </Typography>

          <Typography
            sx={{
              color: "#667085",
              mt: 2,
            }}
          >
            Vos réponses ont été enregistrées. Les
            résultats seront consultables par le
            formateur.
          </Typography>

          <Typography
            sx={{
              color: "#98A2B3",
              mt: 4,
            }}
          >
            Vous pouvez maintenant fermer cette page.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}