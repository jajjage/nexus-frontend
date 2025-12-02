import { topupService } from "@/services/topup.service";
import { TopupRequest, TopupResponse } from "@/types/topup.types";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

export function useTopup() {
  return useMutation<TopupResponse, AxiosError<any>, TopupRequest>({
    mutationFn: (data) => topupService.initiateTopup(data),
    onSuccess: (response) => {
      toast.success("Transaction Successful", {
        description: response.message || "Your topup is being processed.",
      });
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || "Topup failed. Please try again.";
      toast.error("Transaction Failed", {
        description: errorMessage,
      });
    },
  });
}
