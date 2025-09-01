import React from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Stack,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axiosInstance from "./utils/axios";
import { useNavigate } from "react-router-dom";

// Schema
const schema = z.object({
  employee_name: z.string().min(1, "Employee Name is required"),
  employee_email: z.string().min(1, "Employee Email is required"),
  company: z.string().min(1, "Company is required"),
});

function EmployeeForm() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await axiosInstance.post("/user-data", data);
      navigate("/");
    } catch (error) {
      console.error("Submission error", error);
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom color="primary">
        Employee Form
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2}>
          <TextField
            label="Employee Name"
            {...register("employee_name")}
            error={!!errors.employee_name}
            helperText={errors.employee_name?.message}
            fullWidth
          />
          <TextField
            label="Employee Email"
            type="email"
            {...register("employee_email")}
            error={!!errors.employee_email}
            helperText={errors.employee_email?.message}
            fullWidth
          />
          <TextField
            label="Company"
            {...register("company")}
            error={!!errors.company}
            helperText={errors.company?.message}
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{ mt: 2 }}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}

export default EmployeeForm;
