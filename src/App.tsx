import type { ReactNode } from "react";

import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateQcm from "./pages/CreateQcm";
import ShowQcm from "./pages/ShowQcm";
import EditQcm from "./pages/EditQcm";
import QuestionEditor from "./pages/QuestionEditor";
import LaunchSession from "./pages/LaunchSession";
import ParticipantFinished from "./pages/ParticipantFinished";
import ParticipantJoin from "./pages/ParticipantJoin";
import ParticipantQuiz from "./pages/ParticipantQuiz";
import ParticipantEnd from "./pages/ParticipantEnd";

function ProtectedRoute({
  children,
}: {
  children: ReactNode;
}) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/" element={<Login />} />

      <Route
        path="/join/:code"
        element={<ParticipantJoin />}
      />

      <Route
        path="/play/:code"
        element={<ParticipantQuiz />}
      />

     <Route
  path="/participant/finished"
  element={<ParticipantFinished />}
/>

      {/* Routes formateur protégées */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/qcms/create"
        element={
          <ProtectedRoute>
            <CreateQcm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/qcms/:id"
        element={
          <ProtectedRoute>
            <ShowQcm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/qcms/:id/edit"
        element={
          <ProtectedRoute>
            <EditQcm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/qcms/:id/questions"
        element={
          <ProtectedRoute>
            <QuestionEditor />
          </ProtectedRoute>
        }
      />

      <Route
        path="/qcms/:id/launch"
        element={
          <ProtectedRoute>
            <LaunchSession />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;