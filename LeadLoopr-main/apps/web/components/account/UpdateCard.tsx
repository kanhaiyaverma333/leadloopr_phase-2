import { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";

const UpdateCard = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpdateCard = async () => {
    if (!stripe || !elements) {
      setErrorMessage("Stripe has not loaded yet.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setErrorMessage("Card element not found.");
      setLoading(false);
      return;
    }

    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    if (error) {
      setErrorMessage(error.message || "Card error occurred.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/billing/update-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId: paymentMethod.id }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Card updated successfully!");
      } else {
        setErrorMessage(data.error || "Failed to update card");
      }
    } catch (e) {
      setErrorMessage("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto p-4 bg-white rounded shadow">
      <div className="p-4 border border-gray-300 rounded bg-gray-50 hover:border-blue-500 transition-colors">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#333",
                "::placeholder": {
                  color: "#888",
                },
              },
              invalid: {
                color: "#e53e3e",
              },
            },
          }}
        />
      </div>

      {errorMessage && (
        <p className="text-red-500 text-sm bg-red-100 p-2 rounded">{errorMessage}</p>
      )}

      <Button
        onClick={handleUpdateCard}
        disabled={!stripe || loading}
        className={`w-full ${!stripe || loading ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} text-white font-semibold py-2  transition-colors`}
      >
        {loading ? "Updating..." : "Update Card"}
      </Button>
    </div>
  );
};

export default UpdateCard;
