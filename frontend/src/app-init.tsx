import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  CssBaseline,
  Paper,
  StyledEngineProvider,
  ThemeProvider,
  Toolbar,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import theme from "./theme";
import { useEffect, useMemo, useState } from "react";
import { ExampleService } from "./services/example.service";
import Login from "./login";
 import { Link } from 'react-router-dom';



function App() {
    const exampleService = useMemo(function initExampleService() {
      return new ExampleService();
    }, []);
  
    const [disabled, setDisabled] = useState(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    
    useEffect(() => {
      if (token) {
        setDisabled(false);
      }
    }, []);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                BonusX Interview Challenge
              </Typography>
              <Button color="inherit">Login</Button>
            </Toolbar>
          </AppBar>

          

          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h4" gutterBottom>
                    Benvenuto nell'applicazione
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Questa è l'impostazione iniziale per l'app con Material-UI
                    configurato correttamente.
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" component="div">
                      Funzionalità 1
                    </Typography>
                    <Typography sx={{ mb: 1.5 }} color="text.secondary">
                      Login
                    </Typography>
                    <Typography variant="body2">
                      <Login/>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" component="div">
                      Funzionalità 2
                    </Typography>
                    <Typography sx={{ mb: 1.5 }} color="text.secondary">
                      Upload e lista file caricati
                    </Typography>
                   
                    <Typography variant="body2">
                     <Button color="inherit" disabled={disabled}>
                        <Link to="/upload">Upload/Download file</Link>
                      </Button>

                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={async () => {
                        const { message } = await exampleService.getMessage();
                        alert(message);
                      }}
                    >
                      Cliccami per fare una chiamata API
                    </Button>
                  </CardActions>
                </Card>
              </Grid>

              <Grid size={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Stato dell'applicazione
                  </Typography>
                  <Typography variant="body2">
                    ✅ Material-UI configurato correttamente
                    <br />
                    ✅ Tema personalizzabile
                    <br />
                    ✅ Font Roboto caricato
                    <br />
                    ✅ Layout responsivo
                    <br />✅ Componenti base implementati
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;
