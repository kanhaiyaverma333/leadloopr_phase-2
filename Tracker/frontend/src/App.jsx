import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Box,
  Divider,
  Button,
} from "@mui/material";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import Grid from "@mui/material/Grid";
import moment from "moment";
import axiosInstance from "./utils/axios";
import { formatKey } from "./utils/utils";
import { useNavigate } from "react-router-dom";

function App() {
  const [formData, setFormData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance
      .get("/form-data")
      .then((res) => {
        setFormData(res.data?.formData || res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setLoading(false);
      });
  }, []);

  return (
    <Container sx={{ py: 4 }}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
        sx={{
          borderBottom: "2px solid black",
          pb: 1,
        }}
      >
        {/* Left side - title */}
        <Box display="flex" alignItems="center" gap={1}>
          <AssignmentTurnedInIcon fontSize="medium" color="primary" />
          <Typography
            variant="h4"
            fontWeight={600}
            sx={{ color: "primary.main", lineHeight: 1.2 }}
          >
            Submitted Form Data
          </Typography>
        </Box>

        {/* Right side - buttons */}
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate("/user")}
          >
            User Form
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate("/company")}
          >
            Employee Form
          </Button>
        </Box>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {formData.length !== 0 && (
            <Grid container spacing={3}>
              {formData.map((item, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      border: "1px solid #ccc",
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      transition: "0.2s",
                      "&:hover": {
                        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                        borderColor: "primary.main",
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box
                        mb={2}
                        p={1}
                        bgcolor="black"
                        color="white"
                        fontWeight={600}
                        fontSize="14px"
                        textAlign="center"
                        borderTopLeftRadius={8}
                        borderTopRightRadius={8}
                      >
                        Org ID: {item.org_id}
                      </Box>
                      {Object.keys(item).length === 2 && (
                        <Box
                          mb={2}
                          p={1}
                          // bgcolor="black"
                          // color="white"
                          fontWeight={600}
                          fontSize="14px"
                          textAlign="center"
                          borderTopLeftRadius={8}
                          borderTopRightRadius={8}
                        >
                          Form submitted successfully
                        </Box>
                      )}
                      {Object.entries(item).map(([key, value]) =>
                        key !== "timestamp" && key !== "org_id" ? (
                          <Box key={key} display="flex" gap={1} mb={1}>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="text.secondary"
                              sx={{ minWidth: "120px" }}
                            >
                              {formatKey(key)}:
                            </Typography>
                            <Typography variant="body2" color="text.primary">
                              {String(value)}
                            </Typography>
                          </Box>
                        ) : null
                      )}
                    </CardContent>
                    <Divider />
                    <Box px={2} py={1} textAlign="right" bgcolor="#f9f9f9">
                      <Typography variant="caption" color="text.secondary">
                        Submitted {moment(item.timestamp).fromNow()}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
          {formData.length === 0 && (
            <Grid
              container
              spacing={3}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                mt={5}
                gap={1}
                sx={{
                  borderBottom: "2px solid black",
                  pb: 1,
                  width: "fit-content",
                }}
              >
                <Typography variant="h5" fontWeight={600}>
                  No records found
                </Typography>
              </Box>
            </Grid>
          )}
        </>
      )}
    </Container>
  );
}

export default App;
