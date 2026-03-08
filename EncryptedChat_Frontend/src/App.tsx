import AppRouter from './routes/AppRouter';
import { ToastProvider } from './contexts/ToastProvider';

function App() {
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  );
}

export default App;
