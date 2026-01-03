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
import { Download, FileImage } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExportReceipt } from "./export-receipt";
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
  const exportReceiptRef = useRef<HTMLDivElement>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return "N/A";

    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;

      // Check if date is valid
      if (dateObj instanceof Date && isNaN(dateObj.getTime())) {
        console.warn(`Invalid date received: ${date}`);
        return "Invalid Date";
      }

      return dateObj.toLocaleString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.warn(`Error parsing date: ${date}`, error);
      return "Invalid Date";
    }
  };

  // Convert HTML element to Blob
  const elementToBlob = async (element: HTMLElement): Promise<Blob> => {
    const canvas = await import("html2canvas").then((m) => m.default);
    const canvasElement = await canvas(element, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      imageTimeout: 0,
      windowHeight: element.scrollHeight,
      windowWidth: element.scrollWidth,
    });

    return new Promise((resolve, reject) => {
      canvasElement.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        },
        "image/png",
        0.95
      );
    });
  };

  const generateShareText = (tx: Transaction) => {
    const amount = tx.amount.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
    });

    const date = formatDate(tx.createdAt);
    const status = tx.related?.status || "N/A";
    const recipient = tx.related?.recipient_phone || "-";
    const provider =
      tx.related?.operatorCode || tx.related?.operator?.name || "-";

    return `Nexus Receipt\nTransaction ID: ${tx.id}\nAmount: ${amount}\nStatus: ${status}\nProvider: ${provider}\nRecipient: ${recipient}\nDate: ${date}`;
  };

  // Wait for images inside an element to load (useful when cloning an element that wasn't rendered)
  const waitForImages = (el: HTMLElement, timeout = 5000) => {
    const imgs = Array.from(el.querySelectorAll("img")) as HTMLImageElement[];
    if (imgs.length === 0) return Promise.resolve();

    return new Promise<void>((resolve) => {
      let remaining = imgs.length;
      const onDone = () => {
        remaining -= 1;
        if (remaining <= 0) resolve();
      };

      imgs.forEach((img) => {
        // attempt to set crossOrigin to increase chance of being captured
        try {
          img.crossOrigin = "anonymous";
        } catch {}

        if (img.complete && img.naturalWidth !== 0) {
          onDone();
        } else {
          const t = setTimeout(() => {
            // timeout for this image
            try {
              img.removeEventListener("load", onDone);
            } catch {}
            onDone();
          }, timeout);

          img.addEventListener("load", () => {
            clearTimeout(t);
            onDone();
          });
          img.addEventListener("error", () => {
            clearTimeout(t);
            onDone();
          });
        }
      });
    });
  };

  const handleShareAsImage = async () => {
    if (!exportReceiptRef.current) return;

    setIsGeneratingImage(true);
    try {
      const element = exportReceiptRef.current.cloneNode(true) as HTMLElement;
      const tempContainer = document.createElement("div");
      // keep the container in layout but moved off-screen so html2canvas can render it
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "0";
      tempContainer.style.top = "0";
      tempContainer.style.transform = "translateX(-10000px)";
      tempContainer.style.width = "100%";
      tempContainer.style.display = "block";
      tempContainer.appendChild(element);
      document.body.appendChild(tempContainer);

      try {
        // ensure cloned element has a concrete width and images loaded
        element.style.width = element.style.width || "400px";
        await waitForImages(element);

        const canvas = await import("html2canvas").then((m) => m.default);
        const canvasElement = await canvas(element, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          imageTimeout: 0,
          windowHeight: element.scrollHeight || element.offsetHeight,
          windowWidth: element.scrollWidth || element.offsetWidth,
        });

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvasElement.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Failed to create blob"));
            },
            "image/png",
            0.92
          );
        });

        const file = new File(
          [blob],
          `nexus-receipt-${transaction.id.slice(0, 8)}.png`,
          { type: "image/png" }
        );

        // Use Web Share API with files
        const shareText = generateShareText(transaction);

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Nexus Transaction Receipt",
            text: shareText,
          });
          onClose();
          toast.success("Shared successfully!");
        } else {
          // Fallback: Download the image
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          try {
            await navigator.clipboard.writeText(shareText);
            toast.success(
              "Receipt downloaded and share text copied to clipboard"
            );
          } catch {
            toast.success("Receipt downloaded as image");
          }
        }
      } finally {
        document.body.removeChild(tempContainer);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Share image failed:", error);
        toast.error("Failed to share receipt as image");
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleShareAsPDF = async () => {
    if (!exportReceiptRef.current) return;

    setIsGeneratingPDF(true);
    try {
      const element = exportReceiptRef.current.cloneNode(true) as HTMLElement;
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "0";
      tempContainer.style.top = "0";
      tempContainer.style.transform = "translateX(-10000px)";
      tempContainer.style.width = "100%";
      tempContainer.style.display = "block";
      tempContainer.appendChild(element);
      document.body.appendChild(tempContainer);

      try {
        element.style.width = element.style.width || "400px";
        await waitForImages(element);

        const canvas = await import("html2canvas").then((m) => m.default);
        const { jsPDF } = await import("jspdf");

        // Use lower scale and JPEG to reduce PDF size
        const canvasElement = await canvas(element, {
          backgroundColor: "#ffffff",
          scale: 1,
          useCORS: true,
          allowTaint: true,
          logging: false,
          imageTimeout: 0,
          windowHeight: element.scrollHeight || element.offsetHeight,
          windowWidth: element.scrollWidth || element.offsetWidth,
        });

        const imgData = canvasElement.toDataURL("image/jpeg", 0.8);
        const imgWidth = 120; // mm
        const imgHeight =
          (canvasElement.height * imgWidth) / canvasElement.width;

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const x = (pageWidth - imgWidth) / 2;
        const y = 15;

        pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight);

        // Get PDF as blob
        const pdfBlob = pdf.output("blob");
        const file = new File(
          [pdfBlob],
          `nexus-receipt-${transaction.id.slice(0, 8)}.pdf`,
          { type: "application/pdf" }
        );

        const shareText = generateShareText(transaction);

        // Use Web Share API with files
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Nexus Transaction Receipt",
            text: shareText,
          });
          onClose();
          toast.success("Shared successfully!");
        } else {
          // Fallback: Download the PDF
          pdf.save(file.name);
          try {
            await navigator.clipboard.writeText(shareText);
            toast.success(
              "Receipt downloaded and share text copied to clipboard"
            );
          } catch {
            toast.success("Receipt downloaded as PDF");
          }
        }
      } finally {
        document.body.removeChild(tempContainer);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Share PDF failed:", error);
        toast.error("Failed to share receipt as PDF");
      }
    } finally {
      setIsGeneratingPDF(false);
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
            Share your transaction receipt via WhatsApp, Instagram, Email, and
            more
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

        {/* Hidden Export Receipt for file generation */}
        <div style={{ display: "none" }}>
          <ExportReceipt
            ref={exportReceiptRef}
            transaction={transaction}
            operatorLogo={operatorLogo}
          />
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="border-t bg-white p-4 sm:flex sm:gap-3">
          <Button
            onClick={handleShareAsImage}
            disabled={isGeneratingImage}
            className="mb-2 w-full sm:mb-0 sm:flex-1"
            variant="outline"
          >
            {isGeneratingImage ? (
              <>
                <Spinner className="mr-2 size-4" />
                Generating...
              </>
            ) : (
              <>
                <FileImage className="mr-2 size-4" />
                Share as Image
              </>
            )}
          </Button>
          <Button
            onClick={handleShareAsPDF}
            disabled={isGeneratingPDF}
            className="w-full sm:flex-1"
          >
            {isGeneratingPDF ? (
              <>
                <Spinner className="mr-2 size-4" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 size-4" />
                Share as PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
