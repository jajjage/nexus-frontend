"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { Transaction } from "@/types/wallet.types";
import { Download, Image, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { TransactionReceipt } from "./transaction-receipt";

interface ShareTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  operatorLogo?: string;
}

export function ShareTransactionDialog({
  isOpen,
  onClose,
  transaction,
  operatorLogo,
}: ShareTransactionDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShareAsImage = async () => {
    if (!receiptRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Create blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `receipt-${transaction.id.slice(0, 8)}.png`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success("Receipt downloaded as image");
        }
      });
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate receipt image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareAsPDF = async () => {
    if (!receiptRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Get canvas dimensions
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? "portrait" : "portrait",
        unit: "mm",
        format: "a4",
      });

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`receipt-${transaction.id.slice(0, 8)}.pdf`);
      toast.success("Receipt downloaded as PDF");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate receipt PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-4 py-4 sm:px-6">
          <DialogTitle className="text-lg sm:text-xl">
            Share Receipt
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Download your transaction receipt as an image or PDF
          </DialogDescription>
        </DialogHeader>

        {/* Receipt Preview - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
          <TransactionReceipt
            ref={receiptRef}
            transaction={transaction}
            operatorLogo={operatorLogo}
          />
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="border-t bg-white p-4 sm:flex sm:gap-3">
          <Button
            onClick={handleShareAsImage}
            disabled={isGenerating}
            className="mb-2 w-full sm:mb-0 sm:flex-1"
            variant="outline"
          >
            {isGenerating ? (
              <>
                <Spinner className="mr-2 size-4" />
                Generating...
              </>
            ) : (
              <>
                <Image className="mr-2 size-4" />
                Share as Image
              </>
            )}
          </Button>
          <Button
            onClick={handleShareAsPDF}
            disabled={isGenerating}
            className="w-full sm:flex-1"
          >
            {isGenerating ? (
              <>
                <Spinner className="mr-2 size-4" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 size-4" />
                Download as PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
