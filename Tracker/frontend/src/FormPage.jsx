import React, { useEffect } from "react";
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
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(1, "Phone is required"),
  company: z.string().min(1, "Company is required"),
});

function FormPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  // ✅ Capture UTM + GCLID + FBCLID + MSCLKID on first load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Google Ads parameters
    const gclid = params.get("gclid");
    const utmSource = params.get("utm_source");
    const utmMedium = params.get("utm_medium");
    const utmCampaign = params.get("utm_campaign");

    // Meta/Facebook parameters
    const fbclid = params.get("fbclid");

    // Microsoft Ads parameters
    const msclkid = params.get("msclkid");

    // Store Google parameters
    if (gclid) localStorage.setItem("gclid", gclid);
    if (utmSource) localStorage.setItem("utm_source", utmSource);
    if (utmMedium) localStorage.setItem("utm_medium", utmMedium);
    if (utmCampaign) localStorage.setItem("utm_campaign", utmCampaign);

    // Store Facebook parameters
    if (fbclid) localStorage.setItem("fbclid", fbclid);

    // Store Microsoft parameters
    if (msclkid) localStorage.setItem("msclkid", msclkid);

    // Get Facebook Browser ID (_fbp cookie)
    const fbp = getFacebookBrowserId();
    if (fbp) localStorage.setItem("fbp", fbp);

  }, []);

  // Helper function to get Facebook Browser ID from cookie
  const getFacebookBrowserId = () => {
    const fbpCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('_fbp='));
    return fbpCookie ? fbpCookie.split('=')[1] : null;
  };

  // Generate unique event ID for deduplication
  const generateEventId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  // 🔥 TRACKING LOGIC SEPARATED
  const determineLeadSource = () => {
    const gclid = localStorage.getItem("gclid");
    const fbclid = localStorage.getItem("fbclid");
    const fbp = localStorage.getItem("fbp");
    const msclkid = localStorage.getItem("msclkid");

    if (gclid) {
      return { type: 'GOOGLE', gclid };
    } else if (msclkid) {
      return { type: 'MICROSOFT', msclkid };
    } else if (fbclid || fbp) {
      return { type: 'META', fbclid, fbp };
    } else {
      return { type: 'ORGANIC' };
    }
  };

  const buildPayload = (formData, leadSource) => {
    const basePayload = {
      // Form data
      name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      organizationId: "org_30rsmoNgESvFPJjmTrn0hUmB3Gx",

      // Common tracking data
      landingPageUrl: window.location.href,
      referrerUrl: document.referrer,
      firstSeenAt: new Date().toISOString(),
      consentStatus: "UNKNOWN",
      clientIpAddress: null,
      clientUserAgent: navigator.userAgent,
      leadSource: leadSource.type,
    };

    // Add source-specific tracking data
    switch (leadSource.type) {
      case 'GOOGLE':
        return {
          ...basePayload,
          gclid: leadSource.gclid,
          utmSource: localStorage.getItem("utm_source") || null,
          utmMedium: localStorage.getItem("utm_medium") || null,
          utmCampaign: localStorage.getItem("utm_campaign") || null,
          conversionActionId: import.meta.env.VITE_CONVERSION_ID,
        };
      
      case 'MICROSOFT':
        return {
          ...basePayload,
          msclkid: leadSource.msclkid,
          utmSource: localStorage.getItem("utm_source") || null,
          utmMedium: localStorage.getItem("utm_medium") || null,
          utmCampaign: localStorage.getItem("utm_campaign") || null,
          microsoftConversionId: "187208348",
        };
      
      case 'META':
        return {
          ...basePayload,
          fbclid: leadSource.fbclid,
          metaFbp: leadSource.fbp,
          metaPixelId: "3030047790492973",
          metaEventId: generateEventId(),
        };
      
      default:
        return basePayload;
    }
  };

  const fireConversionTracking = (leadSource, formData, eventId) => {
    switch (leadSource.type) {
      case 'GOOGLE':
        if (window.gtag) {
          console.log("✅ Firing Google Ads conversion...");
          window.gtag("event", "conversion", {
            send_to: `${import.meta.env.VITE_CONVERSION_ID}/${import.meta.env.VITE_CONVERSION_LABEL}`,
            event_callback: () => {
              console.log("✅ Google Ads conversion callback");
            },
          });
        }
        break;

      case 'MICROSOFT':
        if (typeof window.uet_report_conversion === 'function') {
          console.log("✅ Firing Microsoft Ads conversion...");
          window.uet_report_conversion();
        } else if (window.uetq) {
          console.log("✅ Firing Microsoft Ads conversion (fallback)...");
          window.uetq = window.uetq || [];
          window.uetq.push('event', 'submit_lead_form', {
            event_category: 'conversion',
            event_label: 'contact_form_submission',
            revenue_value: 10.00,
            currency: 'USD'
          });
        }
        break;

      case 'META':
        if (window.fbq) {
          console.log("✅ Firing Meta Pixel Lead event...");
          window.fbq('track', 'Lead', {
            content_name: 'Contact Form Lead',
            content_category: 'Lead Generation',
            value: 10.00,
            currency: 'USD',
            lead_type: 'contact_form',
            source: 'website',
            form_name: 'main_contact_form',
          }, {
            eventID: eventId
          });
        }
        break;

      default:
        console.log("✅ Organic lead - no conversion tracking fired");
    }
  };

  const clearTrackingData = () => {
    const keysToRemove = [
      "gclid", "utm_source", "utm_medium", "utm_campaign", 
      "fbclid", "fbp", "msclkid"
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    localStorage.setItem("conversion_fired", "true");
  };

  // 🚀 MAIN SUBMISSION HANDLER
  const onSubmit = async (data) => {
    try {
      const eventId = generateEventId();
      const leadSource = determineLeadSource();
      const payload = buildPayload(data, leadSource);

      console.log("🎯 Lead Source:", leadSource.type);
      console.log("📦 Submitting payload:", payload);

      // ✅ Send to backend
      await axiosInstance.post("http://localhost:3000/api/leads/add-lead", payload);

      // ✅ Fire appropriate conversion tracking
      fireConversionTracking(leadSource, data, eventId);

      // ✅ Clear stored tracking data
      clearTrackingData();

      // ✅ Navigate to thank you page
      setTimeout(() => {
        navigate("/thank-you");
      }, 500);

    } catch (error) {
      console.error("❌ Submission error", error);
      alert("Submission failed. Please try again.");
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom color="primary">
        User Form
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2}>
          <TextField
            label="Full Name"
            {...register("full_name")}
            error={!!errors.full_name}
            helperText={errors.full_name?.message}
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
            fullWidth
          />
          <TextField
            label="Phone"
            {...register("phone")}
            error={!!errors.phone}
            helperText={errors.phone?.message}
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

export default FormPage;